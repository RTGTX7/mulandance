import sqlite3
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
conn = sqlite3.connect('dance_org.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

print('=== ARTICLE_GROUPS ===')
c.execute('SELECT id, shared_slug, created_at FROM article_groups')
for r in c.fetchall():
    print(f'  id={r["id"][:8]}... slug={r["shared_slug"]} created={r["created_at"]}')

print()
print('=== ARTICLE_TRANSLATIONS ===')
c.execute('SELECT id, group_id, slug, title, locale, is_published, published_at, created_at FROM article_translations')
for r in c.fetchall():
    print(f'  id={r[0][:8]} grp={r[1][:8]} slug={r[2]} title={str(r[3])[:40]} loc={r[4]} pub={r[5]} created={r[7]}')

print()
print('=== NEWS_ARTICLES ===')
c.execute('SELECT id, slug, title, is_published, locale, created_at FROM news_articles')
for r in c.fetchall():
    print(f'  id={r[0][:8]} slug={r[1]} title={str(r[2])[:40]} pub={r[3]} loc={r[4]}')

print()
print('=== article_group_categories ===')
c.execute('SELECT group_id, category_id FROM article_group_categories')
for r in c.fetchall():
    print(f'  group={r[0][:8]} cat={r[1][:8]}')

print()
print('=== article_group_tags ===')
c.execute('SELECT group_id, tag_id FROM article_group_tags')
for r in c.fetchall():
    print(f'  group={r[0][:8]} tag={r[1][:8]}')

conn.close()