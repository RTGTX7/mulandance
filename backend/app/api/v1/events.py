from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.schemas.event import EventCreate, EventUpdate, EventResponse, PerformanceCreate, PerformanceUpdate, PerformanceResponse
from app.models import Event, Performance

router = APIRouter()


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
    db: Session = Depends(get_db),
):
    query = db.query(Performance)
    if current:
        query = query.filter(Performance.is_current == True)
    return query.order_by(Performance.start_date.desc()).all()


@router.get("/performances/{performance_id}", response_model=PerformanceResponse)
def get_performance(performance_id: str, db: Session = Depends(get_db)):
    performance = db.query(Performance).filter(Performance.id == performance_id).first()
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")
    return performance


@router.get("/performances/slug/{slug}", response_model=PerformanceResponse)
def get_performance_by_slug(slug: str, db: Session = Depends(get_db)):
    performance = db.query(Performance).filter(Performance.slug == slug).first()
    if not performance:
        raise HTTPException(status_code=404, detail="Performance not found")
    return performance
