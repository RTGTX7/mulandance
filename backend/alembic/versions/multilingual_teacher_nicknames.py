"""add multilingual teacher nicknames

Revision ID: multilingual_teacher_nicknames
Revises: course_unassigned_room
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa


revision = "multilingual_teacher_nicknames"
down_revision = "course_unassigned_room"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("user_profiles")
    }
    for name in ("nickname_zh", "nickname_en", "nickname_fr"):
        if name not in columns:
            op.add_column("user_profiles", sa.Column(name, sa.String(100)))
    op.execute(
        "UPDATE user_profiles SET nickname_zh = first_name "
        "WHERE nickname_zh IS NULL OR trim(nickname_zh) = ''"
    )


def downgrade() -> None:
    columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("user_profiles")
    }
    with op.batch_alter_table("user_profiles") as batch_op:
        for name in ("nickname_fr", "nickname_en", "nickname_zh"):
            if name in columns:
                batch_op.drop_column(name)
