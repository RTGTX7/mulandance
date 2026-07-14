"""add reusable permission presets

Revision ID: permission_presets
Revises: account_permissions
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "permission_presets"
down_revision = "account_permissions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    tables = set(sa.inspect(op.get_bind()).get_table_names())
    if "permission_presets" in tables:
        return
    op.create_table(
        "permission_presets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("permissions_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("updated_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("name", name="uq_permission_preset_name"),
    )
    op.create_index("ix_permission_presets_name", "permission_presets", ["name"])


def downgrade() -> None:
    op.drop_table("permission_presets")
