from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.core.permissions import require_user_permission
from app.core.translations import ensure_text_column, localized_payload, set_translation_bundle, translation_bundle
from app.models import FacultyMember, User
from app.schemas.faculty import (
    FacultyMemberCreate,
    FacultyMemberResponse,
    FacultySelfUpdate,
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


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super administrator access required")
    return user


def require_faculty_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "teaching.faculty", "manage")


def require_teacher_account(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher account required")
    return user


def _ordered_query(db: Session):
    ensure_text_column(db, "faculty_members")
    return db.query(FacultyMember).order_by(
        FacultyMember.order_index.asc(),
        FacultyMember.created_at.asc(),
    )


def _faculty_response(member: FacultyMember, locale: str | None = None, include_translations: bool = False, include_account: bool = False) -> FacultyMemberResponse:
    data = {
        "id": member.id,
        "photo_url": member.photo_url,
        "is_active": bool(member.is_active),
        "order_index": member.order_index or 0,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
        "user_id": member.user_id if include_account else None,
        "is_self_managed": bool(member.user_id) if include_account else False,
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
    user: User = Depends(require_faculty_manage),
    db: Session = Depends(get_db),
):
    members = _ordered_query(db).all()
    return [_faculty_response(member, include_translations=True, include_account=True) for member in members]


@router.post("", response_model=FacultyMemberResponse)
def create_faculty_member(
    payload: FacultyMemberCreate,
    user: User = Depends(require_faculty_manage),
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
    user: User = Depends(require_faculty_manage),
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
    user: User = Depends(require_faculty_manage),
    db: Session = Depends(get_db),
):
    member = db.query(FacultyMember).filter(FacultyMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    db.delete(member)
    db.commit()
    return {"detail": "Faculty member deleted"}


@router.get("/me/profile", response_model=FacultyMemberResponse)
def get_my_faculty_profile(
    user: User = Depends(require_teacher_account),
    db: Session = Depends(get_db),
):
    member = db.query(FacultyMember).filter(FacultyMember.user_id == user.id).first()
    if not member:
        from app.models import UserProfile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        display_name = (
            profile.nickname_zh or profile.first_name or ""
        ).strip() if profile else ""
        matches = db.query(FacultyMember).filter(FacultyMember.user_id.is_(None), FacultyMember.name == display_name).all() if display_name else []
        if len(matches) == 1:
            member = matches[0]
            member.user_id = user.id
        else:
            member = FacultyMember(user_id=user.id, name=display_name or "Teacher", is_active=False, order_index=0)
            set_translation_bundle(member, {"zh": {"name": display_name}, "en": {}, "fr": {}})
            db.add(member)
        db.commit(); db.refresh(member)
    return _faculty_response(member, include_translations=True, include_account=True)


@router.put("/me/profile", response_model=FacultyMemberResponse)
def update_my_faculty_profile(
    payload: FacultySelfUpdate,
    user: User = Depends(require_teacher_account),
    db: Session = Depends(get_db),
):
    member = db.query(FacultyMember).filter(FacultyMember.user_id == user.id).first()
    if not member:
        member = FacultyMember(user_id=user.id, name=payload.name.strip(), is_active=False, order_index=0)
        db.add(member)
    updates = payload.model_dump(exclude_unset=True)
    translations = updates.pop("translations", None)
    for field, value in updates.items():
        setattr(member, field, value)
    if translations is not None:
        set_translation_bundle(member, translations)
    db.commit(); db.refresh(member)
    return _faculty_response(member, include_translations=True, include_account=True)
