import sqlite3

conn = sqlite3.connect('dance_org.db')
c = conn.cursor()

print('=== USERS ===')
c.execute('SELECT id, email, role FROM users')
rows = c.fetchall()
print(f'Users ({len(rows)}):')
for r in rows:
    print(f'  id={r[0][:8]} email={r[1]} role={r[2]}')

print()
print('=== ARTICLE_TRANSLATIONS ===')
c.execute('SELECT substr(id,1,8), substr(group_id,1,8), slug, substr(title,1,30), locale, is_published FROM article_translations')
for r in c.fetchall():
    print(f'  id={r[0]} grp={r[1]} slug={r[2]} title={r[3]} loc={r[4]} pub={r[5]}')

conn.close()