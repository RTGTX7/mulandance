from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import decode_token
from app.schemas.program import ProgramCreate, ProgramUpdate, ProgramResponse, ProgramModuleCreate, ProgramModuleResponse
from app.models import Program, ProgramModule, User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")


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
    if user.role not in ("admin", "editor", "faculty"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return user


@router.get("/", response_model=List[ProgramResponse])
def list_programs(
    category: Optional[str] = Query(None),
    is_active: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Program).filter(Program.is_active == is_active)
    if category:
        query = query.filter(Program.category == category)
    return query.order_by(Program.order_index.asc(), Program.name.asc()).all()


@router.get("/admin/list", response_model=List[ProgramResponse])
def list_admin_programs(
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    return db.query(Program).order_by(Program.order_index.asc(), Program.name.asc()).all()


@router.post("/", response_model=ProgramResponse)
def create_program(
    program_data: ProgramCreate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    existing = db.query(Program).filter(Program.slug == program_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Program slug already exists")

    program = Program(**program_data.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: str,
    program_data: ProgramUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    updates = program_data.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] != program.slug:
        existing = db.query(Program).filter(Program.slug == updates["slug"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Program slug already exists")

    for field, value in updates.items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)
    return program


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
def get_program(program_id: str, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/slug/{slug}", response_model=ProgramResponse)
def get_program_by_slug(slug: str, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.slug == slug).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/{program_id}/modules", response_model=List[ProgramModuleResponse])
def list_program_modules(program_id: str, db: Session = Depends(get_db)):
    modules = (
        db.query(ProgramModule)
        .filter(ProgramModule.program_id == program_id)
        .order_by(ProgramModule.order_index)
        .all()
    )
    return modules
