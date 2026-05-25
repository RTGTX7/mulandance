import os
import re
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

import frontmatter
import mistune
from bs4 import BeautifulSoup
from sqlalchemy import case
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    NewsArticle,
    NewsCategory,
    NewsTag,
    NewsArticleCategory,
    NewsArticleTag,
)
from app.schemas.news import (
    NewsArticleCreate,
    NewsArticleUpdate,
    NewsCategoryCreate,
    NewsCategoryUpdate,
    NewsTagCreate,
)

# Safe HTML renderer for markdown


_mistune_renderer = mistune.create_markdown(renderer=mistune.HTMLRenderer())

def _get_news_dir() -> Path:
    news_dir = Path(settings.NEWS_FILES_DIR)
    if not news_dir.exists():
        news_dir.mkdir(parents=True, exist_ok=True)
    return news_dir


def _generate_filename(slug: str, published_at: Optional[datetime] = None) -> str:
    if published_at:
        date_str = published_at.strftime("%Y-%m-%d")
    else:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
    clean_slug = re.sub(r"[^a-z0-9\-]", "", slug.lower().replace(" ", "-"))
    return f"{date_str}-{clean_slug}.md"


def _read_markdown_file(filepath: Path) -> Optional[dict]:
    if not filepath.exists():
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return frontmatter.load(f)


def _write_markdown_file(filepath: Path, content: str, metadata: dict) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        frontmatter.dump(frontmatter.Post(content, **metadata), f)


def render_markdown(body: str) -> str:
    html = _mistune_renderer(body)
    soup = BeautifulSoup(html, "html.parser")
    return str(soup)


def list_articles(
    db: Session,
    published_only: bool = False,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    query = db.query(NewsArticle)

    if not settings.USE_FILE_STORAGE:
        query = query.filter(NewsArticle.is_published == True)
    elif published_only:
        query = query.filter(NewsArticle.is_published == True)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            NewsArticle.title.ilike(search_pattern)
            | NewsArticle.summary.ilike(search_pattern)
        )

    query = query.order_by(
        case((NewsArticle.published_at.isnot(None), NewsArticle.published_at), else_=NewsArticle.created_at).desc()
    )

    articles = query.limit(limit).offset(offset).all()
    result = []
    for article in articles:
        article_data = _get_article_with_relations(db, article, True)
        if category_slug:
            cats = [c.slug for c in article_data.get("categories", [])]
            if category_slug not in cats:
                continue
        if tag_slug:
            tags = [t.slug for t in article_data.get("tags", [])]
            if tag_slug not in tags:
                continue
        result.append(article_data)

    return result


def get_article(
    db: Session, slug: str, include_html: bool = False
) -> Optional[Dict[str, Any]]:
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        return None
    if not settings.USE_FILE_STORAGE:
        return _get_article_with_relations(db, article, include_html)

    filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at)
    post = _read_markdown_file(filepath)
    if post:
        article.summary = post.metadata.get("summary") or article.summary
        article.cover_image = post.metadata.get("cover_image") or article.cover_image
        article.locale = post.metadata.get("locale") or "en"

    return _get_article_with_relations(db, article, include_html)


def create_article(
    db: Session, article_data: NewsArticleCreate, author_id: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.utcnow()
    article = NewsArticle(
        slug=article_data.slug,
        title=article_data.title,
        summary=article_data.summary,
        body=article_data.body,
        author_id=author_id,
        published_at=now if article_data.is_published else None,
        cover_image=article_data.cover_image,
        is_published=article_data.is_published,
        locale=article_data.locale,
    )
    db.add(article)
    db.flush()

    if settings.USE_FILE_STORAGE:
        filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at or now)
        metadata = {
            "title": article_data.title,
            "slug": article_data.slug,
            "summary": article_data.summary or "",
            "cover_image": article_data.cover_image or "",
            "locale": article_data.locale,
        }
        _write_markdown_file(filepath, article_data.body, metadata)

    if article_data.category_slugs:
        for cat_slug in article_data.category_slugs:
            cat = db.query(NewsCategory).filter(NewsCategory.slug == cat_slug).first()
            if cat:
                jnc = NewsArticleCategory(article_id=str(article.id), category_id=str(cat.id))
                db.add(jnc)

    if article_data.tag_slugs:
        for tag_slug in article_data.tag_slugs:
            tag = db.query(NewsTag).filter(NewsTag.slug == tag_slug).first()
            if not tag:
                tag = NewsTag(slug=tag_slug, name=tag_slug.replace("-", " ").title())
                db.add(tag)
                db.flush()
            jnt = NewsArticleTag(article_id=str(article.id), tag_id=str(tag.id))
            db.add(jnt)

    db.commit()
    db.refresh(article)
    return _get_article_with_relations(db, article)


