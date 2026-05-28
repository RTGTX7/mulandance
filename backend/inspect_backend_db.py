#!/usr/bin/env python
"""Inspect the backend database that the running server uses."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dance_org.db')
print(f"Connecting to: {os.path.abspath(db_path)}")
print(f"DB exists: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check all table counts
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print(f"\nTables in backend DB ({len(tables)}):")
for t in tables:
    c.execute(f'SELECT COUNT(*) FROM [{t}]')
    count = c.fetchone()[0]
    print(f"  {t}: {count}")

# Check categories
print("\nCategories:")
c.execute('SELECT id, slug, name, color FROM news_categories')
cats = c.fetchall()
print(f"  {len(cats)} categories:")
for cat in cats:
    print(f"    id={cat[0]}, slug={cat[1]}, name={cat[2]}, color={cat[3]}")

# Check tags
print("\nTags:")
c.execute('SELECT id, slug, name FROM news_tags')
tags = c.fetchall()
print(f"  {len(tags)} tags:")
for tag in tags:
    print(f"    id={tag[0]}, slug={tag[1]}, name={tag[2]}")

# Check users
print("\nUsers:")
c.execute('SELECT id, email, role, username FROM users')
users = c.fetchall()
print(f"  {len(users)} users:")
for u in users:
    print(f"    id={u[0]}, email={u[1]}, role={u[2]}, username={u[3]}")

# Check article_groups and translations
print("\nArticle groups:")
c.execute('SELECT id, shared_slug, created_at FROM article_groups')
groups = c.fetchall()
print(f"  {len(groups)} groups:")
for g in groups:
    print(f"    id={g[0][:8]}..., slug={g[1]}, created={g[2]}")

c.execute('SELECT id, group_id, locale, slug, title, is_published FROM article_translations')
trans = c.fetchall()
print(f"  {len(trans)} translations:")
for t in trans:
    print(f"    id={t[0][:8]}..., group={t[1][:8]}..., locale={t[2]}, slug={t[3]}, published={t[5]}")

# Check news_articles
print("\nNews articles:")
c.execute('SELECT id, slug, title FROM news_articles')
articles = c.fetchall()
print(f"  {len(articles)} articles:")
for a in articles:
    print(f"    id={a[0]}, slug={a[1]}, title={a[2]}")

conn.close()
print("\nDone.")