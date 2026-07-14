"""add course template scheduling tables

Revision ID: course_template_schedule
Revises: add_unified_schedule
Create Date: 2026-07-12
"""
from alembic import op
import sqlalchemy as sa

revision = "course_template_schedule"
down_revision = "add_unified_schedule"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("course_templates", sa.Column("id", sa.String(36), primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text), sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("translations_json", sa.Text), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True)))
    op.create_table("course_offerings", sa.Column("id", sa.String(36), primary_key=True), sa.Column("course_template_id", sa.String(36), sa.ForeignKey("course_templates.id", ondelete="CASCADE"), nullable=False), sa.Column("name", sa.String(200), nullable=False), sa.Column("start_date", sa.String(10), nullable=False), sa.Column("end_date", sa.String(10), nullable=False), sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("is_public", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True)))
    op.create_index("ix_course_offerings_course_template_id", "course_offerings", ["course_template_id"])
    op.create_table("course_offering_slots", sa.Column("id", sa.String(36), primary_key=True), sa.Column("offering_id", sa.String(36), sa.ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False), sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False), sa.Column("days_of_week_json", sa.Text), sa.Column("start_time", sa.String(5), nullable=False), sa.Column("end_time", sa.String(5), nullable=False), sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.create_index("ix_course_offering_slots_offering_id", "course_offering_slots", ["offering_id"])
    op.create_index("ix_course_offering_slots_room_id", "course_offering_slots", ["room_id"])
    op.create_table("course_offering_slot_exceptions", sa.Column("id", sa.String(36), primary_key=True), sa.Column("slot_id", sa.String(36), sa.ForeignKey("course_offering_slots.id", ondelete="CASCADE"), nullable=False), sa.Column("date", sa.String(10), nullable=False), sa.Column("kind", sa.String(20), nullable=False), sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT")), sa.Column("start_time", sa.String(5)), sa.Column("end_time", sa.String(5)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.create_index("ix_course_offering_slot_exceptions_slot_id", "course_offering_slot_exceptions", ["slot_id"])


def downgrade() -> None:
    op.drop_table("course_offering_slot_exceptions")
    op.drop_table("course_offering_slots")
    op.drop_table("course_offerings")
    op.drop_table("course_templates")
