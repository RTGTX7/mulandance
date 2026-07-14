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


class AdminAccountCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    account_type: Optional[Literal["teacher", "staff_admin", "parent", "student", "alumni"]] = None
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None
    phone: Optional[str] = None

class AdminAccountUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname_zh: Optional[str] = None
    nickname_en: Optional[str] = None
    nickname_fr: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    account_type: Optional[Literal["teacher", "staff_admin", "parent", "student", "alumni"]] = None
    provisioning_status: Optional[Literal["pending", "active", "rejected"]] = None


class UserResponse(UserBase):
    id: str
    first_name: str
    last_name: str
    nickname_zh: str = ""
    nickname_en: str = ""
    nickname_fr: str = ""
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    account_type: Optional[str] = None
    provisioning_status: str = "active"
    logto_linked: bool = False
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


class LogtoSessionIdentity(BaseModel):
    payload: str
    signature: str


class LogtoSessionResponse(BaseModel):
    status: Literal["active", "pending_binding", "pending_activation", "rejected", "not_provisioned"]
    redirect_path: Optional[str] = None
    user: Optional[UserResponse] = None


class LogtoBindingRequestResponse(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    logto_subject: str
    requested_account_type: Optional[str] = None
    status: str
    review_note: str = ""
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class LogtoBindingReview(BaseModel):
    account_type: Optional[Literal["teacher", "staff_admin", "parent", "student", "alumni"]] = None
    note: str = ""


class AccountTypeDefaultResponse(BaseModel):
    account_type: Literal["teacher", "staff_admin", "parent", "student", "alumni"]
    preset_id: Optional[str] = None


class AccountTypeDefaultUpdate(BaseModel):
    preset_id: Optional[str] = None


class AccountTypePermissionSync(BaseModel):
    confirm: bool = False
    user_ids: list[str] = Field(default_factory=list)


class AccountTypePermissionSyncResponse(BaseModel):
    updated: int
