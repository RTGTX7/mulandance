"""add fixed-course AI draft metadata

Revision ID: fixed_course_ai_drafts
Revises: external_rental_requests
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "fixed_course_ai_drafts"
down_revision = "external_rental_requests"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("course_templates", sa.Column("is_ai_draft", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("course_templates", sa.Column("ai_draft_meta_json", sa.Text(), nullable=True))
    op.add_column("course_templates", sa.Column("allow_unassigned_teacher", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("system_settings", sa.Column("ai_feature_models_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("system_settings", "ai_feature_models_json")
    op.drop_column("course_templates", "allow_unassigned_teacher")
    op.drop_column("course_templates", "ai_draft_meta_json")
    op.drop_column("course_templates", "is_ai_draft")
