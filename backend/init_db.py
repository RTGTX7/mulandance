"""Initialize database - create all tables"""
from app.core.database import engine
from app.models import Base

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    print(f"Database URL: {engine.url}")

if __name__ == "__main__":
    init_db()