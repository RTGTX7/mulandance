"""add site settings drafts

Revision ID: site_settings_drafts
Revises: homepage_builder_drafts
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "site_settings_drafts"
down_revision = "homepage_builder_drafts"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("system_settings", sa.Column("site_draft_json", sa.Text(), nullable=True))
    op.add_column("system_settings", sa.Column("site_published_at", sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column("system_settings", "site_published_at")
    op.drop_column("system_settings", "site_draft_json")
