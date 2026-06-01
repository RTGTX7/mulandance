import os
import re
import uuid
import html as html_lib
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

import frontmatter
import mistune
from bs4 import BeautifulSoup
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    NewsArticle,
    NewsCategory,
    NewsTag,
    NewsArticleCategory,
    NewsArticleTag,
    ArticleGroup,
    ArticleGroupCategory,
    ArticleGroupTag,
    ArticleTranslation,
)
from app.schemas.news import (
    NewsArticleCreate,
    NewsArticleUpdate,
    ArticleTranslationCreate,
    ArticleTranslationUpdate,
    NewsCategoryCreate,
    NewsCategoryUpdate,
    NewsTagCreate,
)

# Safe HTML renderer for markdown


_mistune_renderer = mistune.create_markdown(renderer=mistune.HTMLRenderer())
_carousel_block_re = re.compile(r"(?ms)^:::\s*carousel\s*\n(.*?)\n:::\s*$")
_carousel_image_re = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")


def _safe_carousel_url(url: str) -> Optional[str]:
    clean_url = (url or "").strip()
    if clean_url.startswith(("http://", "https://", "/")):
        return clean_url
    return None


def _extract_carousel_items(markdown: str) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    for alt, url in _carousel_image_re.findall(markdown or ""):
        safe_url = _safe_carousel_url(url)
        if safe_url:
            items.append({"alt": alt.strip(), "url": safe_url})

    if items:
        return items

    for line in (markdown or "").splitlines():
        safe_url = _safe_carousel_url(line.strip())
        if safe_url:
            items.append({"alt": "", "url": safe_url})
    return items


def _render_carousel_html(items: List[Dict[str, str]]) -> str:
    if not items:
        return ""

    slides = []
    for index, item in enumerate(items, start=1):
        alt = html_lib.escape(item.get("alt") or f"Image {index}", quote=True)
        url = html_lib.escape(item["url"], quote=True)
        caption = html_lib.escape(item.get("alt") or "", quote=False)
        figcaption = f'<figcaption>{caption}</figcaption>' if caption else ""
        slides.append(
            '<figure class="article-carousel-slide">'
            f'<img src="{url}" alt="{alt}" loading="lazy" />'
            f"{figcaption}"
            "</figure>"
        )

    return (
        '<div class="article-carousel" role="region" aria-label="Image carousel">'
        '<div class="article-carousel-track">'
        + "".join(slides)
        + "</div>"
        "</div>"
    )


def _replace_carousel_blocks(body: str) -> tuple[str, Dict[str, str]]:
    carousels: Dict[str, str] = {}

    def replace(match: re.Match[str]) -> str:
        token = f"ARTICLE_CAROUSEL_{len(carousels)}"
        carousels[token] = _render_carousel_html(_extract_carousel_items(match.group(1)))
        return f"\n\n{token}\n\n"

    return _carousel_block_re.sub(replace, body or ""), carousels


def _article_locale(locale: Optional[str]) -> Optional[str]:
    if not locale:
        return None
    return "zh" if locale == "zh-Hant" else locale


def _select_translation(
    translations: List[ArticleTranslation],
    locale: Optional[str] = None,
    published_only: bool = False,
) -> Optional[ArticleTranslation]:
    candidates = [item for item in translations if not published_only or item.is_published]
    if not candidates:
        return None

    target_locale = _article_locale(locale)
    if target_locale:
        for item in candidates:
            if item.locale == target_locale:
                return item

    for fallback_locale in ("en", "zh", "fr"):
        for item in candidates:
            if item.locale == fallback_locale:
                return item

    return candidates[0]


def _get_news_dir() -> Path:
    news_dir = Path(settings.NEWS_FILES_DIR)
    if not news_dir.exists():
        news_dir.mkdir(parents=True, exist_ok=True)
    return news_dir


def _generate_filename(slug: str, published_at: Optional[datetime] = None) -> str:
    """Return the legacy flat filename used before year folders."""
    if published_at:
        date_str = published_at.strftime("%Y-%m-%d")
    else:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
    clean_slug = re.sub(r"[^a-z0-9\-]", "", slug.lower().replace(" ", "-"))
    return f"{date_str}-{clean_slug}.md"


