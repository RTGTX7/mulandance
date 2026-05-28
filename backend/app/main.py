import logging
import os
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.models import Base

logger = logging.getLogger(__name__)


def _ensure_data_directories():
    """Ensure all data directories exist and are not wiped by code changes."""
    base_dir = Path(settings.NEWS_FILES_DIR).parent / "data"
    dirs = {
        "news": base_dir / "news",
        "uploads": base_dir / "uploads",
        "backups": base_dir / "backups",
    }
    for name, path in dirs.items():
        path.mkdir(parents=True, exist_ok=True)
        # Create .gitkeep if it doesn't exist
        gitkeep = path / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()
        logger.info(f"Ensured directory exists: {path}")


def _ensure_database_tables():
    """Create any missing database tables on startup.
    
    This is idempotent and safe to call every time the app starts.
    It will only create tables that don't already exist.
    Existing data is NEVER touched or overwritten.
    """
    from sqlalchemy import inspect as sql_inspect

    inspector = sql_inspect(engine)
    existing_tables = set(inspector.get_table_names())
    metadata_tables = set(Base.metadata.tables.keys())
    missing_tables = metadata_tables - existing_tables

    if missing_tables:
        logger.warning(
            f"Creating {len(missing_tables)} missing table(s): {sorted(missing_tables)}"
        )
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    else:
        logger.info("All database tables already exist.")

    # Log all tables for debugging
    all_tables = sorted(existing_tables | missing_tables)
    logger.info(f"Database has {len(all_tables)} table(s): {all_tables}")


