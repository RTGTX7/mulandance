import json
import hashlib
import shutil
import sqlite3
import tempfile
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

from alembic.config import Config
from alembic.script import ScriptDirectory

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import decode_token, oauth2_scheme
from app.core.permissions import require_user_permission
from app.models import User
from app.schemas.backup import BackupInfo, BackupListResponse, BackupRestoreResponse

router = APIRouter()

BACKUP_VERSION = 2
BACKUP_PREFIX = "mulandance-content"

EDITABLE_CONTENT_SCOPES = [
    "website_settings_and_ai_configuration",
    "homepage_content",
    "articles_categories_tags_and_markdown_bodies",
    "performances",
    "programs_and_program_modules",
    "class_schedules",
    "faculty_members",
    "classroom_rentals_requests_and_internal_bookings",
    "pricing_program_and_classroom_rental_content",
    "school_policy_and_static_page_content",
    "registration_links_and_registration_settings",
    "uploaded_images_videos_and_files",
    "users_profiles_roles_and_admin_accounts",
]


def require_super_admin(token: str = Depends(oauth2_scheme)) -> str:
    payload = decode_token(token)
    if payload is None or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        require_user_permission(user, db, "system.backup", "manage")
        return str(user.id)
    finally:
        db.close()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _backup_dir() -> Path:
    path = Path(settings.DATA_DIR) / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sqlite_path() -> Path:
    url = settings.DATABASE_URL
    prefix = "sqlite:///"
    if not url.startswith(prefix):
        raise HTTPException(status_code=400, detail="Content backup currently supports SQLite databases only.")
    raw_path = url[len(prefix):]
    if raw_path.startswith("/") and len(raw_path) > 2 and raw_path[2] == ":":
        raw_path = raw_path[1:]
    return Path(raw_path)


def _safe_zip_member(name: str) -> bool:
    path = PurePosixPath(name)
    return not path.is_absolute() and ".." not in path.parts and "\\" not in name


def _snapshot_database(target: Path) -> None:
    db_path = _sqlite_path()
    if not db_path.exists():
        raise HTTPException(status_code=500, detail=f"Database file not found: {db_path}")

    source = sqlite3.connect(str(db_path))
    destination = sqlite3.connect(str(target))
    try:
        source.backup(destination)
    finally:
        destination.close()
        source.close()


def _application_schema_head() -> str:
    try:
        backend_dir = Path(__file__).resolve().parents[3]
        config = Config(str(backend_dir / "alembic.ini"))
        config.set_main_option("script_location", str(backend_dir / "alembic"))
        return ScriptDirectory.from_config(config).get_current_head() or ""
    except Exception:
        return ""


def _database_schema_metadata() -> dict[str, str]:
    db_path = _sqlite_path()
    if not db_path.exists():
        return {"revision": "", "fingerprint": ""}
    connection = sqlite3.connect(str(db_path))
    try:
        tables = [
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' "
                "AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ).fetchall()
        ]
        structure = {
            table: [
                {
                    "name": row[1],
                    "type": row[2],
                    "not_null": bool(row[3]),
                    "default": row[4],
                    "primary_key": bool(row[5]),
                }
                for row in connection.execute(f'PRAGMA table_info("{table}")').fetchall()
            ]
            for table in tables
        }
        revision = ""
        if "alembic_version" in tables:
            row = connection.execute("SELECT version_num FROM alembic_version LIMIT 1").fetchone()
            revision = str(row[0]) if row else ""
        encoded = json.dumps(structure, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return {
            "revision": revision,
            "fingerprint": hashlib.sha256(encoded).hexdigest(),
        }
    finally:
        connection.close()


def _write_archive_file(archive: zipfile.ZipFile, source: Path, archive_name: str) -> dict[str, int | str]:
    digest = hashlib.sha256()
    size = 0
    with source.open("rb") as input_file, archive.open(archive_name, "w") as output_file:
        while chunk := input_file.read(1024 * 1024):
            digest.update(chunk)
            size += len(chunk)
            output_file.write(chunk)
    return {"sha256": digest.hexdigest(), "size": size}


def _write_archive_bytes(archive: zipfile.ZipFile, archive_name: str, content: bytes) -> dict[str, int | str]:
    archive.writestr(archive_name, content)
    return {"sha256": hashlib.sha256(content).hexdigest(), "size": len(content)}


def _database_table_counts() -> dict[str, int]:
    db_path = _sqlite_path()
    if not db_path.exists():
        return {}

    connection = sqlite3.connect(str(db_path))
    try:
        cursor = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]
        counts: dict[str, int] = {}
        for table in tables:
            try:
                count_cursor = connection.execute(f'SELECT COUNT(*) FROM "{table}"')
                counts[table] = int(count_cursor.fetchone()[0])
            except sqlite3.Error:
                counts[table] = -1
        return counts
    finally:
        connection.close()