def _clean_slug_for_file(slug: str) -> str:
    clean_slug = re.sub(r"[^a-z0-9\-]", "", slug.lower().replace(" ", "-"))
    return clean_slug or "article"


def _markdown_file_path(slug: str, published_at: Optional[datetime] = None) -> Path:
    """New canonical markdown path: data/news/YYYY/slug.md."""
    date_value = published_at or datetime.utcnow()
    return _get_news_dir() / str(date_value.year) / f"{_clean_slug_for_file(slug)}.md"


def _find_markdown_file(slug: str, preferred_date: Optional[datetime] = None) -> Optional[Path]:
    news_dir = _get_news_dir()
    preferred = _markdown_file_path(slug, preferred_date)
    if preferred.exists():
        return preferred

    legacy_preferred = news_dir / _generate_filename(slug, preferred_date)
    if legacy_preferred.exists():
        return legacy_preferred

    clean_slug = _clean_slug_for_file(slug)
    matches = sorted(
        [
            *news_dir.glob(f"*/{clean_slug}.md"),
            *news_dir.glob(f"*-{clean_slug}.md"),
        ],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return matches[0] if matches else None


def _read_markdown_file(filepath: Path) -> Optional[dict]:
    if not filepath.exists():
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return frontmatter.load(f)


def _write_markdown_file(filepath: Path, content: str, metadata: dict) -> None:
    """Write a markdown file with YAML frontmatter using text mode."""
    post = frontmatter.Post(content or "", **metadata)
    rendered = frontmatter.dumps(post)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        f.write(rendered)


def render_markdown(body: str) -> str:
    markdown, carousels = _replace_carousel_blocks(body)
    html = _mistune_renderer(markdown)
    soup = BeautifulSoup(html, "html.parser")
    rendered = str(soup)
    for token, carousel_html in carousels.items():
        rendered = rendered.replace(f"<p>{token}</p>", carousel_html)
        rendered = rendered.replace(token, carousel_html)
    return rendered


def _safe_dt(dt_val):
    """Return a datetime object (or None) for Pydantic validation.
    
    FastAPI's response_model expects actual datetime objects so it can
    serialize them to ISO strings in the JSON response.
    """
    if dt_val is None:
        return None
    if isinstance(dt_val, str):
        if dt_val.lower() in ('none', ''):
            return None
        try:
            return datetime.fromisoformat(dt_val)
        except (ValueError, TypeError):
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
                try:
                    return datetime.strptime(dt_val, fmt)
                except ValueError:
                    continue
            return None
    return dt_val


# ============================================================
# Article Group + Translation functions
# ============================================================


def _get_translation_with_relations(
    db: Session, translation: ArticleTranslation, include_html: bool = False,
    include_categories: bool = True, include_tags: bool = True,
) -> Dict[str, Any]:
    """Build a flat dict from a translation with relations."""
    categories = []
    if include_categories:
        cats = (
            db.query(NewsCategory)
            .join(ArticleGroupCategory, NewsCategory.id == ArticleGroupCategory.category_id)
            .filter(ArticleGroupCategory.group_id == translation.group_id)
            .all()
        )
        categories = [
            {
                "id": str(c.id), "slug": c.slug, "name": c.name,
                "name_zh": c.name_zh, "color": c.color,
                "is_active": getattr(c, "is_active", True),
                "created_at": _safe_dt(getattr(c, "created_at", None)),
            }
            for c in cats
        ]

    tags = []
    if include_tags:
        tag_objs = (
            db.query(NewsTag)
            .join(ArticleGroupTag, NewsTag.id == ArticleGroupTag.tag_id)
            .filter(ArticleGroupTag.group_id == translation.group_id)
            .all()
        )
        tags = [
            {
                "id": str(t.id), "slug": t.slug, "name": t.name,
                "name_zh": t.name_zh,
                "created_at": _safe_dt(getattr(t, "created_at", None)),
            }
            for t in tag_objs
        ]

    body = translation.body or ""
    if include_html and settings.USE_FILE_STORAGE:
        filepath = _find_markdown_file(translation.slug, translation.published_at)
        if filepath:
            post = _read_markdown_file(filepath)
            if post:
                body = post.content or body

    result: Dict[str, Any] = {
        "id": str(translation.id),
        "group_id": str(translation.group_id),
        "locale": translation.locale,
        "slug": translation.slug,
        "title": translation.title,
        "summary": translation.summary,
        "body": body,
        "author_id": str(translation.author_id) if translation.author_id else None,
        "published_at": _safe_dt(translation.published_at),
        "cover_image": translation.cover_image or "",
        "is_published": translation.is_published,
        "created_at": _safe_dt(translation.created_at),
        "updated_at": _safe_dt(translation.updated_at),
        "categories": categories,
        "tags": tags,
    }

    if include_html:
        result["rendered_body"] = render_markdown(body)

    return result


def _get_group_with_relations(
    db: Session, group: ArticleGroup, include_html: bool = True,
) -> Dict[str, Any]:
    """Build a complete article group response with translations + shared data."""
    def _safe_dt(dt_val):
        if dt_val is None:
            return None
        if isinstance(dt_val, str):
            if dt_val.lower() == 'none' or dt_val == '':
                return None
            return dt_val
        return dt_val.isoformat()

    translations = (
        db.query(ArticleTranslation)
        .filter(ArticleTranslation.group_id == group.id)
        .order_by(ArticleTranslation.locale)
        .all()
    )

    categories = (
        db.query(NewsCategory)
        .join(ArticleGroupCategory, NewsCategory.id == ArticleGroupCategory.category_id)
        .filter(ArticleGroupCategory.group_id == group.id)
        .all()
    )

    tags = (
        db.query(NewsTag)
        .join(ArticleGroupTag, NewsTag.id == ArticleGroupTag.tag_id)
        .filter(ArticleGroupTag.group_id == group.id)
        .all()
    )

    translations_data = []
    for t in translations:
        td = _get_translation_with_relations(db, t, include_html, False, False)
        translations_data.append(td)

    return {
        "id": str(group.id),
        "shared_slug": group.shared_slug,
        "translations": translations_data,
        "categories": [
            {"id": str(c.id), "slug": c.slug, "name": c.name, "name_zh": c.name_zh, "color": c.color}
            for c in categories
        ],
        "tags": [
            {"id": str(t.id), "slug": t.slug, "name": t.name, "name_zh": t.name_zh}
            for t in tags
        ],
        "created_at": _safe_dt(group.created_at),
        "updated_at": _safe_dt(group.updated_at),
    }


def list_article_groups(
    db: Session,
    published_only: bool = False,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List article groups (shows one row per group in admin)."""
    query = db.query(ArticleGroup)

    if search:
        search_pattern = f"%{search}%"
        subq = (
            db.query(ArticleTranslation.group_id)
            .filter(
                ArticleTranslation.title.ilike(search_pattern)
                | ArticleTranslation.summary.ilike(search_pattern)
            )
            .distinct()
        )
        query = query.filter(ArticleGroup.id.in_(subq))

    # Get latest published_at per group for sorting
    # (can't reference ArticleTranslation directly in GROUP BY without subquery)
    subq = (
        db.query(
            ArticleTranslation.group_id,
            func.max(ArticleTranslation.published_at).label("latest_published"),
        )
        .filter(ArticleTranslation.published_at.isnot(None))
        .group_by(ArticleTranslation.group_id)
        .subquery()
    )
    query = query.outerjoin(subq, ArticleGroup.id == subq.c.group_id).order_by(
        case((subq.c.latest_published.isnot(None), subq.c.latest_published), else_=ArticleGroup.created_at).desc()
    )

    # Limit with offset on group query
    groups = query.limit(limit).offset(offset).all()

    result = []
    for group in groups:
        group_data = _get_group_with_relations(db, group)

        # Filter by published status (at least one translation published?)
        if published_only:
            has_published = any(t.get("is_published") for t in group_data["translations"])
            if not has_published:
                continue

        # Filter by category
        if category_slug:
            cat_slugs = [c["slug"] for c in group_data.get("categories", [])]
            if category_slug not in cat_slugs:
                continue

        # Filter by tag
        if tag_slug:
            tag_slugs = [t["slug"] for t in group_data.get("tags", [])]
            if tag_slug not in tag_slugs:
                continue

        result.append(group_data)

    return result


def get_article_group_by_slug(db: Session, slug: str) -> Optional[Dict[str, Any]]:
    """Get a single article group by shared slug."""
    group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == slug).first()
    if not group:
        return None
    return _get_group_with_relations(db, group)


def get_article_translation(
    db: Session, slug: str, locale: Optional[str] = None, include_html: bool = False,
) -> Optional[Dict[str, Any]]:
    """Get a specific article translation by locale-specific slug."""
    if locale:
        translation = (
            db.query(ArticleTranslation)
            .filter(ArticleTranslation.slug == slug, ArticleTranslation.locale == locale)
            .first()
        )
    else:
        translation = db.query(ArticleTranslation).filter(ArticleTranslation.slug == slug).first()

    if not translation:
        return None

    return _get_translation_with_relations(db, translation, include_html, True, True)


def get_article_translation_by_group(db: Session, group_id: str, locale: str) -> Optional[Dict[str, Any]]:
    """Get a specific translation within a group by locale."""
    translation = (
        db.query(ArticleTranslation)
        .filter(ArticleTranslation.group_id == group_id, ArticleTranslation.locale == locale)
        .first()
    )
    if not translation:
        return None
    return _get_translation_with_relations(db, translation, True, True, True)


def create_article_translation(
    db: Session, data: ArticleTranslationCreate, author_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new article group with one translation."""
    now = datetime.utcnow()
    published_at = data.published_at or (now if data.is_published else None)
    group_slug = data.slug

    # Check if group already exists
    existing_group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == group_slug).first()

    if existing_group:
        # Check if locale already exists
        existing_trans = (
            db.query(ArticleTranslation)
            .filter(ArticleTranslation.group_id == existing_group.id, ArticleTranslation.locale == data.locale)
            .first()
        )
        if existing_trans:
            # Update existing translation
            update_fields = data.model_dump(exclude_unset=True)
            body_content = update_fields.pop("body", None)
            for field, value in update_fields.items():
                setattr(existing_trans, field, value)
            if settings.USE_FILE_STORAGE and body_content is not None:
                filepath = _markdown_file_path(group_slug, existing_trans.published_at or datetime.utcnow())
                metadata = {
                    "title": existing_trans.title,
                    "slug": group_slug,
                    "summary": existing_trans.summary or "",
                    "cover_image": existing_trans.cover_image or "",
                    "locale": existing_trans.locale,
                }
                _write_markdown_file(filepath, body_content, metadata)
                existing_trans.body = None
            elif body_content is not None:
                existing_trans.body = body_content
            db.commit()
            db.refresh(existing_trans)
            return _get_translation_with_relations(db, existing_trans, True, True, True)
        else:
            # Create new translation in existing group
            group_id = existing_group.id
    else:
        # Create new group
        group_id = str(uuid.uuid4())
        group = ArticleGroup(id=group_id, shared_slug=group_slug)
        db.add(group)
        db.flush()

    # Create translation
    trans_id = str(uuid.uuid4())
    translation = ArticleTranslation(
        id=trans_id,
        group_id=group_id,
        locale=data.locale,
        slug=group_slug,
        title=data.title,
        summary=data.summary,
        body=None if settings.USE_FILE_STORAGE else data.body,
        author_id=author_id,
        published_at=published_at,
        cover_image=data.cover_image,
        is_published=data.is_published,
    )
    db.add(translation)
    db.flush()

    # Set categories
    if data.category_slugs:
        for cat_slug in data.category_slugs:
            cat = db.query(NewsCategory).filter(NewsCategory.slug == cat_slug).first()
            if cat:
                exists = (
                    db.query(ArticleGroupCategory)
                    .filter(
                        ArticleGroupCategory.group_id == group_id,
                        ArticleGroupCategory.category_id == str(cat.id),
                    )
                    .first()
                )
                if not exists:
                    agc = ArticleGroupCategory(group_id=group_id, category_id=str(cat.id))
                    db.add(agc)

    # Set tags
    if data.tag_slugs:
        for tag_slug in data.tag_slugs:
            tag = db.query(NewsTag).filter(NewsTag.slug == tag_slug).first()
            if not tag:
                tag = NewsTag(slug=tag_slug, name=tag_slug.replace("-", " ").title())
                db.add(tag)
                db.flush()
            exists = (
                db.query(ArticleGroupTag)
                .filter(
                    ArticleGroupTag.group_id == group_id,
                    ArticleGroupTag.tag_id == str(tag.id),
                )
                .first()
            )
            if not exists:
                agt = ArticleGroupTag(group_id=group_id, tag_id=str(tag.id))
                db.add(agt)

    # Write markdown file
    if settings.USE_FILE_STORAGE:
        filepath = _markdown_file_path(group_slug, published_at or now)
        metadata = {
            "title": data.title,
            "slug": group_slug,
            "summary": data.summary or "",
            "cover_image": data.cover_image or "",
            "locale": data.locale,
        }
        _write_markdown_file(filepath, data.body, metadata)

    db.commit()
    db.refresh(translation)
    return _get_translation_with_relations(db, translation, True, True, True)


def update_article_translation(
    db: Session, group_slug: str, data: ArticleTranslationUpdate,
) -> Optional[Dict[str, Any]]:
    """Update article translation(s). If locale is specified, update that locale; otherwise update all."""
    group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == group_slug).first()
    if not group:
        return None

    target_translations = []
    if data.locale:
        target_translations = db.query(ArticleTranslation).filter(
            ArticleTranslation.group_id == group.id, ArticleTranslation.locale == data.locale
        ).all()
    else:
        target_translations = db.query(ArticleTranslation).filter(ArticleTranslation.group_id == group.id).all()

    if not target_translations:
        return None

    now = datetime.utcnow()
    updated_results = []

    for translation in target_translations:
        update_fields = data.model_dump(exclude_unset=True)
        body_content = update_fields.get("body")

        if "category_slugs" in update_fields:
            # Delete existing category links
            db.query(ArticleGroupCategory).filter(
                ArticleGroupCategory.group_id == group.id
            ).delete()
            new_cats = update_fields.pop("category_slugs")
            if new_cats:
                for cat_slug in new_cats:
                    cat = db.query(NewsCategory).filter(NewsCategory.slug == cat_slug).first()
                    if cat:
                        agc = ArticleGroupCategory(group_id=group.id, category_id=str(cat.id))
                        db.add(agc)

        if "tag_slugs" in update_fields:
            # Delete existing tag links
            db.query(ArticleGroupTag).filter(
                ArticleGroupTag.group_id == group.id
            ).delete()
            new_tags = update_fields.pop("tag_slugs")
            if new_tags:
                for tag_slug in new_tags:
                    tag = db.query(NewsTag).filter(NewsTag.slug == tag_slug).first()
                    if not tag:
                        tag = NewsTag(slug=tag_slug, name=tag_slug.replace("-", " ").title())
                        db.add(tag)
                        db.flush()
                    agt = ArticleGroupTag(group_id=group.id, tag_id=str(tag.id))
                    db.add(agt)

        for field, value in update_fields.items():
            if settings.USE_FILE_STORAGE and field == "body":
                continue
            setattr(translation, field, value)

        if data.is_published and not translation.is_published:
            translation.published_at = translation.published_at or now

        # Update markdown file if body changed
        if settings.USE_FILE_STORAGE and ("body" in update_fields or "title" in update_fields):
            filepath = _markdown_file_path(group.shared_slug, translation.published_at or now)
            metadata = {
                "title": translation.title,
                "slug": group.shared_slug,
                "summary": translation.summary or "",
                "cover_image": translation.cover_image or "",
                "locale": translation.locale,
            }
            if body_content is None:
                existing_file = _find_markdown_file(group.shared_slug, translation.published_at)
                if existing_file:
                    post = _read_markdown_file(existing_file)
                    body_content = post.content if post else ""
            _write_markdown_file(filepath, body_content or "", metadata)
            translation.body = None

        updated_results.append(translation)

    db.commit()
    for t in updated_results:
        db.refresh(t)
    return [_get_translation_with_relations(db, t, True, True, True) for t in updated_results]


