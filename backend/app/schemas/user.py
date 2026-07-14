from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
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
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return validate_bcrypt_password(value) or value


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class AdminAccountCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return validate_bcrypt_password(value) or value


class AdminAccountUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        return validate_bcrypt_password(value)


class UserResponse(UserBase):
    id: str
    first_name: str
    last_name: str
    nickname_zh: str = ""
    nickname_en: str = ""
    nickname_fr: str = ""
    avatar_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def new_password_fits_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        return validate_bcrypt_password(value)
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    permissions: dict[str, dict[str, bool]] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class AdminAccountListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    limit: int
    offset: int


class PermissionCatalogItem(BaseModel):
    key: str
    group: str
    parent: Optional[str] = None
    label_key: str


class PermissionGrant(BaseModel):
    key: str
    can_view: bool = False
    can_manage: bool = False


class AccountPermissionsResponse(BaseModel):
    user_id: str
    permissions: list[PermissionGrant]
    effective_permissions: dict[str, dict[str, bool]]


class AccountPermissionsUpdate(BaseModel):
    permissions: list[PermissionGrant]


class PermissionPresetBody(BaseModel):
    name: str
    description: str = ""
    permissions: list[PermissionGrant]


class PermissionPresetResponse(PermissionPresetBody):
    id: str
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


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