def _iter_data_files() -> list[Path]:
    data_dir = Path(settings.DATA_DIR)
    if not data_dir.exists():
        return []
    result = []
    backup_dir = _backup_dir().resolve()
    for path in data_dir.rglob("*"):
        if not path.is_file():
            continue
        try:
            path.resolve().relative_to(backup_dir)
            continue
        except ValueError:
            pass
        result.append(path)
    return result


def create_backup_file(kind: str = "manual") -> Path:
    created_at = _utc_now()
    filename = f"{BACKUP_PREFIX}-{kind}-{created_at.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}.zip"
    target = _backup_dir() / filename
    data_dir = Path(settings.DATA_DIR)
    files = _iter_data_files()
    total_bytes = sum(path.stat().st_size for path in files)
    table_counts = _database_table_counts()
    schema = _database_schema_metadata()
    backup_id = str(uuid.uuid4())

    with tempfile.TemporaryDirectory() as tmp:
        temp_db = Path(tmp) / "database.sqlite"
        _snapshot_database(temp_db)
        manifest = {
            "format": "mulandance-content-backup",
            "version": BACKUP_VERSION,
            "backup_id": backup_id,
            "kind": kind,
            "created_at": created_at.isoformat(),
            "application": {
                "name": settings.PROJECT_NAME,
                "version": settings.APP_VERSION,
            },
            "database": {
                "engine": "sqlite",
                "sqlite_version": sqlite3.sqlite_version,
                "schema_revision": schema["revision"],
                "application_schema_head": _application_schema_head(),
                "schema_fingerprint": schema["fingerprint"],
            },
            "compatibility": {
                "minimum_reader_version": 1,
                "maximum_reader_version": BACKUP_VERSION,
                "schema_tracking": "alembic" if schema["revision"] else "fingerprint",
                "forward_migration_required": bool(
                    schema["revision"] and schema["revision"] != _application_schema_head()
                ),
            },
            "includes": {
                "database": "database.sqlite",
                "data": "data/",
                "editable_content_scopes": EDITABLE_CONTENT_SCOPES,
            },
            "counts": {
                "data_files": len(files),
                "data_bytes": total_bytes,
                "database_tables": len(table_counts),
                "database_rows": table_counts,
            },
        }

        contents_readme = "\n".join(
            [
                "Mulan Dance content backup",
                f"Created at: {created_at.isoformat()}",
                f"Kind: {kind}",
                f"Backup format: V{BACKUP_VERSION}",
                f"Application version: {settings.APP_VERSION}",
                f"Database revision: {schema['revision'] or 'unversioned'}",
                f"Application schema head: {_application_schema_head() or 'unknown'}",
                "",
                "This archive contains:",
                "- database.sqlite: all SQLite database tables and rows",
                "- data/: editable content files, uploaded media, pages, news markdown, and generated assets",
                "",
                "Editable content scopes covered:",
                *[f"- {scope}" for scope in EDITABLE_CONTENT_SCOPES],
                "",
                "Database table row counts:",
                *[f"- {table}: {count}" for table, count in table_counts.items()],
                "",
                "Restore warning: restoring this backup replaces the current database and data content.",
            ]
        )

        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=True) as archive:
            file_metadata = {
                "BACKUP_CONTENTS.txt": _write_archive_bytes(
                    archive, "BACKUP_CONTENTS.txt", contents_readme.encode("utf-8")
                ),
                "database.sqlite": _write_archive_file(archive, temp_db, "database.sqlite"),
            }
            for path in files:
                archive_name = PurePosixPath("data", path.relative_to(data_dir).as_posix()).as_posix()
                file_metadata[archive_name] = _write_archive_file(archive, path, archive_name)
            manifest["files"] = file_metadata
            archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))

    return target


