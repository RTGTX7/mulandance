from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

date_type = date

BookingType = Literal["solo", "duet", "trio", "group", "rehearsal", "makeup", "private", "external_rental", "room_lock"]


class CourseTemplateBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    is_active: bool = True
    translations: dict = {}
    allow_unassigned_teacher: bool = False
    allow_unassigned_room: bool = False


class CourseTemplateResponse(CourseTemplateBody):
    id: str
    offering_count: int = 0
    is_ai_draft: bool = False
    draft_questions: list[dict] = Field(default_factory=list)
    draft_assumptions: list[dict] = Field(default_factory=list)
    unresolved_question_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class CourseDraftCreateBody(BaseModel):
    """Normalized fixed_course_import.v1 item, confirmed by an administrator."""
    template: dict = Field(default_factory=dict)
    offering: dict = Field(default_factory=dict)
    slots: list[dict] = Field(default_factory=list)
    questions: list[dict] = Field(default_factory=list)
    assumptions: list[dict] = Field(default_factory=list)


class CourseSlotBody(BaseModel):
    teacher_id: Optional[str] = None
    room_id: Optional[str] = None
    days_of_week: list[int] = Field(min_length=1)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    sort_order: int = 0

    @model_validator(mode="after")
    def validate_slot(self):
        self.days_of_week = sorted(set(self.days_of_week))
        if any(day < 0 or day > 6 for day in self.days_of_week):
            raise ValueError("days_of_week must only contain 0 through 6")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class CourseSlotResponse(CourseSlotBody):
    id: str
    offering_id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class CourseOfferingBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    start_date: date
    end_date: date
    is_active: bool = True
    is_public: bool = True
    slots: list[CourseSlotBody] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_offering(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        return self


class CourseOfferingResponse(CourseOfferingBody):
    id: str
    course_template_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class CourseSlotExceptionBody(BaseModel):
    date: date
    kind: Literal["cancel", "replace"] = "cancel"
    room_id: Optional[str] = None
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")


class CourseSlotExceptionResponse(CourseSlotExceptionBody):
    id: str
    slot_id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class StudioBody(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    is_active: bool = True


class StudioResponse(StudioBody):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class RoomBody(BaseModel):
    studio_id: str
    name: str = Field(min_length=1, max_length=160)
    sort_order: int = 0
    is_active: bool = True
    is_rentable: bool = False


class RoomResponse(RoomBody):
    id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class PublicRentalResource(BaseModel):
    id: str
    studio_id: str
    studio_name: str
    name: str


class RoomOccupancy(BaseModel):
    room_id: str
    room_name: str
    date: date
    start_time: str
    end_time: str


RentalRequestMode = Literal["single", "weekly"]
RentalRequestStatus = Literal["pending", "confirmed", "rejected", "cancelled"]


class ExternalRentalRequestBody(BaseModel):
    room_id: str
    request_mode: RentalRequestMode
    date: Optional[date_type] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    days_of_week: list[int] = Field(default_factory=list)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    title: str = Field(min_length=1, max_length=200)
    applicant_name: str = Field(min_length=1, max_length=160)
    applicant_contact: str = Field(min_length=1, max_length=200)
    notes: str = ""
    captcha_token: Optional[str] = None
    captcha_answer: Optional[str] = None

    @model_validator(mode="after")
    def validate_request(self):
        if self.end_time != "00:00" and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.request_mode == "single":
            if not self.date:
                raise ValueError("date is required for a single-date request")
            self.start_date = self.date
            self.end_date = self.date
            self.days_of_week = []
        else:
            if not self.start_date or not self.end_date or self.end_date < self.start_date:
                raise ValueError("weekly requests need a valid date range")
            self.days_of_week = sorted(set(self.days_of_week))
            if not self.days_of_week or any(day < 0 or day > 6 for day in self.days_of_week):
                raise ValueError("weekly requests need one or more weekdays")
            self.date = None
        return self


class ExternalRentalRequestResponse(BaseModel):
    id: str
    room_id: str
    request_mode: RentalRequestMode
    date: Optional[date_type] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    days_of_week: list[int] = Field(default_factory=list)
    start_time: str
    end_time: str
    title: str
    applicant_name: str
    applicant_contact: str
    notes: str = ""
    status: RentalRequestStatus
    reviewed_by_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ExternalRentalRequestUpdate(ExternalRentalRequestBody):
    captcha_token: Optional[str] = None
    captcha_answer: Optional[str] = None


class ExternalRentalReview(BaseModel):
    note: str = ""


class FixedPlanBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    teacher_id: Optional[str] = None
    room_id: str
    day_of_week: int = Field(ge=0, le=6)
    days_of_week: list[int] = []
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    start_date: date
    end_date: date
    is_public: bool = True
    is_active: bool = True
    translations: dict = {}

    @model_validator(mode="after")
    def validate_range(self):
        selected_days = self.days_of_week or [self.day_of_week]
        if any(day < 0 or day > 6 for day in selected_days):
            raise ValueError("days_of_week must only contain 0 through 6")
        self.days_of_week = sorted(set(selected_days))
        self.day_of_week = self.days_of_week[0]
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class FixedPlanResponse(FixedPlanBody):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class FixedExceptionBody(BaseModel):
    date: date
    kind: Literal["cancel", "replace"] = "cancel"
    room_id: Optional[str] = None
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    title: Optional[str] = None
    description: Optional[str] = None


class FixedExceptionResponse(FixedExceptionBody):
    id: str
    plan_id: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class BookingBody(BaseModel):
    room_id: str
    teacher_id: Optional[str] = None
    date: date
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    booking_type: BookingType
    title: str = Field(min_length=1, max_length=200)
    student_name: str = ""
    participant_count: int = Field(default=0, ge=0)
    notes: str = ""
    is_public: bool = False

    @model_validator(mode="after")
    def validate_time(self):
        # 00:00 denotes midnight at the end of the selected booking date.
        if self.end_time != "00:00" and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class BookingResponse(BookingBody):
    id: str
    status: Literal["pending", "confirmed", "rejected", "cancelled"]
    is_locked: bool
    created_by_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class BookingUpdate(BookingBody):
    status: Optional[Literal["pending", "confirmed", "rejected", "cancelled"]] = None
    is_locked: Optional[bool] = None


class BookingBatchItem(BaseModel):
    id: str
    booking: BookingBody


class BookingBatchUpdate(BaseModel):
    items: list[BookingBatchItem] = Field(min_length=1, max_length=100)


class CoordinationRequestBody(BaseModel):
    booking_id: Optional[str] = None
    requested_date: date
    requested_room_id: Optional[str] = None
    requested_start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    requested_end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    message: str = ""


class CoordinationRequestResponse(CoordinationRequestBody):
    id: str
    requested_by_id: Optional[str] = None
    status: Literal["pending", "approved", "rejected"]
    resolution_note: str = ""
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class CoordinationResolution(BaseModel):
    status: Literal["approved", "rejected"]
    resolution_note: str = ""


class CalendarEvent(BaseModel):
    id: str
    source: Literal["fixed", "booking"]
    date: date
    room_id: str
    room_name: str = ""
    teacher_id: Optional[str] = None
    start_time: str
    end_time: str
    title: str
    booking_type: Optional[str] = None
    status: str = "confirmed"
    is_locked: bool = False
    is_public: bool = False
    description: str = ""
