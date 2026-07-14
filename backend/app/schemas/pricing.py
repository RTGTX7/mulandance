from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


LocaleBundle = dict[str, dict[str, object]]


class PricingOptionBody(BaseModel):
    id: str | None = None
    label: str = Field(default="", max_length=180)
    amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="CAD", min_length=3, max_length=3)
    unit: str = Field(default="", max_length=120)
    note: str = ""
    sort_order: int = 0
    translations: LocaleBundle = {}


class PricingPlanBody(BaseModel):
    id: str | None = None
    program_id: str | None = None
    room_id: str | None = None
    title: str = Field(default="", max_length=240)
    description: str = ""
    badge: str = Field(default="", max_length=120)
    image_url: str = Field(default="", max_length=1000)
    details: list[str] = []
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0
    translations: LocaleBundle = {}
    options: list[PricingOptionBody] = []
    program_name: str = ""
    room_name: str = ""
    studio_name: str = ""
    room_is_rentable: bool = False


class PricingBlockBody(BaseModel):
    id: str | None = None
    block_type: Literal["info", "payment", "notice", "cta"] = "info"
    title: str = Field(default="", max_length=240)
    body: str = ""
    items: list[str] = []
    is_active: bool = True
    sort_order: int = 0
    translations: LocaleBundle = {}


class PricingCatalogDraft(BaseModel):
    kind: Literal["program", "rental"]
    title: str = Field(default="", max_length=240)
    subtitle: str = ""
    translations: LocaleBundle = {}
    plans: list[PricingPlanBody] = []
    blocks: list[PricingBlockBody] = []


class PricingCatalogResponse(PricingCatalogDraft):
    id: str
    is_dirty: bool
    published_at: datetime | None = None


class PricingPublishResponse(BaseModel):
    catalog: PricingCatalogResponse
    warnings: list[str] = []
