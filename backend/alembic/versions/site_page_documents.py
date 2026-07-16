"""add editable about and contact page documents

Revision ID: site_page_documents
Revises: homepage_builder_v2
"""

from alembic import op
import sqlalchemy as sa
import uuid


revision = "site_page_documents"
down_revision = "homepage_builder_v2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "site_page_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True, index=True),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("draft_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("published_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("is_dirty", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    table = sa.table(
        "site_page_documents",
        sa.column("id", sa.String(36)),
        sa.column("slug", sa.String(80)),
        sa.column("schema_version", sa.Integer()),
        sa.column("draft_json", sa.Text()),
        sa.column("published_json", sa.Text()),
        sa.column("is_dirty", sa.Boolean()),
    )
    op.bulk_insert(table, [
        {"id": str(uuid.uuid4()), "slug": "about", "schema_version": 1, "draft_json": "{}", "published_json": "{}", "is_dirty": True},
        {"id": str(uuid.uuid4()), "slug": "contact", "schema_version": 1, "draft_json": "{}", "published_json": "{}", "is_dirty": True},
    ])
    bind = op.get_bind()
    for (user_id,) in bind.execute(sa.text("SELECT id FROM users WHERE role = 'admin'")).fetchall():
        for key in ("content.pages", "content.pages.about", "content.pages.contact"):
            exists = bind.execute(sa.text("SELECT 1 FROM user_permissions WHERE user_id = :user_id AND permission_key = :key"), {"user_id": user_id, "key": key}).first()
            if exists is None:
                bind.execute(sa.text("INSERT INTO user_permissions (id, user_id, permission_key, can_view, can_manage) VALUES (:id, :user_id, :key, 1, 1)"), {"id": str(uuid.uuid4()), "user_id": user_id, "key": key})


def downgrade() -> None:
    op.drop_table("site_page_documents")
