"""add homepage news visibility

Revision ID: homepage_content_sections
Revises: fixed_course_ai_drafts
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "homepage_content_sections"
down_revision = "fixed_course_ai_drafts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "article_groups",
        sa.Column("show_on_homepage", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("article_groups", "show_on_homepage")
