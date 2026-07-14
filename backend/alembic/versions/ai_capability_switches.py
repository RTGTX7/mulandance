"""add AI thinking and image capability switches

Revision ID: ai_capability_switches
Revises: permission_presets
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa


revision = "ai_capability_switches"
down_revision = "permission_presets"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("system_settings")
    }
    if "ai_thinking_enabled" not in columns:
        op.add_column(
            "system_settings",
            sa.Column("ai_thinking_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if "ai_image_enabled" not in columns:
        op.add_column(
            "system_settings",
            sa.Column("ai_image_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("system_settings")
    }
    if "ai_image_enabled" in columns:
        op.drop_column("system_settings", "ai_image_enabled")
    if "ai_thinking_enabled" in columns:
        op.drop_column("system_settings", "ai_thinking_enabled")
