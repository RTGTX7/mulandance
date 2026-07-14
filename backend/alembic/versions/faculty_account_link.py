"""link faculty profiles to teacher accounts

Revision ID: faculty_account_link
Revises: structured_pricing
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa


revision = "faculty_account_link"
down_revision = "structured_pricing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("faculty_members", sa.Column("user_id", sa.String(36), nullable=True))
    op.create_foreign_key("fk_faculty_members_user_id", "faculty_members", "users", ["user_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_faculty_members_user_id", "faculty_members", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_faculty_members_user_id", table_name="faculty_members")
    op.drop_constraint("fk_faculty_members_user_id", "faculty_members", type_="foreignkey")
    op.drop_column("faculty_members", "user_id")
