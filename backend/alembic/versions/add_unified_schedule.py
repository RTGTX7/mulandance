"""add unified scheduling tables

Revision ID: add_unified_schedule
Revises: add_article_groups_tables
Create Date: 2026-07-12
"""
from alembic import op
import sqlalchemy as sa

revision = "add_unified_schedule"
down_revision = "add_article_groups_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("studios", sa.Column("id", sa.String(36), primary_key=True), sa.Column("name", sa.String(160), nullable=False, unique=True), sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.create_table("studio_rooms", sa.Column("id", sa.String(36), primary_key=True), sa.Column("studio_id", sa.String(36), sa.ForeignKey("studios.id", ondelete="CASCADE"), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"), sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.create_index("ix_studio_rooms_studio_id", "studio_rooms", ["studio_id"])
    op.create_table("fixed_class_plans", sa.Column("id", sa.String(36), primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text), sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False), sa.Column("day_of_week", sa.Integer, nullable=False), sa.Column("days_of_week_json", sa.Text, server_default="[]"), sa.Column("start_time", sa.String(5), nullable=False), sa.Column("end_time", sa.String(5), nullable=False), sa.Column("start_date", sa.String(10), nullable=False), sa.Column("end_date", sa.String(10), nullable=False), sa.Column("is_public", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()), sa.Column("translations_json", sa.Text), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True)))
    op.create_index("ix_fixed_class_plans_room_id", "fixed_class_plans", ["room_id"])
    op.create_table("fixed_class_exceptions", sa.Column("id", sa.String(36), primary_key=True), sa.Column("plan_id", sa.String(36), sa.ForeignKey("fixed_class_plans.id", ondelete="CASCADE"), nullable=False), sa.Column("date", sa.String(10), nullable=False), sa.Column("kind", sa.String(20), nullable=False), sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT")), sa.Column("start_time", sa.String(5)), sa.Column("end_time", sa.String(5)), sa.Column("title", sa.String(200)), sa.Column("description", sa.Text), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.create_table("schedule_bookings", sa.Column("id", sa.String(36), primary_key=True), sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False), sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("date", sa.String(10), nullable=False), sa.Column("start_time", sa.String(5), nullable=False), sa.Column("end_time", sa.String(5), nullable=False), sa.Column("booking_type", sa.String(30), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("student_name", sa.String(200)), sa.Column("participant_count", sa.Integer, nullable=False, server_default="0"), sa.Column("notes", sa.Text), sa.Column("status", sa.String(20), nullable=False, server_default="confirmed"), sa.Column("is_locked", sa.Boolean, nullable=False, server_default=sa.false()), sa.Column("created_by_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True)))
    op.create_index("ix_schedule_bookings_date", "schedule_bookings", ["date"])
    op.create_table("schedule_coordination_requests", sa.Column("id", sa.String(36), primary_key=True), sa.Column("requested_by_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("booking_id", sa.String(36), sa.ForeignKey("schedule_bookings.id", ondelete="SET NULL")), sa.Column("requested_date", sa.String(10), nullable=False), sa.Column("requested_room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="SET NULL")), sa.Column("requested_start_time", sa.String(5), nullable=False), sa.Column("requested_end_time", sa.String(5), nullable=False), sa.Column("message", sa.Text), sa.Column("status", sa.String(20), nullable=False, server_default="pending"), sa.Column("resolved_by_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("resolution_note", sa.Text), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    op.drop_table("schedule_coordination_requests")
    op.drop_table("schedule_bookings")
    op.drop_table("fixed_class_exceptions")
    op.drop_table("fixed_class_plans")
    op.drop_table("studio_rooms")
    op.drop_table("studios")
