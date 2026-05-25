"""add news categories and tags

Revision ID: add_news_categories_tags
Revises:
Create Date: 2026-05-25

Adds news_categories, news_tags, news_article_categories, news_article_tags tables
and seeds initial categories.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "add_news_categories_tags"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    # Categories table
    op.create_table(
        "news_categories",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()") if op.get_context().autocommit_block is None else None),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("name_zh", sa.String(100)),
        sa.Column("description", sa.Text()),
        sa.Column("color", sa.String(7), server_default="#6366f1"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_news_categories_slug", "news_categories", ["slug"])

    # Tags table
    op.create_table(
        "news_tags",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("name_zh", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_news_tags_slug", "news_tags", ["slug"])

    # Article-Category junction table
    op.create_table(
        "news_article_categories",
        sa.Column("article_id", sa.String(36), sa.ForeignKey("news_articles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", sa.String(36), sa.ForeignKey("news_categories.id", ondelete="CASCADE"), primary_key=True),
    )

    # Article-Tag junction table
    op.create_table(
        "news_article_tags",
        sa.Column("article_id", sa.String(36), sa.ForeignKey("news_articles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.String(36), sa.ForeignKey("news_tags.id", ondelete="CASCADE"), primary_key=True),
    )

    # Add locale column to news_articles
    op.add_column("news_articles", sa.Column("locale", sa.String(10), server_default="en"))

    # Seed initial categories
    import uuid
    now = sa.func.now()
    op.execute(f"""
        INSERT INTO news_categories (id, slug, name, name_zh, description, color, is_active, created_at) VALUES
        ('{uuid.uuid4()}', 'announcements', 'Announcements', '公告', 'Official studio announcements', '#6366f1', true, {now}),
        ('{uuid.uuid4()}', 'performances', 'Performances', '演出', 'Performances and showcases', '#ec4899', true, {now}),
        ('{uuid.uuid4()}', 'classes', 'Classes', '课程', 'Class updates and schedules', '#10b981', true, {now}),
        ('{uuid.uuid4()}', 'studio', 'Studio', '工作室', 'Studio news and updates', '#f59e0b', true, {now}),
        ('{uuid.uuid4()}', 'general', 'General', '综合', 'General news and updates', '#8b5cf6', true, {now})
    """)


def downgrade() -> None:
    op.drop_table("news_article_tags")
    op.drop_table("news_article_categories")
    op.drop_table("news_tags")
    op.drop_table("news_categories")
    op.drop_column("news_articles", "locale")
