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


class AiTranslateJobCreateResponse(BaseModel):
    job_id: str
    status: str = "pending"


class AiTranslateJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: AiTranslateResponse | None = None
    error: str = ""


class AiExtractRequest(BaseModel):
    module: str = Field(..., min_length=1, max_length=40)
    source_locale: str = Field(default="zh", max_length=16)
    target_locales: list[str] = Field(default_factory=lambda: ["zh", "en", "fr"])
    raw_text: str = Field(..., min_length=1, max_length=12000)
    target_fields: list[str] = Field(default_factory=list)
    instruction: Optional[str] = Field(default=None, max_length=800)


class AiExtractResponse(BaseModel):
    module: str
    source_locale: str
    drafts: list[AiDraft]
    warnings: list[str] = []


class AiExtractJobCreateResponse(BaseModel):
    job_id: str
    status: str = "pending"


class AiExtractJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: AiExtractResponse | None = None
    error: str = ""


class AiExtractItem(BaseModel):
    drafts: list[AiDraft]
    warnings: list[str] = []


class AiExtractManyRequest(BaseModel):
    module: str = Field(..., min_length=1, max_length=40)
    source_locale: str = Field(default="zh", max_length=16)
    target_locales: list[str] = Field(default_factory=lambda: ["zh", "en", "fr"])
    raw_text: str = Field(..., min_length=1, max_length=16000)
    target_fields: list[str] = Field(default_factory=list)
    instruction: Optional[str] = Field(default=None, max_length=1000)
    max_items: int = Field(default=20, ge=1, le=60)


class AiExtractManyResponse(BaseModel):
    module: str
    source_locale: str
    items: list[AiExtractItem]
    warnings: list[str] = []


class AiExtractManyJobCreateResponse(BaseModel):
    job_id: str
    status: str = "pending"


class AiExtractManyJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: AiExtractManyResponse | None = None
    error: str = ""


# fixed_course_import.v1 is intentionally defined in Pydantic. The generated
# JSON Schema is the contract sent to each AI provider, so model integrations
# never need hand-maintained JSON files.
class FixedCourseLocalizedContent(BaseModel):
    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=4000)

    @field_validator("title", "description", mode="before")
    @classmethod
    def empty_text_for_null(cls, value):
        return "" if value is None else value


class FixedCourseImportTemplate(BaseModel):
    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=4000)
    translations: dict[str, FixedCourseLocalizedContent] = Field(default_factory=dict)

    @field_validator("title", "description", mode="before")
    @classmethod
    def empty_text_for_null(cls, value):
        return "" if value is None else value


class FixedCourseImportOffering(BaseModel):
    name: str = Field(default="", max_length=200)
    start_date: str = Field(default="", max_length=10)
    end_date: str = Field(default="", max_length=10)
    is_public: bool = True

    @field_validator("name", "start_date", "end_date", mode="before")
    @classmethod
    def empty_text_for_null(cls, value):
        return "" if value is None else value


class FixedCourseImportSlot(BaseModel):
    days_of_week: list[int] = Field(default_factory=list)
    start_time: str = Field(default="", max_length=5)
    end_time: str = Field(default="", max_length=5)
    room_id: str | None = None
    teacher_id: str | None = None

    @field_validator("days_of_week", mode="before")
    @classmethod
    def empty_days_for_null(cls, value):
        return [] if value is None else value

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def empty_time_for_null(cls, value):
        return "" if value is None else value


class FixedCourseImportIssue(BaseModel):
    id: str = Field(default="", max_length=100)
    field: str = Field(default="", max_length=100)
    message: str = Field(default="", max_length=1000)
    blocking: bool = True
    resolved: bool = False


class FixedCourseImportDraft(BaseModel):
    template: FixedCourseImportTemplate = Field(default_factory=FixedCourseImportTemplate)
    offering: FixedCourseImportOffering = Field(default_factory=FixedCourseImportOffering)
    slots: list[FixedCourseImportSlot] = Field(default_factory=list, max_length=20)
    questions: list[FixedCourseImportIssue] = Field(default_factory=list, max_length=30)
    assumptions: list[FixedCourseImportIssue] = Field(default_factory=list, max_length=30)

    @field_validator("slots", "questions", "assumptions", mode="before")
    @classmethod
    def empty_list_for_null(cls, value):
        return [] if value is None else value


class FixedCourseImportRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=20000)
    source_locale: str = Field(default="zh", max_length=16)
    ui_locale: str = Field(default="zh", max_length=16)
    max_items: int = Field(default=30, ge=1, le=60)


class FixedCourseImportResponse(BaseModel):
    version: str = "fixed_course_import.v1"
    drafts: list[FixedCourseImportDraft] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    @field_validator("drafts", "warnings", mode="before")
    @classmethod
    def empty_list_for_null(cls, value):
        return [] if value is None else value


class FixedCourseImportJobCreateResponse(BaseModel):
    job_id: str
    status: str = "pending"


class FixedCourseImportJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: FixedCourseImportResponse | None = None
    error: str = ""


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
    video_url: str = ""
    is_video: bool = False
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
    auto_save_to_drafts: bool = False

    @field_validator("urls")
    @classmethod
    def clean_urls(cls, value: list[str]) -> list[str]:
        cleaned = []
        for item in value:
            if isinstance(item, str) and item.strip():
                cleaned.append(item.strip())
        return cleaned


class AiArticleImportAppendRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)

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


class AiArticleImportJobEntry(BaseModel):
    url: str
    status: str
    message: str = ""
    saved_slug: str = ""


class AiArticleImportJobCreateResponse(BaseModel):
    job_id: str
    status: str = "pending"


class AiArticleImportJobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: AiArticleImportResponse | None = None
    error: str = ""
    total: int = 0
    completed: int = 0
    failed: int = 0
    current_url: str = ""
    errors: list[str] = Field(default_factory=list)
    saved: int = 0
    saved_slugs: list[str] = Field(default_factory=list)
    entries: list[AiArticleImportJobEntry] = Field(default_factory=list)
