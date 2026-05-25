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


# --- News Article ---

class ArticleCategoryResponse(BaseModel):
    id: str
    slug: str
    name: str
    name_zh: Optional[str] = None
    color: str

    class Config:
        from_attributes = True


class ArticleTagResponse(BaseModel):
    id: str
    slug: str
    name: str
    name_zh: Optional[str] = None

    class Config:
        from_attributes = True


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


class ArticleWithRelations(BaseModel):
    id: str
    slug: str
    title: str
    summary: Optional[str] = None
    author_id: Optional[str] = None
    published_at: Optional[datetime] = None
    cover_image: Optional[str] = None
    is_published: bool
    locale: str
    created_at: datetime
    categories: List[ArticleCategoryResponse] = []
    tags: List[ArticleTagResponse] = []

    class Config:
        from_attributes = True


class ArticleWithHtml(ArticleWithRelations):
    rendered_body: Optional[str] = None
