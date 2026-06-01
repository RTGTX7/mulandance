from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.translations import ensure_text_column, localized_payload, set_translation_bundle, translation_bundle
from app.models import FacultyMember, User
from app.schemas.faculty import (
    FacultyMemberCreate,
    FacultyMemberResponse,
    FacultyMemberUpdate,
)


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")
TRANSLATABLE_FIELDS = ("name", "role", "bio", "specialties", "achievements")


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user


def require_admin_or_editor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def _ordered_query(db: Session):
    ensure_text_column(db, "faculty_members")
    return db.query(FacultyMember).order_by(
        FacultyMember.order_index.asc(),
        FacultyMember.created_at.asc(),
    )


def _faculty_response(member: FacultyMember, locale: str | None = None, include_translations: bool = False) -> FacultyMemberResponse:
    data = {
        "id": member.id,
        "photo_url": member.photo_url,
        "is_active": bool(member.is_active),
        "order_index": member.order_index or 0,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
        "translations": translation_bundle(member) if include_translations else {},
    }
    data.update(localized_payload(member, TRANSLATABLE_FIELDS, locale))
    return FacultyMemberResponse(**data)


@router.get("", response_model=List[FacultyMemberResponse])
def list_public_faculty(locale: str | None = None, db: Session = Depends(get_db)):
    members = _ordered_query(db).filter(FacultyMember.is_active == True).all()
    return [_faculty_response(member, locale) for member in members]


@router.get("/admin/list", response_model=List[FacultyMemberResponse])
def list_admin_faculty(
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    members = _ordered_query(db).all()
    return [_faculty_response(member, include_translations=True) for member in members]


@router.post("", response_model=FacultyMemberResponse)
def create_faculty_member(
    payload: FacultyMemberCreate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    translations = data.pop("translations", None)
    member = FacultyMember(**data)
    set_translation_bundle(member, translations)
    db.add(member)
    db.commit()
    db.refresh(member)
    return _faculty_response(member, include_translations=True)


@router.put("/{member_id}", response_model=FacultyMemberResponse)
def update_faculty_member(
    member_id: str,
    payload: FacultyMemberUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    member = db.query(FacultyMember).filter(FacultyMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    updates = payload.model_dump(exclude_unset=True)
    translations = updates.pop("translations", None)
    for field, value in updates.items():
        setattr(member, field, value)
    if translations is not None:
        set_translation_bundle(member, translations)

    db.commit()
    db.refresh(member)
    return _faculty_response(member, include_translations=True)


@router.delete("/{member_id}")
def delete_faculty_member(
    member_id: str,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    member = db.query(FacultyMember).filter(FacultyMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    db.delete(member)
    db.commit()
    return {"detail": "Faculty member deleted"}
