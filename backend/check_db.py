import sqlite3

conn = sqlite3.connect('dance_org.db')
cursor = conn.cursor()

# Check tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"Tables: {tables}")

# Check articles
cursor.execute('SELECT id, slug, title, is_published FROM news_articles')
rows = cursor.fetchall()
print(f'\nFound {len(rows)} articles:')
for r in rows:
    print(f'  ID: {r[0]}, Slug: {r[1]}, Title: {r[2]}, Published: {r[3]}')

# Check markdown files
import os
news_dir = 'data/news'
if os.path.exists(news_dir):
    files = os.listdir(news_dir)
    print(f'\nMarkdown files in {news_dir}: {files}')
    for f in files:
        filepath = os.path.join(news_dir, f)
        size = os.path.getsize(filepath)
        print(f'  {f} ({size} bytes)')
        if size > 0:
            with open(filepath, 'r', encoding='utf-8') as fh:
                content = fh.read(200)
                print(f'    Content: {content[:100]}...')

conn.close()