import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

router = APIRouter()

# Upload storage directory: data/uploads/images/editor/
UPLOAD_ROOT = Path(settings.NEWS_FILES_DIR).parent / "uploads"
IMAGE_UPLOAD_BASE = UPLOAD_ROOT / "images" / "editor"
FILE_UPLOAD_BASE = UPLOAD_ROOT / "files"


def _get_year_month() -> tuple[str, str]:
    """Get current year and month strings for organized storage."""
    now = datetime.utcnow()
    return now.strftime("%Y"), now.strftime("%m")


def _get_upload_dir() -> Path:
    """Ensure the upload directory structure exists."""
    year, month = _get_year_month()
    upload_dir = IMAGE_UPLOAD_BASE / year / month
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir, year, month


def _get_file_upload_dir() -> tuple[Path, str, str]:
    year, month = _get_year_month()
    upload_dir = FILE_UPLOAD_BASE / year / month
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir, year, month


def _safe_original_name(filename: str) -> str:
    stem = Path(filename or "file").stem
    clean = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-._")
    return clean[:80] or "file"


# Ensure StaticFiles mount exists
_STATIC_MOUNTED = False


def ensure_static_mount(app) -> None:
    """Mount static files handler for uploaded images."""
    global _STATIC_MOUNTED
    if not _STATIC_MOUNTED:
        UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
        if not hasattr(app, "mounts") and app.mounts:
            pass
        app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")
        _STATIC_MOUNTED = True


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file and return its URL.
    
    Accepted image types: PNG, JPG, JPEG, GIF, WEBP, SVG
    Files are saved to data/uploads/images/editor/YYYY/MM/ with UUID names.
    Returns a full URL accessible at /static/uploads/images/editor/YYYY/MM/uuid.ext
    """
    # Validate file type
    allowed_types = {
        "image/png", "image/jpeg", "image/jpg", 
        "image/gif", "image/webp", "image/svg+xml"
    }
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(sorted(allowed_types))}"
        )
    
    # Validate file size (10MB max)
    file_contents = await file.read()
    if len(file_contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 10MB limit"
        )
    
    # Generate organized path and unique filename
    upload_dir, year, month = _get_upload_dir()
    
    ext = Path(file.filename or "image.png").suffix
    if ext.lower() not in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"):
        ext = ".png"
    
    filename = f"{uuid.uuid4().hex}{ext}"
    relative_path = f"images/editor/{year}/{month}/{filename}"
    
    # Save file
    file_path = upload_dir / filename
    with open(file_path, "wb") as f:
        f.write(file_contents)
    
    # Build the public URL
    public_url = f"http://localhost:8000/static/uploads/{relative_path}"
    
    return {
        "url": public_url,
        "filename": filename,
        "path": relative_path,
        "content_type": file.content_type,
        "size": len(file_contents)
    }


@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """Upload a general document/file to data/uploads/files/YYYY/MM/."""
    allowed_types = {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
    }
    allowed_exts = {
        ".pdf", ".txt", ".md", ".doc", ".docx", ".xls", ".xlsx",
        ".ppt", ".pptx", ".zip",
    }

    ext = Path(file.filename or "file").suffix.lower()
    if file.content_type not in allowed_types and ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type or ext}",
        )

    file_contents = await file.read()
    if len(file_contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 25MB limit")

    upload_dir, year, month = _get_file_upload_dir()
    if ext not in allowed_exts:
        ext = ".bin"

    safe_name = _safe_original_name(file.filename or "file")
    filename = f"{safe_name}-{uuid.uuid4().hex[:12]}{ext}"
    relative_path = f"files/{year}/{month}/{filename}"
    file_path = upload_dir / filename
    with open(file_path, "wb") as f:
        f.write(file_contents)

    public_url = f"http://localhost:8000/static/uploads/{relative_path}"
    return {
        "url": public_url,
        "filename": filename,
        "path": relative_path,
        "content_type": file.content_type,
        "size": len(file_contents),
    }
