from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ClassroomBookingBase(BaseModel):
    room: str = Field(pattern="^(large|small)$")
    booking_type: str = Field(default="internal", pattern="^(internal|external)$")
    status: str = Field(default="confirmed", pattern="^(pending|confirmed|rejected)$")
    title: str
    teacher_name: Optional[str] = None
    applicant_name: Optional[str] = None
    applicant_contact: Optional[str] = None
    day_of_week: int = Field(ge=0, le=6)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    notes: Optional[str] = None


class ClassroomBookingCreate(ClassroomBookingBase):
    captcha_token: Optional[str] = None
    captcha_answer: Optional[str] = None


class ClassroomCaptchaResponse(BaseModel):
    question: str
    token: str


class ClassroomCaptchaVerify(BaseModel):
    token: str
    answer: str


class ClassroomBookingUpdate(BaseModel):
    room: Optional[str] = Field(default=None, pattern="^(large|small)$")
    booking_type: Optional[str] = Field(default=None, pattern="^(internal|external)$")
    status: Optional[str] = Field(default=None, pattern="^(pending|confirmed|rejected)$")
    title: Optional[str] = None
    teacher_name: Optional[str] = None
    applicant_name: Optional[str] = None
    applicant_contact: Optional[str] = None
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    notes: Optional[str] = None


class ClassroomBookingResponse(ClassroomBookingBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassroomBookingCreateResponse(BaseModel):
    booking: ClassroomBookingResponse
    receipt_email: Optional[str] = None
    receipt_status: Literal["sent", "not_requested", "not_configured", "failed"] = "not_requested"