def update_article(
    db: Session, slug: str, article_data: NewsArticleUpdate
) -> Optional[Dict[str, Any]]:
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        return None

    update_fields = article_data.model_dump(exclude_unset=True)

    if "category_slugs" in update_fields:
        db.query(NewsArticleCategory).filter(
            NewsArticleCategory.article_id == article.id
        ).delete()
        new_cats = update_fields.pop("category_slugs")
        if new_cats:
            for cat_slug in new_cats:
                cat = db.query(NewsCategory).filter(NewsCategory.slug == cat_slug).first()
                if cat:
                    jnc = NewsArticleCategory(article_id=str(article.id), category_id=str(cat.id))
                    db.add(jnc)

    if "tag_slugs" in update_fields:
        db.query(NewsArticleTag).filter(
            NewsArticleTag.article_id == article.id
        ).delete()
        new_tags = update_fields.pop("tag_slugs")
        if new_tags:
            for tag_slug in new_tags:
                tag = db.query(NewsTag).filter(NewsTag.slug == tag_slug).first()
                if not tag:
                    tag = NewsTag(slug=tag_slug, name=tag_slug.replace("-", " ").title())
                    db.add(tag)
                    db.flush()
                jnt = NewsArticleTag(article_id=str(article.id), tag_id=str(tag.id))
                db.add(jnt)

    for field, value in update_fields.items():
        setattr(article, field, value)

    now = datetime.utcnow()
    if article_data.is_published and not article.is_published:
        article.published_at = article.published_at or now

    if settings.USE_FILE_STORAGE and "body" in update_fields:
        filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at or now)
        metadata = {
            "title": article.title,
            "slug": article.slug,
            "summary": article.summary or "",
            "cover_image": article.cover_image or "",
            "locale": article.locale or "en",
        }
        _write_markdown_file(filepath, article.body or "", metadata)

    db.commit()
    db.refresh(article)
    return _get_article_with_relations(db, article)


def delete_article(db: Session, slug: str) -> bool:
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        return False

    if settings.USE_FILE_STORAGE:
        now = datetime.utcnow()
        filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at or now)
        if filepath.exists():
            filepath.unlink()

        date_path = _get_news_dir() / _generate_filename(slug, None)
        if date_path.exists():
            date_path.unlink()

    db.query(NewsArticleCategory).filter(
        NewsArticleCategory.article_id == article.id
    ).delete()
    db.query(NewsArticleTag).filter(
        NewsArticleTag.article_id == article.id
    ).delete()
    db.delete(article)
    db.commit()
    return True


def list_categories(db: Session) -> List[NewsCategory]:
    return (
        db.query(NewsCategory)
        .filter(NewsCategory.is_active == True)
        .order_by(NewsCategory.name)
        .all()
    )


def create_category(db: Session, data: NewsCategoryCreate) -> NewsCategory:
    cat = NewsCategory(
        slug=data.slug,
        name=data.name,
        name_zh=data.name_zh,
        description=data.description,
        color=data.color,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(
    db: Session, slug: str, data: NewsCategoryUpdate
) -> Optional[NewsCategory]:
    cat = db.query(NewsCategory).filter(NewsCategory.slug == slug).first()
    if not cat:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)

    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, slug: str) -> bool:
    cat = db.query(NewsCategory).filter(NewsCategory.slug == slug).first()
    if not cat:
        return False
    db.delete(cat)
    db.commit()
    return True


def list_tags(db: Session) -> List[NewsTag]:
    return db.query(NewsTag).order_by(NewsTag.name).all()


def create_tag(db: Session, data: NewsTagCreate) -> NewsTag:
    tag = NewsTag(slug=data.slug, name=data.name, name_zh=data.name_zh)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, slug: str) -> bool:
    tag = db.query(NewsTag).filter(NewsTag.slug == slug).first()
    if not tag:
        return False
    db.delete(tag)
    db.commit()
    return True


def get_article_categories(db: Session, article_id: str) -> List[NewsCategory]:
    return (
        db.query(NewsCategory)
        .join(NewsArticleCategory, NewsCategory.id == NewsArticleCategory.category_id)
        .filter(NewsArticleCategory.article_id == article_id)
        .all()
    )


def get_article_tags(db: Session, article_id: str) -> List[NewsTag]:
    return (
        db.query(NewsTag)
        .join(NewsArticleTag, NewsTag.id == NewsArticleTag.tag_id)
        .filter(NewsArticleTag.article_id == article_id)
        .all()
    )


def _get_article_with_relations(
    db: Session, article: NewsArticle, include_html: bool = False
) -> Dict[str, Any]:
    categories = get_article_categories(db, str(article.id))
    tags = get_article_tags(db, str(article.id))

    result = {
        "id": str(article.id),
        "slug": article.slug,
        "title": article.title,
        "summary": article.summary,
        "author_id": str(article.author_id) if article.author_id else None,
        "published_at": str(article.published_at) if article.published_at else None,
        "cover_image": article.cover_image,
        "is_published": article.is_published,
        "locale": article.locale,
        "created_at": str(article.created_at),
        "categories": [
            {
                "id": str(c.id),
                "slug": c.slug,
                "name": c.name,
                "name_zh": c.name_zh,
                "color": c.color,
            }
            for c in categories
        ],
        "tags": [
            {
                "id": str(t.id),
                "slug": t.slug,
                "name": t.name,
                "name_zh": t.name_zh,
            }
            for t in tags
        ],
    }

    if include_html:
        # Try to find the markdown file
        now = datetime.utcnow()
        filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at or now)
        if not filepath.exists():
            filepath = _get_news_dir() / _generate_filename(article.slug, None)
        if filepath.exists():
            post = _read_markdown_file(filepath)
            if post:
                result["rendered_body"] = render_markdown(post.content)
            else:
                result["rendered_body"] = render_markdown("")
        elif article.body:
            result["rendered_body"] = render_markdown(article.body)
        else:
            result["rendered_body"] = ""

    return result


def sync_all_from_db(db: Session) -> int:
    articles = db.query(NewsArticle).filter(
        NewsArticle.body.isnot(None), NewsArticle.body != ""
    ).all()
    count = 0
    for article in articles:
        filepath = _get_news_dir() / _generate_filename(article.slug, article.published_at)
        metadata = {
            "title": article.title,
            "slug": article.slug,
            "summary": article.summary or "",
            "cover_image": article.cover_image or "",
            "locale": article.locale,
        }
        try:
            _write_markdown_file(filepath, article.body, metadata)
            count += 1
        except Exception:
            pass
    return count
