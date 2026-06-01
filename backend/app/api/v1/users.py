from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.user import (
    AdminAccountCreate,
    AdminAccountListResponse,
    AdminAccountUpdate,
    UserCreate,
    UserResponse,
    Token,
    LoginRequest,
    UserUpdate,
)
from app.models import User, UserProfile

router = APIRouter()

SUPER_ADMIN_ROLE = "super_admin"
TEACHER_ADMIN_ROLE = "admin"
ADMIN_ROLES = {SUPER_ADMIN_ROLE, TEACHER_ADMIN_ROLE}


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    payload = decode_token(authorization[7:])
    if not payload:
        return None
    return payload.get("sub")


def _get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> User:
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return user


def _require_super_admin(user: User = Depends(_get_current_user)) -> User:
    if user.role != SUPER_ADMIN_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return user


def _response_for_user(user: User, db: Session) -> UserResponse:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        first_name=profile.first_name if profile else "",
        last_name=profile.last_name if profile else "",
        avatar_url=profile.avatar_url if profile else None,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = get_password_hash(user_data.password)
    user = User(email=user_data.email, password_hash=hashed, role="public")
    db.add(user)
    db.flush()

    profile = UserProfile(
        user_id=user.id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    return _response_for_user(user, db)


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
def get_me(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _response_for_user(user, db)


@router.put("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        if user_update.first_name is not None:
            profile.first_name = user_update.first_name
        if user_update.last_name is not None:
            profile.last_name = user_update.last_name
        if user_update.phone is not None:
            profile.phone = user_update.phone
        if user_update.avatar_url is not None:
            profile.avatar_url = user_update.avatar_url

    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)


@router.get("/admin/accounts", response_model=AdminAccountListResponse)
def list_teacher_admin_accounts(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    super_admin: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == TEACHER_ADMIN_ROLE)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(User.email.ilike(term))
    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    elif status_filter == "disabled":
        query = query.filter(User.is_active.is_(False))
    elif status_filter != "all":
        raise HTTPException(status_code=400, detail="Invalid status filter")

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return AdminAccountListResponse(
        items=[_response_for_user(user, db) for user in users],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/admin/accounts", response_model=UserResponse)
def create_teacher_admin_account(
    account: AdminAccountCreate,
    super_admin: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == account.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=account.email,
        password_hash=get_password_hash(account.password),
        role=TEACHER_ADMIN_ROLE,
        is_active=True,
    )
    db.add(user)
    db.flush()

    db.add(UserProfile(user_id=user.id, first_name=account.first_name, last_name=account.last_name))
    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)


@router.put("/admin/accounts/{user_id}", response_model=UserResponse)
def update_teacher_admin_account(
    user_id: str,
    account: AdminAccountUpdate,
    super_admin: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.role == TEACHER_ADMIN_ROLE).first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher admin account not found")

    if account.is_active is not None:
        user.is_active = account.is_active
    if account.password:
        user.password_hash = get_password_hash(account.password)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id, first_name="", last_name="")
        db.add(profile)
    if account.first_name is not None:
        profile.first_name = account.first_name
    if account.last_name is not None:
        profile.last_name = account.last_name

    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)
