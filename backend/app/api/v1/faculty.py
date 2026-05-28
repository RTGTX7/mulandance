from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import FacultyMember, User
from app.schemas.faculty import (
    FacultyMemberCreate,
    FacultyMemberResponse,
    FacultyMemberUpdate,
)


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user


def require_admin_or_editor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "editor", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def _ordered_query(db: Session):
    return db.query(FacultyMember).order_by(
        FacultyMember.order_index.asc(),
        FacultyMember.created_at.asc(),
    )


@router.get("", response_model=List[FacultyMemberResponse])
def list_public_faculty(db: Session = Depends(get_db)):
    return _ordered_query(db).filter(FacultyMember.is_active == True).all()


@router.get("/admin/list", response_model=List[FacultyMemberResponse])
def list_admin_faculty(
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    return _ordered_query(db).all()


@router.post("", response_model=FacultyMemberResponse)
def create_faculty_member(
    payload: FacultyMemberCreate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    member = FacultyMember(**payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


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

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


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
