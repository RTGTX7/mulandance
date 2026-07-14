"""Bind or create the initial super administrator for Logto authentication."""

import os

from app.core.database import SessionLocal
from app.models import User, UserProfile


def main():
    email = os.environ.get("LOGTO_BOOTSTRAP_SUPER_ADMIN_EMAIL", "").strip().lower()
    subject = os.environ.get("LOGTO_BOOTSTRAP_SUPER_ADMIN_SUB", "").strip()
    if not email or not subject:
        raise SystemExit("Set LOGTO_BOOTSTRAP_SUPER_ADMIN_EMAIL and LOGTO_BOOTSTRAP_SUPER_ADMIN_SUB")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, password_hash="logto-managed")
            db.add(user)
            db.flush()
        user.logto_subject = subject
        user.role = "super_admin"
        user.is_active = True
        user.provisioning_status = "active"
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            db.add(UserProfile(user_id=user.id, first_name="Admin", last_name="User"))
        db.commit()
        print(f"Logto super admin ready: {email} ({user.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
