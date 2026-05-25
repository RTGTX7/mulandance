from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.schemas.news import (
    NewsArticleCreate,
    NewsArticleUpdate,
    ArticleWithRelations,
    ArticleWithHtml,
    NewsCategoryCreate,
    NewsCategoryUpdate,
    NewsCategoryResponse,
    NewsTagCreate,
    NewsTagResponse,
)
from app.schemas.user import UserResponse
from app.models import User
from app.services import news_files

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user


def _require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "editor", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def _require_admin_or_write(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "editor", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


# ====================================================================
# Public endpoints
# ====================================================================


@router.get("", response_model=list[ArticleWithRelations])
def list_public_news(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    articles = news_files.list_articles(
        db,
        published_only=True,
        category_slug=category,
        tag_slug=tag,
        search=search,
        limit=limit,
        offset=offset,
    )
    return articles


@router.get("/{slug}", response_model=ArticleWithHtml)
def get_public_article(slug: str, db: Session = Depends(get_db)):
    article = news_files.get_article(db, slug, include_html=True)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if not article["is_published"]:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/categories", response_model=list[NewsCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return news_files.list_categories(db)


@router.get("/tags", response_model=list[NewsTagResponse])
def list_tags(db: Session = Depends(get_db)):
    return news_files.list_tags(db)


# ====================================================================
# Admin endpoints (auth required)
# ====================================================================


@router.post("", response_model=ArticleWithRelations)
def create_article(
    article_data: NewsArticleCreate,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    return news_files.create_article(db, article_data, author_id=str(user.id))


@router.put("/{slug}", response_model=ArticleWithRelations)
def update_article(
    slug: str,
    article_data: NewsArticleUpdate,
    user: User = Depends(_require_admin_or_write),
    db: Session = Depends(get_db),
):
    result = news_files.update_article(db, slug, article_data)
    if not result:
        raise HTTPException(status_code=404, detail="Article not found")
    return result


@router.delete("/{slug}")
def delete_article(
    slug: str,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    deleted = news_files.delete_article(db, slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"detail": "Article deleted"}


# ====================================================================
# Category management (admin only)
# ====================================================================


@router.post("/categories", response_model=NewsCategoryResponse)
def create_category(
    data: NewsCategoryCreate,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(NewsCategory).filter(NewsCategory.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    return news_files.create_category(db, data)


@router.put("/categories/{slug}", response_model=NewsCategoryResponse)
def update_category(
    slug: str,
    data: NewsCategoryUpdate,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    result = news_files.update_category(db, slug, data)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return result


@router.delete("/categories/{slug}")
def delete_category(
    slug: str,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    deleted = news_files.delete_category(db, slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"detail": "Category deleted"}


# ====================================================================
# Tag management (admin only)
# ====================================================================


@router.post("/tags", response_model=NewsTagResponse)
def create_tag(
    data: NewsTagCreate,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(NewsTag).filter(NewsTag.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag slug already exists")
    return news_files.create_tag(db, data)


@router.delete("/tags/{slug}")
def delete_tag(
    slug: str,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    # Check if tag is in use
    from app.models import NewsArticleTag
    in_use = (
        db.query(NewsArticleTag)
        .filter(NewsArticleTag.tag_id == slug)
        .first()
    )
    if not in_use:
        # slug here is the tag slug; need to resolve to ID
        tag = db.query(NewsTag).filter(NewsTag.slug == slug).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        in_use = (
            db.query(NewsArticleTag)
            .filter(NewsArticleTag.tag_id == str(tag.id))
            .first()
        )
    if in_use:
        raise HTTPException(status_code=400, detail="Tag is in use by articles")
    deleted = news_files.delete_tag(db, slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"detail": "Tag deleted"}
