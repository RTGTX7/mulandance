import sqlite3
import os

print("=" * 60)
print("DATABASE PATH CHECK")
print("=" * 60)

# Check which DB the config says
from app.core.config import settings
db_url = settings.DATABASE_URL
print(f"\nConfig DATABASE_URL: {db_url}")

# Resolve the path
if db_url.startswith('sqlite:///./'):
    rel_path = db_url.replace('sqlite:///./', '')
    abs_path = os.path.join(os.getcwd(), rel_path)
    print(f"Relative path: {rel_path}")
    print(f"Resolved absolute: {abs_path}")
    print(f"Current working dir: {os.getcwd()}")

# Check actual DB file
db_file = abs_path if os.path.isabs(abs_path) else os.path.join(os.getcwd(), rel_path)
print(f"\nDB file: {db_file}")
print(f"Exists: {os.path.exists(db_file)}")
if os.path.exists(db_file):
    print(f"Size: {os.path.getsize(db_file)} bytes")
    print(f"Modified: {os.path.getmtime(db_file)}")

# Check article counts
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute('SELECT COUNT(*) FROM article_translations')
trans_count = c.fetchone()[0]
c.execute('SELECT COUNT(*) FROM article_groups')
group_count = c.fetchone()[0]
c.execute('SELECT COUNT(*) FROM news_articles')
news_count = c.fetchone()[0]
conn.close()

print(f"\nArticle counts in this DB:")
print(f"  article_translations: {trans_count}")
print(f"  article_groups: {group_count}")
print(f"  news_articles: {news_count}")

print("\n" + "=" * 60)
if trans_count == 8:
    print("CORRECT DB - Has 8 articles")
elif trans_count == 1:
    print("WRONG DB - Has only 1 article")
else:
    print(f"UNEXPECTED - Has {trans_count} articles")