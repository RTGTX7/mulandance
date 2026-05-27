#!/usr/bin/env python
"""Check database state and test article creation."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.config import settings
from datetime import datetime

print("=" * 60)
print("DATABASE DIAGNOSTIC")
print("=" * 60)

print(f"\nDATABASE_URL: {settings.DATABASE_URL}")
print(f"NEWS_FILES_DIR: {settings.NEWS_FILES_DIR}")
print(f"USE_FILE_STORAGE: {settings.USE_FILE_STORAGE}")

# Check which actual DB file
db_path = settings.DATABASE_URL.replace("sqlite:///./", "")
print(f"\nActual DB file: {os.path.abspath(db_path)}")
print(f"DB exists: {os.path.exists(db_path)}")

# Check tables
try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nTables ({len(tables)}): {sorted(tables)}")
except Exception as e:
    print(f"\nError listing tables: {e}")
    sys.exit(1)

# Check each table count
table_checks = [
    "news_articles", "news_categories", "news_tags",
    "article_groups", "article_translations",
    "article_group_categories", "article_group_tags",
    "news_article_categories", "news_article_tags",
    "users"
]

for table in table_checks:
    if table in tables:
        try:
            with engine.connect() as conn:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"  {table}: {count}")
        except Exception as e:
            print(f"  {table}: ERROR - {e}")
    else:
        print(f"  {table}: MISSING")

# Check news_articles sample data
if "news_articles" in tables:
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, slug, title, body IS NOT NULL as has_body FROM news_articles LIMIT 3"))
            rows = result.fetchall()
            print(f"\nnews_articles sample ({len(rows)} rows):")
            for row in rows:
                d = dict(row)
                print(f"  id={d['id']}, slug={d['slug']}, title={d['title']}, has_body={d['has_body']}")
    except Exception as e:
        print(f"\nError reading news_articles: {e}")

# Check article_groups
if "article_groups" in tables:
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, shared_slug FROM article_groups"))
            rows = result.fetchall()
            print(f"\narticle_groups ({len(rows)} rows):")
            for row in rows:
                d = dict(row)
                print(f"  id={d['id'][:8]}..., shared_slug={d['shared_slug']}")
    except Exception as e:
        print(f"\nError reading article_groups: {e}")

# Check article_translations
if "article_translations" in tables:
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, group_id, locale, slug, title FROM article_translations"))
            rows = result.fetchall()
            print(f"\narticle_translations ({len(rows)} rows):")
            for row in rows:
                d = dict(row)
                print(f"  id={d['id'][:8]}..., group={d['group_id'][:8]}..., locale={d['locale']}, slug={d['slug']}, title={d['title']}")
    except Exception as e:
        print(f"\nError reading article_translations: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)