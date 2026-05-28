"""Ensure the local backend SQLite database has development data."""
from __future__ import annotations

import shutil
import sqlite3
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
ROOT_DB = PROJECT_DIR / "dance_org.db"
BACKEND_DB = BACKEND_DIR / "dance_org.db"


def user_count(db_path: Path) -> int:
    if not db_path.exists():
        return 0

    try:
        with sqlite3.connect(db_path) as conn:
            row = conn.execute("SELECT COUNT(*) FROM users").fetchone()
            return int(row[0]) if row else 0
    except sqlite3.Error:
        return 0


def main() -> int:
    root_users = user_count(ROOT_DB)
    backend_users = user_count(BACKEND_DB)

    print(f"Root database:    {ROOT_DB}")
    print(f"Backend database: {BACKEND_DB}")
    print(f"Root users:       {root_users}")
    print(f"Backend users:    {backend_users}")

    if backend_users > 0:
        print("Backend database already has users. No sync needed.")
        return 0

    if root_users > 0:
        BACKEND_DB.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT_DB, BACKEND_DB)
        print("Copied root dance_org.db to backend/dance_org.db.")
        print("Default admin: admin@mulandance.com / admin123")
        return 0

    print("No usable development database found.")
    print("Run backend\\create_admin.py after dependencies are installed.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
