#!/usr/bin/env python
"""Check datetime values in article tables."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dance_org.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check article_translations datetime fields
print("=== article_translations ===")
c.execute('SELECT id, created_at, updated_at, published_at FROM article_translations')
for row in c.fetchall():
    print(f"  id={row[0][:8]}..., created_at={repr(row[1])}, updated_at={repr(row[2])}, published_at={repr(row[3])}")

print("\n=== article_groups ===")
c.execute('SELECT id, created_at, updated_at FROM article_groups')
for row in c.fetchall():
    print(f"  id={row[0][:8]}..., created_at={repr(row[1])}, updated_at={repr(row[2])}")

print("\n=== news_articles ===")
c.execute('SELECT id, created_at, updated_at, published_at FROM news_articles')
for row in c.fetchall():
    print(f"  id={row[0]}, created_at={repr(row[1])}, updated_at={repr(row[2])}, published_at={repr(row[3])}")

conn.close()