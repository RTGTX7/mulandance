from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import decode_token
from app.core.translations import (
    ensure_text_column,
    localized_payload,
    normalize_locale,
    set_translation_bundle,
    translation_bundle,
)
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse, ProgramModuleCreate, ProgramModuleResponse
from app.models import Program, ProgramModule, User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")
TRANSLATABLE_FIELDS = ("name", "description", "category", "level", "syllabus_ref")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    return user


def require_admin_or_editor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return user


def _ensure_program_columns(db: Session) -> None:
    ensure_text_column(db, "programs")


def _program_response(program: Program, locale: str | None = None, include_translations: bool = False) -> ProgramResponse:
    data = {
        "id": program.id,
        "slug": program.slug,
        "category": program.category,
        "cover_image": program.cover_image,
        "order_index": program.order_index or 0,
        "is_active": bool(program.is_active),
        "created_at": program.created_at,
        "translations": translation_bundle(program) if include_translations else {},
    }
    data.update(localized_payload(program, TRANSLATABLE_FIELDS, locale))
    return ProgramResponse(**data)


@router.get("", response_model=List[ProgramResponse])
@router.get("/", response_model=List[ProgramResponse], include_in_schema=False)
def list_programs(
    category: Optional[str] = Query(None),
    is_active: bool = True,
    locale: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    _ensure_program_columns(db)
    query = db.query(Program).filter(Program.is_active == is_active)
    if category:
        query = query.filter(Program.category == category)
    programs = query.order_by(Program.order_index.asc(), Program.name.asc()).all()
    return [_program_response(program, locale) for program in programs]


@router.get("/admin/list", response_model=List[ProgramResponse])
def list_admin_programs(
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    _ensure_program_columns(db)
    programs = db.query(Program).order_by(Program.order_index.asc(), Program.name.asc()).all()
    return [_program_response(program, include_translations=True) for program in programs]


@router.post("", response_model=ProgramResponse)
@router.post("/", response_model=ProgramResponse, include_in_schema=False)
def create_program(
    program_data: ProgramCreate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    _ensure_program_columns(db)
    existing = db.query(Program).filter(Program.slug == program_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Program slug already exists")

    payload = program_data.model_dump()
    translations = payload.pop("translations", None)
    program = Program(**payload)
    set_translation_bundle(program, translations)
    db.add(program)
    db.commit()
    db.refresh(program)
    return _program_response(program, include_translations=True)


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: str,
    program_data: ProgramUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    _ensure_program_columns(db)
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    updates = program_data.model_dump(exclude_unset=True)
    translations = updates.pop("translations", None)
    if "slug" in updates and updates["slug"] != program.slug:
        existing = db.query(Program).filter(Program.slug == updates["slug"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Program slug already exists")

    for field, value in updates.items():
        setattr(program, field, value)
    if translations is not None:
        set_translation_bundle(program, translations)

    db.commit()
    db.refresh(program)
    return _program_response(program, include_translations=True)


@router.delete("/{program_id}")
def delete_program(
    program_id: str,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    db.delete(program)
    db.commit()
    return {"detail": "Program deleted"}


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(program_id: str, locale: Optional[str] = Query(None), db: Session = Depends(get_db)):
    _ensure_program_columns(db)
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return _program_response(program, locale, include_translations=True)


@router.get("/slug/{slug}", response_model=ProgramResponse)
def get_program_by_slug(slug: str, locale: Optional[str] = Query(None), db: Session = Depends(get_db)):
    _ensure_program_columns(db)
    program = db.query(Program).filter(Program.slug == slug).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return _program_response(program, locale)


@router.get("/{program_id}/modules", response_model=List[ProgramModuleResponse])
def list_program_modules(program_id: str, db: Session = Depends(get_db)):
    modules = (
        db.query(ProgramModule)
        .filter(ProgramModule.program_id == program_id)
        .order_by(ProgramModule.order_index)
        .all()
    )
    return modules
