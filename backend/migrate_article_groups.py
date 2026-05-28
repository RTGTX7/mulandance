"""Direct migration: add article_groups tables and migrate existing data.

This script creates the missing tables and migrates existing articles
from news_articles -> article_groups + article_translations.
Safe to run multiple times (idempotent).
"""
import os
import sys
import uuid
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

import sqlite3

DB_PATH = os.path.join(backend_dir, "dance_org.db")
BACKUPS_DIR = os.path.join(backend_dir, "data", "backups")


def get_connection():
    """Get a SQLite connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def table_exists(conn, table_name):
    """Check if a table exists."""
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    )
    return cursor.fetchone() is not None


def create_article_groups_table(conn):
    """Create the article_groups table if it doesn't exist."""
    if table_exists(conn, "article_groups"):
        print("  article_groups table already exists.")
        return False

    conn.execute("""
        CREATE TABLE article_groups (
            id TEXT PRIMARY KEY,
            shared_slug TEXT NOT NULL UNIQUE,
            created_at DATETIME,
            updated_at DATETIME
        )
    """)
    conn.execute("CREATE INDEX ix_article_groups_shared_slug ON article_groups(shared_slug)")
    print("  Created article_groups table.")
    return True


def create_article_group_categories_table(conn):
    """Create the article_group_categories junction table if it doesn't exist."""
    if table_exists(conn, "article_group_categories"):
        print("  article_group_categories table already exists.")
        return False

    conn.execute("""
        CREATE TABLE article_group_categories (
            group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
            category_id TEXT NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
            PRIMARY KEY (group_id, category_id)
        )
    """)
    print("  Created article_group_categories table.")
    return True


def create_article_group_tags_table(conn):
    """Create the article_group_tags junction table if it doesn't exist."""
    if table_exists(conn, "article_group_tags"):
        print("  article_group_tags table already exists.")
        return False

    conn.execute("""
        CREATE TABLE article_group_tags (
            group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES news_tags(id) ON DELETE CASCADE,
            PRIMARY KEY (group_id, tag_id)
        )
    """)
    print("  Created article_group_tags table.")
    return True


def create_article_translations_table(conn):
    """Create the article_translations table if it doesn't exist."""
    if table_exists(conn, "article_translations"):
        print("  article_translations table already exists.")
        return False

    conn.execute("""
        CREATE TABLE article_translations (
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
    """)
    conn.execute("CREATE INDEX ix_article_translations_group_id ON article_translations(group_id)")
    conn.execute("CREATE INDEX ix_article_translations_slug ON article_translations(slug)")
    print("  Created article_translations table.")
    return True


def migrate_existing_articles(conn):
    """Migrate data from news_articles to article_groups + article_translations."""
    # Check if we already migrated
    group_count = conn.execute("SELECT COUNT(*) FROM article_groups").fetchone()[0]
    if group_count > 0:
        print("  Articles already migrated (article_groups has data). Skipping.")
        return 0

    # Get actual columns to handle schema variations
    cursor = conn.execute("PRAGMA table_info(news_articles)")
    columns = [row[1] for row in cursor.fetchall()]
    has_updated_at = "updated_at" in columns

    # Get all existing articles (only columns that exist)
    base_cols = "id, slug, title, summary, body, author_id, published_at, cover_image, is_published, locale, created_at"
    if has_updated_at:
        base_cols += ", updated_at"
    
    articles = conn.execute(f"""
        SELECT {base_cols}
        FROM news_articles
    """).fetchall()

    if not articles:
        print("  No existing articles to migrate.")
        return 0

    now = datetime.utcnow().isoformat()
    migrated = 0

    # Map old article IDs to new group IDs
    group_id_map = {}

    for article in articles:
        group_id = str(uuid.uuid4())
        group_id_map[article["id"]] = group_id

        conn.execute(
            """
            INSERT INTO article_groups (id, shared_slug, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                group_id,
                article["slug"],
                article["created_at"] or now,
                article.get("updated_at") or now if has_updated_at else now,
            ),
        )

        conn.execute(
            """
            INSERT INTO article_translations (
                id, group_id, locale, slug, title, summary, body,
                author_id, published_at, cover_image, is_published, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                article["id"],  # reuse same ID for reference preservation
                group_id,
                article["locale"] or "en",
                article["slug"],
                article["title"],
                article["summary"],
                article["body"],
                article["author_id"],
                article["published_at"],
                article["cover_image"],
                1 if article["is_published"] else 0,
                article["created_at"] or now,
                article.get("updated_at") or now if has_updated_at else now,
            ),
        )
        migrated += 1

    # Migrate category links
    cat_links = conn.execute(
        "SELECT article_id, category_id FROM news_article_categories"
    ).fetchall()

    cat_migrated = 0
    for link in cat_links:
        old_id = link["article_id"]
        if old_id in group_id_map:
            try:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO article_group_categories (group_id, category_id)
                    VALUES (?, ?)
                    """,
                    (group_id_map[old_id], link["category_id"]),
                )
                cat_migrated += 1
            except sqlite3.IntegrityError:
                pass  # already exists

    # Migrate tag links
    tag_links = conn.execute(
        "SELECT article_id, tag_id FROM news_article_tags"
    ).fetchall()

    tag_migrated = 0
    for link in tag_links:
        old_id = link["article_id"]
        if old_id in group_id_map:
            try:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO article_group_tags (group_id, tag_id)
                    VALUES (?, ?)
                    """,
                    (group_id_map[old_id], link["tag_id"]),
                )
                tag_migrated += 1
            except sqlite3.IntegrityError:
                pass  # already exists

    conn.commit()
    return {
        "groups": migrated,
        "translations": migrated,
        "category_links": cat_migrated,
        "tag_links": tag_migrated,
    }


def main():
    print("=" * 60)
    print("Article Groups Migration Script")
    print("=" * 60)
    print(f"Database: {DB_PATH}")
    print()

    # Backup first
    print("1. Creating backup...")
    os.makedirs(BACKUPS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = os.path.join(
        BACKUPS_DIR, f"db-before-article-groups-{timestamp}.sqlite3"
    )
    import shutil

    shutil.copy2(DB_PATH, backup_path)
    print(f"  Backup created: {backup_path}")
    print()

    conn = get_connection()

    try:
        # Step 2: Create tables
        print("2. Creating missing tables...")
        create_article_groups_table(conn)
        create_article_group_categories_table(conn)
        create_article_group_tags_table(conn)
        create_article_translations_table(conn)
        conn.commit()
        print()

        # Step 3: Migrate data
        print("3. Migrating existing articles...")
        result = migrate_existing_articles(conn)
        if result:
            print(f"  Groups created: {result['groups']}")
            print(f"  Translations created: {result['translations']}")
            print(f"  Category links migrated: {result['category_links']}")
            print(f"  Tag links migrated: {result['tag_links']}")
        print()

        # Step 4: Verify
        print("4. Verifying...")
        new_tables = [
            "article_groups",
            "article_group_categories",
            "article_group_tags",
            "article_translations",
        ]
        for table in new_tables:
            exists = table_exists(conn, table)
            status = "OK" if exists else "MISSING"
            print(f"  {table}: {status}")

        group_count = conn.execute("SELECT COUNT(*) FROM article_groups").fetchone()[0]
        trans_count = conn.execute("SELECT COUNT(*) FROM article_translations").fetchone()[0]
        print(f"  article_groups rows: {group_count}")
        print(f"  article_translations rows: {trans_count}")
        print()

        print("Migration completed successfully!")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()