def _validate_backup_zip(zip_path: Path) -> dict:
    try:
        with zipfile.ZipFile(zip_path, "r") as archive:
            bad_file = archive.testzip()
            if bad_file:
                raise HTTPException(status_code=400, detail=f"Backup archive is corrupt at: {bad_file}")
            names = archive.namelist()
            if "manifest.json" not in names or "database.sqlite" not in names:
                raise HTTPException(status_code=400, detail="Backup archive must contain manifest.json and database.sqlite.")
            for name in names:
                if not _safe_zip_member(name):
                    raise HTTPException(status_code=400, detail=f"Unsafe backup path: {name}")
            manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
            if int(manifest.get("version", 0)) >= 2:
                files = manifest.get("files")
                if not isinstance(files, dict) or "database.sqlite" not in files:
                    raise HTTPException(status_code=400, detail="V2 backup manifest is missing file integrity metadata.")
                expected_names = set(files)
                archive_names = set(names) - {"manifest.json"}
                if expected_names != archive_names:
                    raise HTTPException(status_code=400, detail="V2 backup file list does not match the archive.")
                for name, metadata in files.items():
                    if not isinstance(metadata, dict):
                        raise HTTPException(status_code=400, detail=f"Invalid V2 file metadata: {name}")
                    digest = hashlib.sha256()
                    size = 0
                    with archive.open(name, "r") as source:
                        while chunk := source.read(1024 * 1024):
                            digest.update(chunk)
                            size += len(chunk)
                    if size != int(metadata.get("size", -1)) or digest.hexdigest() != metadata.get("sha256"):
                        raise HTTPException(status_code=400, detail=f"Backup integrity check failed: {name}")
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid zip backup.") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Backup manifest is not valid JSON.") from exc

    if manifest.get("format") != "mulandance-content-backup":
        raise HTTPException(status_code=400, detail="Backup archive format is not supported.")
    if int(manifest.get("version", 0)) > BACKUP_VERSION:
        raise HTTPException(status_code=400, detail="Backup archive version is newer than this app supports.")
    return manifest


def _copy_restored_data(extracted_root: Path) -> int:
    restored_data = extracted_root / "data"
    if not restored_data.exists():
        return 0

    data_dir = Path(settings.DATA_DIR)
    data_dir.mkdir(parents=True, exist_ok=True)

    for child in data_dir.iterdir():
        if child.name == "backups":
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()

    count = 0
    for source in restored_data.rglob("*"):
        relative = source.relative_to(restored_data)
        if relative.parts and relative.parts[0] == "backups":
            continue
        target = data_dir / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            count += 1
    _backup_dir()
    return count


def _restore_database(extracted_root: Path) -> bool:
    source_db = extracted_root / "database.sqlite"
    if not source_db.exists():
        return False

    db_path = _sqlite_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    engine.dispose()

    source = sqlite3.connect(str(source_db))
    destination = sqlite3.connect(str(db_path))
    try:
        source.backup(destination)
    finally:
        destination.close()
        source.close()
        engine.dispose()
    return True


@router.get("/export")
def export_backup(_: str = Depends(require_super_admin)):
    backup_path = create_backup_file("manual")
    return FileResponse(
        path=str(backup_path),
        filename=backup_path.name,
        media_type="application/zip",
    )


@router.get("/list", response_model=BackupListResponse)
def list_backups(_: str = Depends(require_super_admin)):
    items = []
    for path in sorted(_backup_dir().glob("*.zip"), key=lambda item: item.stat().st_mtime, reverse=True):
        stat = path.stat()
        format_version = 1
        app_version = ""
        schema_revision = ""
        try:
            with zipfile.ZipFile(path, "r") as archive:
                manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
                format_version = int(manifest.get("version", 1))
                app_version = str((manifest.get("application") or {}).get("version") or "")
                database = manifest.get("database") or {}
                schema_revision = str(database.get("schema_revision") or database.get("application_schema_head") or "")
        except (zipfile.BadZipFile, KeyError, json.JSONDecodeError, ValueError):
            pass
        items.append(
            BackupInfo(
                filename=path.name,
                size=stat.st_size,
                created_at=datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                format_version=format_version,
                app_version=app_version,
                schema_revision=schema_revision,
            )
        )
    return BackupListResponse(items=items)


@router.post("/restore", response_model=BackupRestoreResponse)
async def restore_backup(file: UploadFile, _: str = Depends(require_super_admin)):
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a .zip backup file.")

    with tempfile.TemporaryDirectory() as tmp:
        temp_dir = Path(tmp)
        uploaded = temp_dir / "uploaded.zip"
        with uploaded.open("wb") as output:
            shutil.copyfileobj(file.file, output)

        _validate_backup_zip(uploaded)
        pre_restore = create_backup_file("pre-restore")

        extract_dir = temp_dir / "extracted"
        extract_dir.mkdir()
        with zipfile.ZipFile(uploaded, "r") as archive:
            archive.extractall(extract_dir)

        restored_database = _restore_database(extract_dir)
        restored_files = _copy_restored_data(extract_dir)

    return BackupRestoreResponse(
        message="Backup restored. Restart the app if the browser still shows old cached data.",
        pre_restore_backup=pre_restore.name,
        restored_database=restored_database,
        restored_files=restored_files,
    )
