from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
# UUID replaced with str for SQLite


class EventBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    event_type: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    is_active: Optional[bool] = None


class EventResponse(EventBase):
    id: str
    cover_image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PerformanceBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    venue: Optional[str] = None
    cover_image: Optional[str] = None
    is_current: bool = True
    translations: dict = {}
    related_article_ids: List[str] = []


class PerformanceCreate(PerformanceBase):
    pass


class PerformanceUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    venue: Optional[str] = None
    cover_image: Optional[str] = None
    is_current: Optional[bool] = None
    translations: Optional[dict] = None
    related_article_ids: Optional[List[str]] = None


class PerformanceResponse(PerformanceBase):
    id: str
    cover_image: Optional[str] = None
    is_current: bool
    created_at: datetime

    class Config:
        from_attributes = True
