"""
Migration script: Convert news_articles to article_groups + article_translations.

This script:
1. Creates new tables: article_groups, article_group_categories, article_group_tags, article_translations
2. Migrates existing data:
   - Group articles by slug (articles with same slug = same group)
   - Create ArticleGroup for each unique slug group
   - Create ArticleTranslation for each news_article
   - Transfer category/tag relationships
3. Leaves old tables intact for safety (can be cleaned up later)
"""

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models import (
    ArticleGroup,
    ArticleGroupCategory,
    ArticleGroupTag,
    ArticleTranslation,
    NewsArticle,
    NewsArticleCategory,
    NewsArticleTag,
    NewsCategory,
    NewsTag,
)


def create_new_tables():
    """Create only the new tables (older ones already exist)."""
    # This is safe to run multiple times since Base.create_all won't fail on existing tables
    from app.models import Base
    Base.metadata.create_all(bind=engine, tables=[
        ArticleGroup.__table__,
        ArticleGroupCategory.__table__,
        ArticleGroupTag.__table__,
        ArticleTranslation.__table__,
    ])
    print("New tables verified/created.")


def migrate():
    db = SessionLocal()
    try:
        # Step 1: Create new tables
        create_new_tables()

        # Step 2: Get all news articles grouped by slug
        articles = db.query(NewsArticle).all()
        slug_groups: dict[str, list[NewsArticle]] = {}
        for article in articles:
            slug_groups.setdefault(article.slug, []).append(article)

        print(f"Found {len(articles)} articles in {len(slug_groups)} slug groups.")

        # Step 3: Create ArticleGroup + ArticleTranslation for each group
        for slug, group_articles in slug_groups.items():
            # Create ArticleGroup with shared_slug
            group_id = str(uuid.uuid4())
            article_group = ArticleGroup(
                id=group_id,
                shared_slug=slug,
            )
            db.add(article_group)

            # Migrate categories
            for art in group_articles:
                cats = (
                    db.query(NewsArticleCategory)
                    .filter(NewsArticleCategory.article_id == art.id)
                    .all()
                )
                for cat_rel in cats:
                    db.add(ArticleGroupCategory(
                        group_id=group_id,
                        category_id=cat_rel.category_id,
                    ))

            # Migrate tags
            for art in group_articles:
                tags = (
                    db.query(NewsArticleTag)
                    .filter(NewsArticleTag.article_id == art.id)
                    .all()
                )
                for tag_rel in tags:
                    db.add(ArticleGroupTag(
                        group_id=group_id,
                        tag_id=tag_rel.tag_id,
                    ))

            # Create ArticleTranslation for each article
            for art in group_articles:
                translation = ArticleTranslation(
                    id=str(uuid.uuid4()),
                    group_id=group_id,
                    locale=art.locale,
                    slug=art.slug,  # locale-specific slug
                    title=art.title,
                    summary=art.summary,
                    body=art.body,
                    author_id=art.author_id,
                    published_at=art.published_at,
                    cover_image=art.cover_image,
                    is_published=art.is_published,
                    created_at=art.created_at,
                )
                db.add(translation)

            print(f"  Migrated slug '{slug}': {len(group_articles)} translation(s)")

        db.commit()
        print("Migration complete!")
        print("\nNote: Old tables (news_articles, news_article_categories, news_article_tags) are preserved.")
        print("You can delete them manually after verifying the new structure works.")

    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()