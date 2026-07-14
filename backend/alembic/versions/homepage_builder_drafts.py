"""add homepage builder drafts

Revision ID: homepage_builder_drafts
Revises: faculty_account_link
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "homepage_builder_drafts"
down_revision = "faculty_account_link"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("system_settings", sa.Column("homepage_draft_json", sa.Text(), nullable=True))
    op.add_column("system_settings", sa.Column("homepage_published_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("system_settings", "homepage_published_at")
    op.drop_column("system_settings", "homepage_draft_json")
