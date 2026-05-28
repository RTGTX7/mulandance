from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.content import (
    NewsArticleCreate,
    NewsArticleUpdate,
    NewsArticleResponse,
    GalleryAlbumCreate,
    GalleryAlbumResponse,
    GalleryItemCreate,
    GalleryItemResponse,
    TestimonialCreate,
    TestimonialResponse,
)
from app.models import NewsArticle, GalleryAlbum, GalleryItem, Testimonial

router = APIRouter()


@router.get("/news", response_model=List[NewsArticleResponse])
def list_news(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
):
    return (
        db.query(NewsArticle)
        .filter(NewsArticle.is_published == True)
        .order_by(NewsArticle.published_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/news/{article_id}", response_model=NewsArticleResponse)
def get_news(article_id: str, db: Session = Depends(get_db)):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/news/slug/{slug}", response_model=NewsArticleResponse)
def get_news_by_slug(slug: str, db: Session = Depends(get_db)):
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/gallery/albums", response_model=List[GalleryAlbumResponse])
def list_albums(db: Session = Depends(get_db)):
    return db.query(GalleryAlbum).order_by(GalleryAlbum.created_at.desc()).all()


@router.get("/gallery/albums/{album_id}/items", response_model=List[GalleryItemResponse])
def list_album_items(album_id: str, db: Session = Depends(get_db)):
    items = (
        db.query(GalleryItem)
        .filter(GalleryItem.album_id == album_id)
        .order_by(GalleryItem.order_index)
        .all()
    )
    return items


@router.get("/testimonials", response_model=List[TestimonialResponse])
def list_testimonials(
    featured: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(Testimonial)
    if featured:
        query = query.filter(Testimonial.featured == True)
    return query.order_by(Testimonial.created_at.desc()).all()
