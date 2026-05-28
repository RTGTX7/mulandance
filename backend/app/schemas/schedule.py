from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CourseScheduleItemBase(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    title: str = Field(min_length=1, max_length=200)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    description: Optional[str] = ""
    location: str = Field(min_length=1, max_length=300)
    is_active: bool = True
    order_index: int = 0


class CourseScheduleItemCreate(CourseScheduleItemBase):
    pass


class CourseScheduleItemUpdate(BaseModel):
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, min_length=1, max_length=300)
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class CourseScheduleItemResponse(CourseScheduleItemBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SchoolPolicyBase(BaseModel):
    title: str = Field(default="学校规章制度及退费规则", max_length=200)
    body_markdown: str = ""


class SchoolPolicyUpdate(SchoolPolicyBase):
    pass


class SchoolPolicyResponse(SchoolPolicyBase):
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
