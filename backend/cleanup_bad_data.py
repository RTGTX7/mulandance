"""Clean up bad article_groups data from failed initial runs."""
import sqlite3
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
conn = sqlite3.connect('dance_org.db')
c = conn.cursor()

print("Cleaning up bad article_groups data...")
print()

# Find and delete groups with slug "1" or "123" (from failed runs)
c.execute("SELECT id, shared_slug FROM article_groups WHERE shared_slug IN ('1', '123')")
bad_groups = c.fetchall()

if bad_groups:
    print(f"Found {len(bad_groups)} bad group(s):")
    for g in bad_groups:
        print(f"  id: {g[0]} | slug: {g[1]}")
    
    # Delete translations for bad groups
    for g in bad_groups:
        c.execute("DELETE FROM article_translations WHERE group_id = ?", (g[0],))
        c.execute("DELETE FROM article_group_categories WHERE group_id = ?", (g[0],))
        c.execute("DELETE FROM article_group_tags WHERE group_id = ?", (g[0],))
        c.execute("DELETE FROM article_groups WHERE id = ?", (g[0],))
    
    conn.commit()
    print(f"\nDeleted {len(bad_groups)} bad group(s) and related data.")
else:
    print("No bad groups found.")

# Verify final state
print()
c.execute("SELECT COUNT(*) FROM article_groups")
print(f"article_groups: {c.fetchone()[0]}")

c.execute("""
    SELECT ag.id, ag.shared_slug, at.slug, at.title, LENGTH(at.body)
    FROM article_groups ag 
    JOIN article_translations at ON at.group_id = ag.id
""")
print(f"\nRemaining article_groups data ({c.fetchall().__len__() if False else 'checking'}):")
rows = c.fetchall()
for r in rows:
    print(f"  group: {r[0][:8]}... | shared: {r[1]} | trans: {r[2]} | title: {r[3][:30]} | body: {r[4]}")

# Recount categories/tags
c.execute("SELECT COUNT(*) FROM article_group_categories")
print(f"\narticle_group_categories: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM article_group_tags")
print(f"article_group_tags: {c.fetchone()[0]}")

conn.close()
print("\nCleanup complete.")