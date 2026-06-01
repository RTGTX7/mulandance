from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# --- News Category ---

class NewsCategoryBase(BaseModel):
    slug: str
    name: str
    name_zh: Optional[str] = None
    description: Optional[str] = None
    color: str = "#6366f1"


class NewsCategoryCreate(NewsCategoryBase):
    pass


class NewsCategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_zh: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class NewsCategoryResponse(NewsCategoryBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- News Tag ---

class NewsTagBase(BaseModel):
    slug: str
    name: str
    name_zh: Optional[str] = None


class NewsTagCreate(NewsTagBase):
    pass


class NewsTagResponse(NewsTagBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Article Group & Translation ---

class TranslationDetail(BaseModel):
    """A single locale-specific translation within an article group."""
    locale: str
    slug: str
    title: str
    summary: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ArticleGroupResponse(BaseModel):
    """Article group with shared categories/tags and translations."""
    id: str
    shared_slug: str
    translations: List[TranslationDetail] = []
    categories: List[NewsCategoryResponse] = []
    tags: List[NewsTagResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ArticleTranslationCreate(BaseModel):
    """Create a new article group with one translation."""
    slug: str  # shared slug (also used as base for locale slugs)
    title: str
    summary: Optional[str] = None
    body: str
    cover_image: Optional[str] = None
    category_slugs: List[str] = []
    tag_slugs: List[str] = []
    locale: str = "en"
    is_published: bool = False
    published_at: Optional[datetime] = None


class ArticleTranslationUpdate(BaseModel):
    """Update a translation (or create if locale doesn't exist)."""
    locale: Optional[str] = None  # If None, update all locales
    title: Optional[str] = None
    summary: Optional[str] = None
    body: Optional[str] = None
    cover_image: Optional[str] = None
    category_slugs: Optional[List[str]] = None
    tag_slugs: Optional[List[str]] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None


class ArticleWithRelations(BaseModel):
    """Flat article response for backward compatibility with public endpoints.
    
    This is the canonical article shape used by ALL article endpoints.
    Fields:
    - id: UUID of the article translation
    - group_id: Optional UUID of the parent article group
    - locale: "en" or "zh"
    - slug: locale-specific slug
    - title, summary, body, cover_image: content fields
    - is_published: publish flag
    - categories, tags: relation arrays
    - created_at, updated_at: timestamps (both ISO datetime strings or None)
    """
    id: str
    slug: str
    title: str
    summary: Optional[str] = None
    body: Optional[str] = None
    group_id: Optional[str] = None
    author_id: Optional[str] = None
    published_at: Optional[datetime] = None
    cover_image: Optional[str] = None
    is_published: bool
    locale: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    categories: List[NewsCategoryResponse] = []
    tags: List[NewsTagResponse] = []

    class Config:
        from_attributes = True


class ArticleWithHtml(ArticleWithRelations):
    """Extends ArticleWithRelations with rendered markdown body."""
    rendered_body: Optional[str] = None

    class Config:
        from_attributes = True


# --- Legacy support (deprecated, kept for migration period) ---

class NewsArticleCreate(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    body: str
    cover_image: Optional[str] = None
    category_slugs: List[str] = []
    tag_slugs: List[str] = []
    locale: str = "en"
    is_published: bool = False
    published_at: Optional[datetime] = None


class NewsArticleUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    body: Optional[str] = None
    cover_image: Optional[str] = None
    category_slugs: Optional[List[str]] = None
    tag_slugs: Optional[List[str]] = None
    locale: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None
