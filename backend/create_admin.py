"""Create or reset the local development super admin account."""

from app.core.database import SessionLocal
from app.core.security import get_password_hash, verify_password
from app.models import User, UserProfile


ADMIN_EMAIL = "admin@mulandance.com"
ADMIN_PASSWORD = "admin123"


def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not user:
            user = User(email=ADMIN_EMAIL)
            db.add(user)
            db.flush()

        user.password_hash = get_password_hash(ADMIN_PASSWORD)
        user.role = "super_admin"
        user.is_active = True

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            profile = UserProfile(user_id=user.id, first_name="Admin", last_name="User")
            db.add(profile)

        db.commit()
        db.refresh(user)

        print(f"Super admin ready: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"Password verification: {verify_password(ADMIN_PASSWORD, user.password_hash)}")
        print(f"User ID: {user.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
