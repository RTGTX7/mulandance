"""Check migration status of the database."""
import sqlite3
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
conn = sqlite3.connect('dance_org.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

print(f"Database: {os.path.abspath('dance_org.db')}")
print("=" * 60)

# Check news_articles count
c.execute('SELECT COUNT(*) FROM news_articles')
print(f"news_articles: {c.fetchone()[0]}")

# Check news_articles data
c.execute('SELECT id, slug, title, LENGTH(body) as body_len FROM news_articles')
rows = c.fetchall()
print(f"\nnews_articles data ({len(rows)}):")
for r in rows:
    print(f"  ID: {r['id'][:8]}... | Slug: {r['slug']} | Title: {r['title'][:30]} | Body: {r['body_len']}")

# Check article_groups count
c.execute('SELECT COUNT(*) FROM article_groups')
print(f"\narticle_groups: {c.fetchone()[0]}")

# Check article_groups data
c.execute("""
    SELECT ag.id, ag.shared_slug, at.slug, at.title, LENGTH(at.body) as body_len
    FROM article_groups ag 
    JOIN article_translations at ON at.group_id = ag.id
""")
rows = c.fetchall()
print(f"\narticle_groups data ({len(rows)}):")
for r in rows:
    print(f"  group: {r['id'][:8]}... | shared: {r['shared_slug']} | trans: {r['slug']} | title: {r['title'][:30]} | body: {r['body_len']}")

# Check categories
c.execute("""
    SELECT agc.group_id, nc.slug as cat_slug, nc.name
    FROM article_group_categories agc 
    JOIN news_categories nc ON nc.id = agc.category_id
""")
rows = c.fetchall()
print(f"\narticle_group_categories ({len(rows)}):")
for r in rows:
    print(f"  group: {r['group_id'][:8]}... | category: {r['cat_slug']} ({r['name']})")

# Check tags
c.execute("""
    SELECT agt.group_id, nt.slug as tag_slug, nt.name
    FROM article_group_tags agt 
    JOIN news_tags nt ON nt.id = agt.tag_id
""")
rows = c.fetchall()
print(f"\narticle_group_tags ({len(rows)}):")
for r in rows:
    print(f"  group: {r['group_id'][:8]}... | tag: {r['tag_slug']} ({r['name']})")

# Check old links
c.execute('SELECT COUNT(*) FROM news_article_categories')
print(f"\nnews_article_categories (old): {c.fetchone()[0]}")
c.execute('SELECT COUNT(*) FROM news_article_tags')
print(f"news_article_tags (old): {c.fetchone()[0]}")

conn.close()
print("\n" + "=" * 60)
print("Check complete.")