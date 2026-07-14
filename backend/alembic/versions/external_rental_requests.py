"""add public external rental requests

Revision ID: external_rental_requests
Revises: course_template_schedule
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "external_rental_requests"
down_revision = "course_template_schedule"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("studio_rooms", sa.Column("is_rentable", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("schedule_bookings", sa.Column("external_request_id", sa.String(36), nullable=True))
    op.create_index("ix_schedule_bookings_external_request_id", "schedule_bookings", ["external_request_id"])
    op.create_table(
        "external_rental_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("room_id", sa.String(36), sa.ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("request_mode", sa.String(20), nullable=False, server_default="single"),
        sa.Column("date", sa.String(10), nullable=True),
        sa.Column("start_date", sa.String(10), nullable=True),
        sa.Column("end_date", sa.String(10), nullable=True),
        sa.Column("days_of_week_json", sa.Text, nullable=False, server_default="[]"),
        sa.Column("start_time", sa.String(5), nullable=False),
        sa.Column("end_time", sa.String(5), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("applicant_name", sa.String(160), nullable=False),
        sa.Column("applicant_contact", sa.String(200), nullable=False),
        sa.Column("notes", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_external_rental_requests_room_id", "external_rental_requests", ["room_id"])
    op.create_index("ix_external_rental_requests_status", "external_rental_requests", ["status"])


def downgrade() -> None:
    op.drop_table("external_rental_requests")
    op.drop_index("ix_schedule_bookings_external_request_id", table_name="schedule_bookings")
    op.drop_column("schedule_bookings", "external_request_id")
    op.drop_column("studio_rooms", "is_rentable")
