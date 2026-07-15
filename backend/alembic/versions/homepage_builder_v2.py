"""add homepage builder v2 documents

Revision ID: homepage_builder_v2
Revises: logto_authentication
Create Date: 2026-07-14
"""

from alembic import op
import sqlalchemy as sa


revision = "homepage_builder_v2"
down_revision = "logto_authentication"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("system_settings")
    }
    with op.batch_alter_table("system_settings") as batch:
        if "homepage_v2_json" not in columns:
            batch.add_column(sa.Column("homepage_v2_json", sa.Text(), nullable=True))
        if "homepage_v2_draft_json" not in columns:
            batch.add_column(sa.Column("homepage_v2_draft_json", sa.Text(), nullable=True))


def downgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("system_settings")
    }
    with op.batch_alter_table("system_settings") as batch:
        if "homepage_v2_draft_json" in columns:
            batch.drop_column("homepage_v2_draft_json")
        if "homepage_v2_json" in columns:
            batch.drop_column("homepage_v2_json")
