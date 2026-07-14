"""integrate Logto identities

Revision ID: logto_authentication
Revises: multilingual_teacher_nicknames
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa


revision = "logto_authentication"
down_revision = "multilingual_teacher_nicknames"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    with op.batch_alter_table("users") as batch:
        if "logto_subject" not in user_columns:
            batch.add_column(sa.Column("logto_subject", sa.String(255), nullable=True))
        if "account_type" not in user_columns:
            batch.add_column(sa.Column("account_type", sa.String(30), nullable=True))
        if "provisioning_status" not in user_columns:
            batch.add_column(sa.Column("provisioning_status", sa.String(20), nullable=False, server_default="active"))
        if "password_hash" in user_columns:
            batch.alter_column("password_hash", existing_type=sa.String(255), nullable=True)

    indexes = {index["name"] for index in sa.inspect(bind).get_indexes("users")}
    if "ix_users_logto_subject" not in indexes:
        op.create_index("ix_users_logto_subject", "users", ["logto_subject"], unique=True)
    if "ix_users_account_type" not in indexes:
        op.create_index("ix_users_account_type", "users", ["account_type"])
    if "ix_users_provisioning_status" not in indexes:
        op.create_index("ix_users_provisioning_status", "users", ["provisioning_status"])

    tables = set(sa.inspect(bind).get_table_names())
    if "account_type_permission_defaults" not in tables:
        op.create_table(
            "account_type_permission_defaults",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("account_type", sa.String(30), nullable=False, unique=True),
            sa.Column("preset_id", sa.String(36), sa.ForeignKey("permission_presets.id", ondelete="SET NULL")),
            sa.Column("updated_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True)),
        )
        op.create_index("ix_account_type_permission_defaults_account_type", "account_type_permission_defaults", ["account_type"])

    if "logto_binding_requests" not in tables:
        op.create_table(
            "logto_binding_requests",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("logto_subject", sa.String(255), nullable=False),
            sa.Column("verified_email", sa.String(255), nullable=False),
            sa.Column("requested_account_type", sa.String(30)),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("reviewed_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
            sa.Column("review_note", sa.Text(), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("reviewed_at", sa.DateTime(timezone=True)),
            sa.UniqueConstraint("user_id", "logto_subject", name="uq_logto_binding_user_subject"),
        )
        op.create_index("ix_logto_binding_requests_user_id", "logto_binding_requests", ["user_id"])
        op.create_index("ix_logto_binding_requests_logto_subject", "logto_binding_requests", ["logto_subject"])
        op.create_index("ix_logto_binding_requests_verified_email", "logto_binding_requests", ["verified_email"])
        op.create_index("ix_logto_binding_requests_status", "logto_binding_requests", ["status"])


def downgrade() -> None:
    op.drop_table("logto_binding_requests")
    op.drop_table("account_type_permission_defaults")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("provisioning_status")
        batch.drop_column("account_type")
        batch.drop_column("logto_subject")
