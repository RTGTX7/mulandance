from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FacultyMemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    role: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = None
    photo_url: Optional[str] = Field(default=None, max_length=1000)
    specialties: Optional[str] = None
    achievements: Optional[str] = None
    is_active: bool = True
    order_index: int = 0


class FacultyMemberCreate(FacultyMemberBase):
    pass


class FacultyMemberUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    role: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = None
    photo_url: Optional[str] = Field(default=None, max_length=1000)
    specialties: Optional[str] = None
    achievements: Optional[str] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class FacultyMemberResponse(FacultyMemberBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
