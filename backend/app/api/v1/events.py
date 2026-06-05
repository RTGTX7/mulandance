import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.translations import ensure_text_column, localized_payload, set_translation_bundle, translation_bundle
from app.schemas.event import EventCreate, EventUpdate, EventResponse, PerformanceCreate, PerformanceUpdate, PerformanceResponse
from app.models import Event, Performance

router = APIRouter()
PERFORMANCE_TRANSLATABLE_FIELDS = ("title", "description", "venue")


def _ensure_performance_columns(db: Session) -> None:
    ensure_text_column(db, "performances")
    columns = {column["name"] for column in db.execute(text("PRAGMA table_info(performances)")).mappings().all()}
    if "related_article_ids" not in columns:
        db.execute(text("ALTER TABLE performances ADD COLUMN related_article_ids TEXT"))
        db.commit()


def _parse_related_article_ids(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except Exception:
        return []
    if not isinstance(parsed, list):
        return []
    seen = set()
    result = []
    for item in parsed:
        article_id = str(item or "").strip()
        if article_id and article_id not in seen:
            seen.add(article_id)
            result.append(article_id)
    return result


def _dump_related_article_ids(value: list[str] | None) -> str:
    seen = set()
    result = []
    for item in value or []:
        article_id = str(item or "").strip()
        if article_id and article_id not in seen:
            seen.add(article_id)
            result.append(article_id)
    return json.dumps(result)


def _find_performance(db: Session, identifier: str) -> Performance | None:
    return (
        db.query(Performance)
        .filter((Performance.id == identifier) | (Performance.slug == identifier))
        .first()
    )


def _performance_response(
    performance: Performance,
    locale: str | None = None,
    include_translations: bool = False,
) -> PerformanceResponse:
    data = {
        "id": performance.id,
        "slug": performance.slug,
        "start_date": performance.start_date,
        "end_date": performance.end_date,
        "cover_image": performance.cover_image,
        "is_current": bool(performance.is_current),
        "related_article_ids": _parse_related_article_ids(getattr(performance, "related_article_ids", None)),
        "created_at": performance.created_at,
        "translations": translation_bundle(performance) if include_translations else {},
    }
    data.update(localized_payload(performance, PERFORMANCE_TRANSLATABLE_FIELDS, locale))
    return PerformanceResponse(**data)


@router.get("/events", response_model=List[EventResponse])
def list_events(
    event_type: Optional[str] = Query(None),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    return (
        query.order_by(Event.start_time.desc())
        .limit(limit)
        .all()
    )


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/events/slug/{slug}", response_model=EventResponse)
def get_event_by_slug(slug: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.slug == slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/performances", response_model=List[PerformanceResponse])
def list_performances(
    current: bool = Query(False),
    locale: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    _ensure_performance_columns(db)
    query = db.query(Performance)
    if current:
        query = query.filter(Performance.is_current == True)
    performances = query.order_by(Performance.start_date.asc()).all()
    return [_performance_response(performance, locale) for performance in performances]


@router.post("/performances", response_model=PerformanceResponse)
def create_performance(
    performance_data: PerformanceCreate,
    db: Session = Depends(get_db),
):
    _ensure_performance_columns(db)
    existing = db.query(Performance).filter(Performance.slug == performance_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Performance slug already exists")

    payload = performance_data.model_dump()
    translations = payload.pop("translations", None)
    related_article_ids = payload.pop("related_article_ids", None)
    performance = Performance(**payload)
    set_translation_bundle(performance, translations)
    performance.related_article_ids = _dump_related_article_ids(related_article_ids)
    db.add(performance)
    db.commit()
    db.refresh(performance)
    return _performance_response(performance, include_translations=True)


@router.get("/performances/slug/{slug}", response_model=PerformanceResponse)
def get_performance_by_slug(slug: str, locale: Optional[str] = Query(None), db: Session = Depends(get_db)):
    _ensure_performance_columns(db)
    performance = db.query(Performance).filter(Performance.slug == slug).first()
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")
    return _performance_response(performance, locale)


@router.get("/performances/{performance_id}", response_model=PerformanceResponse)
def get_performance(performance_id: str, locale: Optional[str] = Query(None), db: Session = Depends(get_db)):
    _ensure_performance_columns(db)
    performance = _find_performance(db, performance_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")
    return _performance_response(performance, locale, include_translations=True)


@router.put("/performances/{performance_id}", response_model=PerformanceResponse)
def update_performance(
    performance_id: str,
    performance_data: PerformanceUpdate,
    db: Session = Depends(get_db),
):
    _ensure_performance_columns(db)
    performance = _find_performance(db, performance_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")

    updates = performance_data.model_dump(exclude_unset=True)
    translations = updates.pop("translations", None)
    related_article_ids = updates.pop("related_article_ids", None)
    new_slug = updates.get("slug")
    if new_slug and new_slug != performance.slug:
        existing = db.query(Performance).filter(
            Performance.slug == new_slug,
            Performance.id != performance.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Performance slug already exists")

    for field, value in updates.items():
        setattr(performance, field, value)
    if translations is not None:
        set_translation_bundle(performance, translations)
    if related_article_ids is not None:
        performance.related_article_ids = _dump_related_article_ids(related_article_ids)

    db.commit()
    db.refresh(performance)
    return _performance_response(performance, include_translations=True)


@router.delete("/performances/{performance_id}")
def delete_performance(performance_id: str, db: Session = Depends(get_db)):
    performance = _find_performance(db, performance_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")

    db.delete(performance)
    db.commit()
    return {"detail": "Performance deleted"}
