from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
# UUID replaced with str for SQLite
from app.models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.PUBLIC


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
