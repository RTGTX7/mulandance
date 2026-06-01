from pydantic import BaseModel, Field, field_validator
from typing import Optional


class AiTranslateRequest(BaseModel):
    module: str = Field(..., min_length=1, max_length=40)
    source_locale: str = Field(default="zh", max_length=16)
    target_locales: list[str] = Field(default_factory=lambda: ["en", "fr"])
    fields: dict[str, str]
    tone: Optional[str] = Field(default=None, max_length=120)


class AiDraft(BaseModel):
    locale: str
    fields: dict[str, str]
    warnings: list[str] = []


class AiTranslateResponse(BaseModel):
    module: str
    source_locale: str
    drafts: list[AiDraft]
    warnings: list[str] = []


class ImportedMedia(BaseModel):
    url: str
    path: str
    source_url: str
    content_type: str
    size: int


class ImportedSource(BaseModel):
    url: str
    title: str = ""
    description: str = ""
    text: str = ""
    source_published_at: str = ""
    images: list[str] = []
    media: list[ImportedMedia] = []
    warnings: list[str] = []


class AiArticleImportRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)
    source_locale: str = Field(default="zh", max_length=16)
    target_locales: list[str] = Field(default_factory=lambda: ["zh", "en", "fr"])
    manual_text: Optional[str] = Field(default=None, max_length=20000)
    extra_instruction: Optional[str] = Field(default=None, max_length=1000)
    category_slugs: list[str] = Field(default_factory=list)
    tag_slugs: list[str] = Field(default_factory=list)
    available_category_slugs: list[str] = Field(default_factory=list)
    available_tag_slugs: list[str] = Field(default_factory=list)

    @field_validator("urls")
    @classmethod
    def clean_urls(cls, value: list[str]) -> list[str]:
        cleaned = []
        for item in value:
            if isinstance(item, str) and item.strip():
                cleaned.append(item.strip())
        return cleaned


class AiArticleImportItem(BaseModel):
    source: ImportedSource
    content_type: str = "news"
    suggested_category_slugs: list[str] = Field(default_factory=list)
    suggested_tag_slugs: list[str] = Field(default_factory=list)
    drafts: list[AiDraft]
    warnings: list[str] = Field(default_factory=list)


class AiArticleImportResponse(BaseModel):
    items: list[AiArticleImportItem]
    warnings: list[str] = []