def toggle_article_translation_status(
    db: Session, slug: str, published: bool,
) -> Optional[Dict[str, Any]]:
    """Toggle publish status for all translations with matching slug."""
    group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == slug).first()
    if not group:
        return None

    translations = db.query(ArticleTranslation).filter(ArticleTranslation.group_id == group.id).all()
    now = datetime.utcnow()

    for t in translations:
        t.is_published = published
        if published and not t.published_at:
            t.published_at = now

    db.commit()
    for t in translations:
        db.refresh(t)

    # Return the first translation (single object, not list)
    return _get_translation_with_relations(db, translations[0], True, True, True)


def delete_article_group(db: Session, slug: str) -> bool:
    """Delete an article group and all its translations."""
    group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == slug).first()
    if not group:
        return False

    # Delete markdown file
    if settings.USE_FILE_STORAGE:
        for translation in db.query(ArticleTranslation).filter(ArticleTranslation.group_id == group.id).all():
            filepath = _find_markdown_file(group.shared_slug, translation.published_at)
            if filepath and filepath.exists():
                filepath.unlink()

    # Delete relationships (CASCADE should handle translations, but let's be explicit)
    db.query(ArticleGroupCategory).filter(ArticleGroupCategory.group_id == group.id).delete()
    db.query(ArticleGroupTag).filter(ArticleGroupTag.group_id == group.id).delete()
    db.query(ArticleTranslation).filter(ArticleTranslation.group_id == group.id).delete()
    db.delete(group)
    db.commit()
    return True


