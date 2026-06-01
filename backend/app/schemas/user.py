from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
# UUID replaced with str for SQLite
from app.models import UserRole


def validate_bcrypt_password(value: Optional[str]) -> Optional[str]:
    if value is not None and len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return value


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.PUBLIC


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return validate_bcrypt_password(value) or value


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class AdminAccountCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return validate_bcrypt_password(value) or value


class AdminAccountUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        return validate_bcrypt_password(value)


class UserResponse(UserBase):
    id: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminAccountListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    limit: int
    offset: int


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return validate_bcrypt_password(value) or value
