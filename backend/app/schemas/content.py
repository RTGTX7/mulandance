from pydantic import BaseModel
from typing import Optional
from datetime import datetime
# UUID replaced with str for SQLite


class NewsArticleBase(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    body: Optional[str] = None


class NewsArticleCreate(NewsArticleBase):
    pass


class NewsArticleUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    body: Optional[str] = None
    is_published: Optional[bool] = None


class NewsArticleResponse(NewsArticleBase):
    id: str
    author_id: Optional[str] = None
    published_at: Optional[datetime] = None
    cover_image: Optional[str] = None
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GalleryAlbumBase(BaseModel):
    name: str
    description: Optional[str] = None


class GalleryAlbumCreate(GalleryAlbumBase):
    pass


class GalleryAlbumResponse(GalleryAlbumBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class GalleryItemBase(BaseModel):
    url: str
    caption: Optional[str] = None
    order_index: int = 0


class GalleryItemCreate(GalleryItemBase):
    album_id: str


class GalleryItemResponse(GalleryItemBase):
    id: str
    album_id: str

    class Config:
        from_attributes = True


class TestimonialBase(BaseModel):
    name: str
    quote: str
    program_affiliation: Optional[str] = None


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialResponse(TestimonialBase):
    id: str
    image_url: Optional[str] = None
    featured: bool
    created_at: datetime

    class Config:
        from_attributes = True
