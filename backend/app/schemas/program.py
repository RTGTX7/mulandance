from pydantic import BaseModel
from typing import Optional
from datetime import datetime
# UUID replaced with str for SQLite


class ProgramBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    category: str
    level: Optional[str] = None
    syllabus_ref: Optional[str] = None
    cover_image: Optional[str] = None
    order_index: int = 0
    translations: dict = {}


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    syllabus_ref: Optional[str] = None
    cover_image: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None
    translations: Optional[dict] = None


class ProgramResponse(ProgramBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramModuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0


class ProgramModuleCreate(ProgramModuleBase):
    program_id: str


class ProgramModuleResponse(ProgramModuleBase):
    id: str
    program_id: str

    class Config:
        from_attributes = True
