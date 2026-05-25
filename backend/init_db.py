"""Initialize database - create all tables, seed admin users and categories."""
import argparse
import sys
import uuid
from datetime import datetime

from app.core.database import engine
from app.models import Base, User, NewsCategory, NewsTag
from app.core.security import get_password_hash


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    print(f"Database URL: {engine.url}")


def create_admin(email: str, password: str, first_name: str, last_name: str, role: str = "admin"):
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal

    with SessionLocal() as session:
        # Check if admin already exists
        admin = session.query(User).filter(User.role == "admin").first()
        if admin:
            print(f"Admin user already exists: {admin.email}")
            return admin

        hashed = get_password_hash(password)
        admin_user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hashed,
            role=role,
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        print(f"Admin user created: {email} (id: {admin_user.id})")
        return admin_user


def seed_categories():
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal

    with SessionLocal() as session:
        existing = session.query(NewsCategory).first()
        if existing:
            print("Categories already seeded.")
            return

        categories_data = [
            {
                "id": str(uuid.uuid4()),
                "slug": "announcements",
                "name": "Announcements",
                "name_zh": "公告",
                "description": "Official studio announcements",
                "color": "#6366f1",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "performances",
                "name": "Performances",
                "name_zh": "演出",
                "description": "Performances and showcases",
                "color": "#ec4899",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "classes",
                "name": "Classes",
                "name_zh": "课程",
                "description": "Class updates and schedules",
                "color": "#10b981",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "studio",
                "name": "Studio",
                "name_zh": "工作室",
                "description": "Studio news and updates",
                "color": "#f59e0b",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "general",
                "name": "General",
                "name_zh": "综合",
                "description": "General news and updates",
                "color": "#8b5cf6",
            },
        ]

        for cat_data in categories_data:
            cat = NewsCategory(**cat_data)
            session.add(cat)

        session.commit()
        print(f"Seeded {len(categories_data)} categories.")


def seed_tags():
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal
    import uuid

    with SessionLocal() as session:
        existing = session.query(NewsTag).first()
        if existing:
            print("Tags already seeded.")
            return

        tags_data = [
            {
                "id": str(uuid.uuid4()),
                "slug": "summer-camp",
                "name": "Summer Camp",
                "name_zh": "暑期夏令营",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "registration",
                "name": "Registration",
                "name_zh": "报名",
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "competition",
                "name": "Competition",
                "name_zh": "比赛",
            },
        ]

        for tag_data in tags_data:
            tag = NewsTag(**tag_data)
            session.add(tag)

        session.commit()
        print(f"Seeded {len(tags_data)} tags.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Database initialization script")
    parser.add_argument("--create-admin", action="store_true", help="Create first admin user")
    parser.add_argument("--email", type=str, help="Admin email address")
    parser.add_argument("--password", type=str, help="Admin password")
    parser.add_argument("--first-name", type=str, default="Admin", help="Admin first name")
    parser.add_argument("--last-name", type=str, default="User", help="Admin last name")
    parser.add_argument("--seed-categories", action="store_true", help="Seed default categories")
    parser.add_argument("--seed-tags", action="store_true", help="Seed default tags")
    parser.add_argument("--admin-role", type=str, default="admin", help="Admin role (admin/editor/faculty)")

    args = parser.parse_args()

    init_db()
    print()

    if args.create_admin:
        if not args.email or not args.password:
            print("Error: --email and --password are required with --create-admin")
            sys.exit(1)
        create_admin(args.email, args.password, args.first_name, args.last_name, args.admin_role)
        print()

    if args.seed_categories:
        seed_categories()
        print()

    if args.seed_tags:
        seed_tags()
        print()
