import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import NewsArticle, NewsCategory, NewsTag

logger = logging.getLogger(__name__)
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
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def _require_admin_or_write(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


# ====================================================================
# Public endpoints (specific routes FIRST, then parameterized)
# ====================================================================


@router.get("/admin/list", response_model=list[ArticleWithRelations])
def list_admin_news(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(_require_admin_or_write),
    db: Session = Depends(get_db),
):
    """Admin-only list: returns ALL articles including drafts."""
    articles = news_files.list_articles(
        db,
        published_only=False,
        category_slug=category,
        tag_slug=tag,
        search=search,
        limit=limit,
        offset=offset,
    )
    return articles


@router.get("/admin/groups")
def list_admin_article_groups(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(_require_admin_or_write),
    db: Session = Depends(get_db),
):
    """Admin-only grouped list: one row per article with all locale versions."""
    return news_files.list_article_groups(
        db,
        published_only=False,
        category_slug=category,
        tag_slug=tag,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("", response_model=list[ArticleWithRelations])
def list_public_news(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    locale: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Public list: only published articles."""
    articles = news_files.list_articles(
        db,
        published_only=True,
        category_slug=category,
        tag_slug=tag,
        search=search,
        locale=locale,
        limit=limit,
        offset=offset,
    )
    return articles


@router.get("/categories", response_model=list[NewsCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return news_files.list_categories(db)


@router.get("/tags", response_model=list[NewsTagResponse])
def list_tags(db: Session = Depends(get_db)):
    return news_files.list_tags(db)


@router.get("/admin/{slug}", response_model=ArticleWithHtml)
def get_admin_article(
    slug: str,
    locale: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if locale:
        article = news_files.get_article_translation(db, slug, locale=locale, include_html=True)
    else:
        article = news_files.get_article(db, slug, include_html=True)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/admin/id/{article_id}", response_model=ArticleWithHtml)
def get_admin_article_by_id(article_id: str, db: Session = Depends(get_db)):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    result = news_files._get_article_with_relations(db, article, include_html=True)
    return result


@router.get("/by-ids", response_model=list[ArticleWithRelations])
def list_public_news_by_ids(
    ids: str,
    locale: Optional[str] = None,
    db: Session = Depends(get_db),
):
    article_ids = []
    seen = set()
    for item in ids.split(","):
        article_id = item.strip()
        if article_id and article_id not in seen:
            seen.add(article_id)
            article_ids.append(article_id)
    if not article_ids:
        return []
    return news_files.list_articles_by_ids(db, article_ids, locale=locale, published_only=True)


@router.get("/{slug}", response_model=ArticleWithHtml)
def get_public_article(
    slug: str,
    locale: Optional[str] = None,
    db: Session = Depends(get_db),
):
    article = news_files.get_article(db, slug, include_html=True, locale=locale, published_only=True)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# Admin endpoints (auth required)
@router.post("", response_model=ArticleWithRelations)
def create_article(
    article_data: NewsArticleCreate,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    try:
        return news_files.create_article(db, article_data, author_id=str(user.id))
    except Exception as e:
        logger.error(f"Error creating article: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create article: {str(e)}",
        )


@router.put("/{slug}", response_model=ArticleWithRelations)
def update_article(
    slug: str,
    article_data: NewsArticleUpdate,
    user: User = Depends(_require_admin_or_write),
    db: Session = Depends(get_db),
):
    try:
        result = news_files.update_article(db, slug, article_data)
        if not result:
            raise HTTPException(status_code=404, detail="Article not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating article {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update article: {str(e)}",
        )


@router.delete("/{slug}")
def delete_article(
    slug: str,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    try:
        deleted = news_files.delete_article(db, slug)
        if not deleted:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"detail": "Article deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting article {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete article: {str(e)}",
        )


@router.put("/{slug}/status", response_model=ArticleWithRelations)
def toggle_article_status(
    slug: str,
    status_data: dict,
    user: User = Depends(_require_admin_or_write),
    db: Session = Depends(get_db),
):
    """Toggle article publish status. Expects JSON body: {"is_published": true/false}"""
    try:
        published = status_data.get("is_published", False)
        result = news_files.toggle_publish(db, slug, published)
        if not result:
            raise HTTPException(status_code=404, detail="Article not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling status for {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update status: {str(e)}",
        )


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
    try:
        result = news_files.update_category(db, slug, data)
        if not result:
            raise HTTPException(status_code=404, detail="Category not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating category {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update category: {str(e)}",
        )


@router.delete("/categories/{slug}")
def delete_category(
    slug: str,
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    try:
        deleted = news_files.delete_category(db, slug)
        if not deleted:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"detail": "Category deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting category {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete category: {str(e)}",
        )


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
    try:
        # First resolve slug to tag object
        tag = db.query(NewsTag).filter(NewsTag.slug == slug).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        # Check if tag is in use via article_groups
        from app.models import ArticleGroupTag
        in_use = (
            db.query(ArticleGroupTag)
            .filter(ArticleGroupTag.tag_id == str(tag.id))
            .first()
        )
        if not in_use:
            # Also check legacy association
            from app.models import NewsArticleTag
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tag {slug}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tag: {str(e)}",
        )
