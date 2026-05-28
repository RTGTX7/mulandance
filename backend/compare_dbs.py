import sqlite3
import os

print("=" * 60)
print("DATABASE COMPARISON")
print("=" * 60)

# DB1: backend dance_org.db
db1 = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dance_org.db')
print(f"\nDB1: {db1}")
print(f"  Exists: {os.path.exists(db1)}")
print(f"  Size: {os.path.getsize(db1) if os.path.exists(db1) else 'N/A'} bytes")

conn1 = sqlite3.connect(db1)
c1 = conn1.cursor()
c1.execute('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name')
tables1 = [r[0] for r in c1.fetchall()]
print(f"  Tables ({len(tables1)}): {tables1}")

for t in ['article_groups', 'article_translations', 'news_articles']:
    if t in tables1:
        c1.execute(f'SELECT COUNT(*) FROM [{t}]')
        print(f"    {t}: {c1.fetchone()[0]} rows")

if 'article_translations' in tables1:
    c1.execute('SELECT id, group_id, slug, title, locale, is_published FROM article_translations')
    print("  Translations:")
    for r in c1.fetchall():
        print(f"    id={r[0][:8]} grp={r[1][:8]} slug={r[2]} title={str(r[3])[:40]} loc={r[4]} pub={r[5]}")

conn1.close()

# DB2: workspace root dance_org.db
db2 = r'c:\Workspace\dance_org.db'
print(f"\nDB2: {db2}")
print(f"  Exists: {os.path.exists(db2)}")
print(f"  Size: {os.path.getsize(db2) if os.path.exists(db2) else 'N/A'} bytes")

if os.path.exists(db2):
    conn2 = sqlite3.connect(db2)
    c2 = conn2.cursor()
    c2.execute('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name')
    tables2 = [r[0] for r in c2.fetchall()]
    print(f"  Tables ({len(tables2)}): {tables2}")
    
    for t in ['article_groups', 'article_translations', 'news_articles']:
        if t in tables2:
            c2.execute(f'SELECT COUNT(*) FROM [{t}]')
            print(f"    {t}: {c2.fetchone()[0]} rows")
    
    if 'article_translations' in tables2:
        c2.execute('SELECT id, group_id, slug, title, locale, is_published FROM article_translations')
        print("  Translations:")
        for r in c2.fetchall():
            print(f"    id={r[0][:8]} grp={r[1][:8]} slug={r[2]} title={str(r[3])[:40]} loc={r[4]} pub={r[5]}")
    
    if 'article_groups' in tables2:
        c2.execute('SELECT id, shared_slug FROM article_groups')
        print("  Groups:")
        for r in c2.fetchall():
            print(f"    id={r[0][:8]} slug={r[1]}")
    
    conn2.close()

print("\n" + "=" * 60)
print("CONCLUSION:")
print("=" * 60)
if os.path.exists(db2):
    # Count translations in each
    c1b = sqlite3.connect(db1).cursor()
    c1b.execute('SELECT COUNT(*) FROM article_translations')
    cnt1 = c1b.fetchone()[0]
    c1b.close()
    c2b = sqlite3.connect(db2).cursor()
    c2b.execute('SELECT COUNT(*) FROM article_translations')
    cnt2 = c2b.fetchone()[0]
    c2b.close()
    if cnt1 > cnt2:
        print(f"DB1 has MORE data ({cnt1} translations) than DB2 ({cnt2} translations)")
        print("If server was started from wrong directory, it may be using DB2 (fewer articles)")
    elif cnt2 > cnt1:
        print(f"DB2 has MORE data ({cnt2} translations) than DB1 ({cnt1} translations)")
        print("If server was started from workspace root, it may be using DB2")
    else:
        print(f"Both DBs have {cnt1} translations - same data")
else:
    print("DB2 does not exist")