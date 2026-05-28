from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app.core.config import settings
from app.api.v1.settings import require_admin_or_editor
from app.core.database import get_db
from app.models import CourseScheduleItem, SchoolPolicy, User
from app.schemas.schedule import (
    CourseScheduleItemCreate,
    CourseScheduleItemResponse,
    CourseScheduleItemUpdate,
    SchoolPolicyResponse,
    SchoolPolicyUpdate,
)


router = APIRouter()
POLICY_FILE = Path(settings.NEWS_FILES_DIR).parent / "pages" / "school-policy.md"


def _ordered(query):
    return query.order_by(
        CourseScheduleItem.day_of_week.asc(),
        CourseScheduleItem.order_index.asc(),
        CourseScheduleItem.start_time.asc(),
    )


def _get_or_create_policy(db: Session) -> SchoolPolicy:
    policy = db.query(SchoolPolicy).filter(SchoolPolicy.id == 1).first()
    if policy:
        return policy

    policy = SchoolPolicy(id=1)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def _read_policy_file(fallback: str = "") -> str:
    if POLICY_FILE.exists():
        return POLICY_FILE.read_text(encoding="utf-8")
    return fallback


def _write_policy_file(body_markdown: str) -> None:
    POLICY_FILE.parent.mkdir(parents=True, exist_ok=True)
    POLICY_FILE.write_text(body_markdown or "", encoding="utf-8", newline="")


@router.get("/classes", response_model=List[CourseScheduleItemResponse])
def list_schedule_items(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(CourseScheduleItem)
    if not include_inactive:
        query = query.filter(CourseScheduleItem.is_active == True)  # noqa: E712
    return _ordered(query).all()


@router.post("/classes", response_model=CourseScheduleItemResponse)
def create_schedule_item(
    payload: CourseScheduleItemCreate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    item = CourseScheduleItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/classes/{item_id}", response_model=CourseScheduleItemResponse)
def update_schedule_item(
    item_id: str,
    payload: CourseScheduleItemUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    item = db.query(CourseScheduleItem).filter(CourseScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    if item.start_time >= item.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    db.commit()
    db.refresh(item)
    return item


@router.delete("/classes/{item_id}")
def delete_schedule_item(
    item_id: str,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    item = db.query(CourseScheduleItem).filter(CourseScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")

    db.delete(item)
    db.commit()
    return {"detail": "Schedule item deleted"}


@router.get("/policy", response_model=SchoolPolicyResponse)
def get_school_policy(db: Session = Depends(get_db)):
    policy = _get_or_create_policy(db)
    file_body = _read_policy_file(policy.body_markdown or "")
    if file_body and file_body != (policy.body_markdown or ""):
        policy.body_markdown = file_body
    elif policy.body_markdown and not POLICY_FILE.exists():
        _write_policy_file(policy.body_markdown)
    return policy


@router.put("/policy", response_model=SchoolPolicyResponse)
def update_school_policy(
    payload: SchoolPolicyUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    policy = _get_or_create_policy(db)
    policy.title = payload.title.strip() or "学校规章制度及退费规则"
    _write_policy_file(payload.body_markdown)
    # Keep DB as metadata/index only; body content lives in data/pages/school-policy.md.
    policy.body_markdown = ""
    db.commit()
    db.refresh(policy)
    policy.body_markdown = _read_policy_file()
    return policy
