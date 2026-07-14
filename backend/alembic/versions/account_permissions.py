"""add account-level permissions

Revision ID: account_permissions
Revises: site_settings_drafts
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa
import uuid

revision = "account_permissions"
down_revision = "site_settings_drafts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    if "user_permissions" not in tables:
        op.create_table(
            "user_permissions",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("permission_key", sa.String(120), nullable=False),
            sa.Column("can_view", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("can_manage", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("updated_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True)),
            sa.UniqueConstraint("user_id", "permission_key", name="uq_user_permission_key"),
        )
        op.create_index("ix_user_permissions_user_id", "user_permissions", ["user_id"])
    if "permission_audit_logs" not in tables:
        op.create_table(
            "permission_audit_logs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
            sa.Column("target_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("before_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("after_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_permission_audit_logs_target_user_id", "permission_audit_logs", ["target_user_id"])

    # Preserve the pre-permission-system surface for existing ordinary admins.
    legacy_keys = (
        "content", "content.homepage", "content.news", "content.news.articles",
        "content.news.categories", "content.news.tags", "content.performances",
        "teaching", "teaching.programs", "teaching.schedules",
        "teaching.schedules.calendar", "teaching.schedules.fixed",
        "teaching.schedules.bookings", "teaching.schedules.ai",
    )
    readonly_keys = {"teaching.schedules.calendar", "teaching.schedules.fixed", "teaching.schedules.ai"}
    admins = bind.execute(sa.text("SELECT id FROM users WHERE role = 'admin'")).fetchall()
    for (user_id,) in admins:
        count = bind.execute(
            sa.text("SELECT COUNT(*) FROM user_permissions WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).scalar_one()
        if count:
            continue
        for key in legacy_keys:
            bind.execute(
                sa.text(
                    "INSERT INTO user_permissions "
                    "(id, user_id, permission_key, can_view, can_manage) "
                    "VALUES (:id, :user_id, :key, :can_view, :can_manage)"
                ),
                {
                    "id": str(uuid.uuid4()), "user_id": user_id, "key": key,
                    "can_view": True, "can_manage": key not in readonly_keys,
                },
            )


def downgrade() -> None:
    op.drop_table("permission_audit_logs")
    op.drop_table("user_permissions")
