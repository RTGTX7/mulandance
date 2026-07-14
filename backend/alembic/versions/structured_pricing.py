"""add structured pricing catalogs

Revision ID: structured_pricing
Revises: homepage_content_sections
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "structured_pricing"
down_revision = "homepage_content_sections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pricing_catalogs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("title", sa.String(240), nullable=False, server_default=""),
        sa.Column("subtitle", sa.Text(), server_default=""),
        sa.Column("translations_json", sa.Text(), server_default="{}"),
        sa.Column("published_json", sa.Text(), server_default=""),
        sa.Column("is_dirty", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("kind"),
    )
    op.create_index("ix_pricing_catalogs_kind", "pricing_catalogs", ["kind"], unique=True)
    op.create_table(
        "pricing_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("catalog_id", sa.String(36), sa.ForeignKey("pricing_catalogs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("program_id", sa.String(36), sa.ForeignKey("programs.id", ondelete="SET NULL")),
        sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(240), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), server_default=""),
        sa.Column("badge", sa.String(120), server_default=""),
        sa.Column("image_url", sa.String(1000), server_default=""),
        sa.Column("details_json", sa.Text(), server_default="[]"),
        sa.Column("translations_json", sa.Text(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_pricing_plans_catalog_id", "pricing_plans", ["catalog_id"])
    op.create_index("ix_pricing_plans_program_id", "pricing_plans", ["program_id"])
    op.create_index("ix_pricing_plans_room_id", "pricing_plans", ["room_id"])
    op.create_table(
        "pricing_options",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("plan_id", sa.String(36), sa.ForeignKey("pricing_plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(180), nullable=False, server_default=""),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="CAD"),
        sa.Column("unit", sa.String(120), server_default=""),
        sa.Column("note", sa.Text(), server_default=""),
        sa.Column("translations_json", sa.Text(), server_default="{}"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_pricing_options_plan_id", "pricing_options", ["plan_id"])
    op.create_table(
        "pricing_content_blocks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("catalog_id", sa.String(36), sa.ForeignKey("pricing_catalogs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("block_type", sa.String(40), nullable=False, server_default="info"),
        sa.Column("title", sa.String(240), nullable=False, server_default=""),
        sa.Column("body", sa.Text(), server_default=""),
        sa.Column("items_json", sa.Text(), server_default="[]"),
        sa.Column("translations_json", sa.Text(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_pricing_content_blocks_catalog_id", "pricing_content_blocks", ["catalog_id"])


def downgrade() -> None:
    op.drop_table("pricing_content_blocks")
    op.drop_table("pricing_options")
    op.drop_table("pricing_plans")
    op.drop_table("pricing_catalogs")