def _migrate_article_groups_if_needed():
    """Run article_groups migration if tables are missing data.
    
    This checks if article_groups tables exist but are empty (no migrated data),
    and runs the migration from news_articles if needed.
    """
    import uuid
    from sqlalchemy import text

    conn = engine.connect()
    try:
        # Check if article_groups table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='article_groups'"
        ))
        if result.fetchone() is None:
            # article_groups doesn't exist at all - migration needed
            logger.warning("article_groups table missing, running migration...")
            conn.close()
            _run_article_migration()
            return

        # Check if migration was already done
        group_count = conn.execute(text("SELECT COUNT(*) FROM article_groups")).scalar()
        if group_count > 0:
            logger.info(f"Article groups already migrated ({group_count} groups).")
            return

        # Tables exist but empty - check if we have articles to migrate
        article_count = conn.execute(text("SELECT COUNT(*) FROM news_articles")).scalar()
        if article_count > 0:
            logger.info(f"Found {article_count} articles to migrate to article_groups...")
            conn.close()
            _run_article_migration()
        else:
            logger.info("No articles to migrate.")
    except Exception as e:
        logger.error(f"Migration check error: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _run_article_migration():
    """Migrate articles from news_articles to article_groups + article_translations.
    
    This is a simplified inline version of migrate_article_groups.py
    that runs safely on startup.
    """
    import uuid
    from sqlalchemy import text
    from datetime import datetime, timezone

    conn = engine.connect()
    now = datetime.now(timezone.utc).isoformat()

    try:
        # Create article_groups table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_groups (
                id TEXT PRIMARY KEY,
                shared_slug TEXT NOT NULL UNIQUE,
                created_at DATETIME,
                updated_at DATETIME
            )
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_groups_shared_slug ON article_groups(shared_slug)"
        ))

        # Create article_group_categories table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_group_categories (
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                category_id TEXT NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, category_id)
            )
        """))

        # Create article_group_tags table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_group_tags (
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                tag_id TEXT NOT NULL REFERENCES news_tags(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, tag_id)
            )
        """))

        # Create article_translations table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_translations (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                locale TEXT NOT NULL DEFAULT 'en',
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT,
                body TEXT,
                author_id TEXT REFERENCES users(id),
                published_at DATETIME,
                cover_image TEXT,
                is_published INTEGER DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            )
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_translations_group_id ON article_translations(group_id)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_translations_slug ON article_translations(slug)"
        ))

        conn.commit()

        # Check if already migrated
        group_count = conn.execute(text("SELECT COUNT(*) FROM article_groups")).scalar()
        if group_count > 0:
            logger.info(f"Articles already migrated ({group_count} groups). Skipping.")
            return

        # Get article columns
        columns_result = conn.execute(text("PRAGMA table_info(news_articles)"))
        columns = [row[1] for row in columns_result.fetchall()]
        has_updated_at = "updated_at" in columns

        base_cols = "id, slug, title, summary, body, author_id, published_at, cover_image, is_published, locale, created_at"
        if has_updated_at:
            base_cols += ", updated_at"

        articles_result = conn.execute(text(f"SELECT {base_cols} FROM news_articles")).fetchall()
        
        if not articles_result:
            logger.info("No articles to migrate.")
            return

        article_list = [dict(zip(columns, row)) for row in articles_result]
        migrated = 0

        for article in article_list:
            group_id = str(uuid.uuid4())

            conn.execute(text("""
                INSERT INTO article_groups (id, shared_slug, created_at, updated_at)
                VALUES (:id, :slug, :created_at, :updated_at)
            """), {
                "id": group_id,
                "slug": article["slug"],
                "created_at": article["created_at"] or now,
                "updated_at": article.get("updated_at") or now,
            })

            conn.execute(text("""
                INSERT INTO article_translations (
                    id, group_id, locale, slug, title, summary, body,
                    author_id, published_at, cover_image, is_published, created_at, updated_at
                ) VALUES (
                    :id, :group_id, :locale, :slug, :title, :summary, :body,
                    :author_id, :published_at, :cover_image, :is_published, :created_at, :updated_at
                )
            """), {
                "id": article["id"],
                "group_id": group_id,
                "locale": article.get("locale") or "en",
                "slug": article["slug"],
                "title": article["title"],
                "summary": article.get("summary"),
                "body": article.get("body"),
                "author_id": article.get("author_id"),
                "published_at": article.get("published_at"),
                "cover_image": article.get("cover_image"),
                "is_published": 1 if article.get("is_published") else 0,
                "created_at": article["created_at"] or now,
                "updated_at": article.get("updated_at") or now,
            })

            migrated += 1

        # Migrate category links
        cat_links = conn.execute(text(
            "SELECT article_id, category_id FROM news_article_categories"
        )).fetchall()

        group_id_map = {a["id"]: str(uuid.uuid4()) for a in article_list}
        # Actually use the group IDs we just inserted
        group_rows = conn.execute(text(
            "SELECT id, shared_slug FROM article_groups"
        )).fetchall()
        group_id_map = {row["shared_slug"]: row["id"] for row in group_rows}

        # Re-fetch articles to rebuild mapping
        for article in article_list:
            group_rows2 = conn.execute(text(
                "SELECT id FROM article_groups WHERE shared_slug = :slug"
            ), {"slug": article["slug"]}).fetchone()
            group_id_map[article["id"]] = group_rows2["id"]

        cat_migrated = 0
        for link in cat_links:
            old_id = link["article_id"]
            if old_id in group_id_map:
                try:
                    conn.execute(text("""
                        INSERT OR IGNORE INTO article_group_categories (group_id, category_id)
                        VALUES (:group_id, :category_id)
                    """), {
                        "group_id": group_id_map[old_id],
                        "category_id": link["category_id"],
                    })
                    cat_migrated += 1
                except Exception:
                    pass

        # Migrate tag links
        tag_links = conn.execute(text(
            "SELECT article_id, tag_id FROM news_article_tags"
        )).fetchall()

        tag_migrated = 0
        for link in tag_links:
            old_id = link["article_id"]
            if old_id in group_id_map:
                try:
                    conn.execute(text("""
                        INSERT OR IGNORE INTO article_group_tags (group_id, tag_id)
                        VALUES (:group_id, :tag_id)
                    """), {
                        "group_id": group_id_map[old_id],
                        "tag_id": link["tag_id"],
                    })
                    tag_migrated += 1
                except Exception:
                    pass

        conn.commit()
        logger.info(
            f"Migration complete: {migrated} articles -> article_groups, "
            f"{cat_migrated} category links, {tag_migrated} tag links"
        )
    except Exception as e:
        logger.error(f"Article migration failed: {e}", exc_info=True)
        conn.rollback()
        raise


app = FastAPI(
    title="Grace Dance Academy API",
    description="REST API for the Grace Dance Academy website",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Startup event: ensure everything is initialized
@app.on_event("startup")
async def startup_event():
    """Initialize database and data directories on app startup."""
    logger.info("=" * 50)
    logger.info("Grace Dance Academy API - Starting up")
    logger.info("=" * 50)
    
    _ensure_data_directories()
    _ensure_database_tables()
    _migrate_article_groups_if_needed()
    
    logger.info("Startup complete.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Mount static files for uploaded images
UPLOADS_DIR = Path(settings.NEWS_FILES_DIR).parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dance-org-api"}