# ============================================================
# Legacy compatibility functions (NewsArticle)
# ============================================================


def list_articles(
    db: Session,
    published_only: bool = False,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    search: Optional[str] = None,
    locale: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    Public-facing list: return flat article dicts (translations).
    Falls back to NewsArticle if file-based.
    """
    if settings.USE_FILE_STORAGE:
        # New group-based system
        groups = list_article_groups(db, published_only, category_slug, tag_slug, search, limit, offset)
        if locale:
            result = []
            for group in groups:
                translations = group.get("translations", [])
                candidates = [
                    item for item in translations
                    if not published_only or item.get("is_published")
                ]
                selected = None
                target_locale = _article_locale(locale)
                if target_locale:
                    selected = next((item for item in candidates if item.get("locale") == target_locale), None)
                if not selected:
                    selected = next((item for item in candidates if item.get("locale") == "en"), None)
                if not selected and candidates:
                    selected = candidates[0]
                if selected:
                    result.append(selected)
            return result

        # Flatten: respect published_only flag
        # When published_only=True: return only published translations
        # When published_only=False (admin): return all translations regardless of status
        result = []
        for group in groups:
            for trans in group.get("translations", []):
                if published_only:
                    # Public list: only published
                    if not trans.get("is_published"):
                        continue
                # else: admin list: all translations (published and draft)

                # Apply category filter
                if category_slug:
                    cats = [c["slug"] for c in trans.get("categories", [])]
                    if category_slug not in cats:
                        continue

                # Apply tag filter
                if tag_slug:
                    tags = [t["slug"] for t in trans.get("tags", [])]
                    if tag_slug not in tags:
                        continue

                result.append(trans)
        return result

    # Legacy NewsArticle path
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
    db: Session,
    slug: str,
    include_html: bool = False,
    locale: Optional[str] = None,
    published_only: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Get article by slug. Tries new system first, falls back to legacy.
    """
    if settings.USE_FILE_STORAGE:
        # Try new system
        if locale:
            group = db.query(ArticleGroup).filter(ArticleGroup.shared_slug == slug).first()
            if not group:
                translation = db.query(ArticleTranslation).filter(ArticleTranslation.slug == slug).first()
                if translation:
                    group = db.query(ArticleGroup).filter(ArticleGroup.id == translation.group_id).first()
            if group:
                translations = (
                    db.query(ArticleTranslation)
                    .filter(ArticleTranslation.group_id == group.id)
                    .all()
                )
                selected = _select_translation(translations, locale=locale, published_only=published_only)
                if selected:
                    return _get_translation_with_relations(db, selected, include_html, True, True)

        result = get_article_translation(db, slug, include_html=include_html)
        if result and published_only and not result.get("is_published"):
            return None
        if result:
            return result
        # Try getting group and first translation
        group = get_article_group_by_slug(db, slug)
        if group and group.get("translations"):
            return group["translations"][0]
    else:
        # Legacy
        article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
        if not article:
            return None
        if not settings.USE_FILE_STORAGE:
            return _get_article_with_relations(db, article, include_html)

        filepath = _find_markdown_file(article.slug, article.published_at)
        post = _read_markdown_file(filepath)
        if post:
            article.body = post.content or article.body
            article.summary = post.metadata.get("summary") or article.summary
            article.cover_image = post.metadata.get("cover_image") or article.cover_image
            article.locale = post.metadata.get("locale") or article.locale or "en"

        return _get_article_with_relations(db, article, include_html)

    return None


def create_article(
    db: Session, article_data: NewsArticleCreate, author_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create article. Uses new system if file storage, otherwise legacy.
    """
    if settings.USE_FILE_STORAGE:
        return create_article_translation(db, article_data, author_id)

    # Legacy path
    now = datetime.utcnow()
    published_at = article_data.published_at or (now if article_data.is_published else None)
    article = NewsArticle(
        slug=article_data.slug,
        title=article_data.title,
        summary=article_data.summary,
        body=article_data.body,
        author_id=author_id,
        published_at=published_at,
        cover_image=article_data.cover_image,
        is_published=article_data.is_published,
        locale=article_data.locale,
    )
    db.add(article)
    db.flush()

    if settings.USE_FILE_STORAGE:
        filepath = _markdown_file_path(article.slug, article.published_at or now)
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
    """
    Update article. Uses new system if file storage, otherwise legacy.
    """
    if settings.USE_FILE_STORAGE:
        return update_article_translation(db, slug, article_data)

    # Legacy path
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
        filepath = _markdown_file_path(article.slug, article.published_at or now)
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


def toggle_publish(db: Session, slug: str, published: bool) -> Optional[Dict[str, Any]]:
    """Toggle publish status."""
    if settings.USE_FILE_STORAGE:
        return toggle_article_translation_status(db, slug, published)

    # Legacy path
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        return None
    article.is_published = published
    now = datetime.utcnow()
    if published and not article.published_at:
        article.published_at = now
    db.commit()
    db.refresh(article)
    return _get_article_with_relations(db, article)


def delete_article(db: Session, slug: str) -> bool:
    """Delete article."""
    if settings.USE_FILE_STORAGE:
        return delete_article_group(db, slug)

    # Legacy path
    article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
    if not article:
        return False

    if settings.USE_FILE_STORAGE:
        now = datetime.utcnow()
        filepath = _markdown_file_path(article.slug, article.published_at or now)
        if filepath.exists():
            filepath.unlink()

        legacy_path = _get_news_dir() / _generate_filename(slug, None)
        if legacy_path.exists():
            legacy_path.unlink()

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


def _safe_dt_for_cats(dt_val):
    """Convert datetime to datetime object for Pydantic validation (categories/tags version)."""
    if dt_val is None:
        return None
    if isinstance(dt_val, str):
        if dt_val.lower() in ('none', ''):
            return None
        try:
            return datetime.fromisoformat(dt_val)
        except (ValueError, TypeError):
            return None
    return dt_val


def _get_article_with_relations(
    db: Session, article: NewsArticle, include_html: bool = False
) -> Dict[str, Any]:
    """Legacy: build flat dict from NewsArticle with relations."""
    categories = get_article_categories(db, str(article.id))
    tags = get_article_tags(db, str(article.id))

    result = {
        "id": str(article.id),
        "slug": article.slug,
        "title": article.title,
        "summary": article.summary,
        "body": article.body or "",
        "author_id": str(article.author_id) if article.author_id else None,
        "published_at": _safe_dt_for_cats(article.published_at),
        "cover_image": article.cover_image or "",
        "is_published": article.is_published,
        "locale": article.locale,
        "created_at": _safe_dt_for_cats(article.created_at),
        "categories": [
            {
                "id": str(c.id),
                "slug": c.slug,
                "name": c.name,
                "name_zh": c.name_zh,
                "color": c.color,
                "created_at": _safe_dt_for_cats(getattr(c, 'created_at', None)),
                "is_active": getattr(c, 'is_active', True),
            }
            for c in categories
        ],
        "tags": [
            {
                "id": str(t.id),
                "slug": t.slug,
                "name": t.name,
                "name_zh": t.name_zh,
                "created_at": _safe_dt_for_cats(getattr(t, 'created_at', None)),
            }
            for t in tags
        ],
    }

    if include_html:
        now = datetime.utcnow()
        filepath = _markdown_file_path(article.slug, article.published_at or now)
        if not filepath.exists():
            filepath = _markdown_file_path(article.slug, None)
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
        filepath = _markdown_file_path(article.slug, article.published_at)
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
