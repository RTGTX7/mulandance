"""allow fixed-course drafts without an assigned room

Revision ID: course_unassigned_room
Revises: ai_capability_switches
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa


revision = "course_unassigned_room"
down_revision = "ai_capability_switches"
branch_labels = None
depends_on = None


def upgrade() -> None:
    template_columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("course_templates")
    }
    if "allow_unassigned_room" not in template_columns:
        op.add_column(
            "course_templates",
            sa.Column("allow_unassigned_room", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    with op.batch_alter_table("course_offering_slots") as batch_op:
        batch_op.alter_column("room_id", existing_type=sa.String(36), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("course_offering_slots") as batch_op:
        batch_op.alter_column("room_id", existing_type=sa.String(36), nullable=False)
    template_columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("course_templates")
    }
    if "allow_unassigned_room" in template_columns:
        op.drop_column("course_templates", "allow_unassigned_room")
