"""add article groups, translations, and related tables

Revision ID: add_article_groups_tables
Revises: add_news_categories_tags
Create Date: 2026-05-27

Creates the missing tables required by the multilingual article system:
- article_groups
- article_group_categories
- article_group_tags
- article_translations
"""
from alembic import op
import sqlalchemy as sa
import uuid
from datetime import datetime

# revision identifiers
revision = "add_article_groups_tables"
down_revision = "add_news_categories_tags"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # article_groups table
    op.create_table(
        "article_groups",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("shared_slug", sa.String(200), unique=True, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # article_group_categories junction table
    op.create_table(
        "article_group_categories",
        sa.Column("group_id", sa.String(36), sa.ForeignKey("article_groups.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", sa.String(36), sa.ForeignKey("news_categories.id", ondelete="CASCADE"), primary_key=True),
    )

    # article_group_tags junction table
    op.create_table(
        "article_group_tags",
        sa.Column("group_id", sa.String(36), sa.ForeignKey("article_groups.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.String(36), sa.ForeignKey("news_tags.id", ondelete="CASCADE"), primary_key=True),
    )

    # article_translations table
    op.create_table(
        "article_translations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("group_id", sa.String(36), sa.ForeignKey("article_groups.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("locale", sa.String(10), nullable=False, server_default="en"),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("summary", sa.Text()),
        sa.Column("body", sa.Text()),
        sa.Column("author_id", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("cover_image", sa.String(500)),
        sa.Column("is_published", sa.Boolean, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Migrate existing articles from news_articles to article_groups + article_translations
    # Using Python-based UUID generation for SQLite compatibility
    conn = op.get_bind()
    
    # Get all existing articles
    articles_result = conn.execute(
        sa.text("""
            SELECT id, slug, title, summary, body, author_id, published_at, 
                   cover_image, is_published, locale, created_at, updated_at
            FROM news_articles
        """)
    ).fetchall()

    now = datetime.utcnow()
    group_id_map = {}  # old_article_id -> new_group_id

    # Create article_groups
    for article in articles_result:
        group_id = str(uuid.uuid4())
        group_id_map[article[0]] = group_id
        
        conn.execute(
            sa.text("""
                INSERT INTO article_groups (id, shared_slug, created_at)
                VALUES (:id, :shared_slug, :created_at)
            """),
            {
                "id": group_id,
                "shared_slug": article[1],
                "created_at": article[11] or now.isoformat(),
            }
        )

    # Create article_translations
    for article in articles_result:
        old_id = article[0]
        group_id = group_id_map[old_id]
        
        conn.execute(
            sa.text("""
                INSERT INTO article_translations (
                    id, group_id, locale, slug, title, summary, body, 
                    author_id, published_at, cover_image, is_published, created_at
                ) VALUES (
                    :id, :group_id, :locale, :slug, :title, :summary, :body,
                    :author_id, :published_at, :cover_image, :is_published, :created_at
                )
            """),
            {
                "id": old_id,  # Use same ID for reference preservation
                "group_id": group_id,
                "locale": article[11] if article[11] else "en",
                "slug": article[1],
                "title": article[2],
                "summary": article[3],
                "body": article[4],
                "author_id": article[5],
                "published_at": article[6],
                "cover_image": article[7],
                "is_published": bool(article[8]) if article[8] is not None else False,
                "created_at": article[11] or now.isoformat(),
            }
        )

    # Migrate category links
    cat_links = conn.execute(
        sa.text("""
            SELECT article_id, category_id FROM news_article_categories
        """)
    ).fetchall()

    for link in cat_links:
        old_article_id = link[0]
        if old_article_id in group_id_map:
            group_id = group_id_map[old_article_id]
            try:
                conn.execute(
                    sa.text("""
                        INSERT OR IGNORE INTO article_group_categories (group_id, category_id)
                        VALUES (:group_id, :category_id)
                    """),
                    {"group_id": group_id, "category_id": link[1]}
                )
            except Exception:
                pass  # Skip if already exists

    # Migrate tag links
    tag_links = conn.execute(
        sa.text("""
            SELECT article_id, tag_id FROM news_article_tags
        """)
    ).fetchall()

    for link in tag_links:
        old_article_id = link[0]
        if old_article_id in group_id_map:
            group_id = group_id_map[old_article_id]
            try:
                conn.execute(
                    sa.text("""
                        INSERT OR IGNORE INTO article_group_tags (group_id, tag_id)
                        VALUES (:group_id, :tag_id)
                    """),
                    {"group_id": group_id, "tag_id": link[1]}
                )
            except Exception:
                pass  # Skip if already exists


def downgrade() -> None:
    # Drop the new tables (articles remain in news_articles for safety)
    op.drop_table("article_translations")
    op.drop_table("article_group_tags")
    op.drop_table("article_group_categories")
    op.drop_table("article_groups")