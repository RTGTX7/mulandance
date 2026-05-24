from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
# UUID replaced with str for SQLite

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Enrollment, ClassSchedule, Payment, Message, EventRegistration

router = APIRouter()


@router.get("/enrollments")
def list_enrollments(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    return [
        {
            "id": str(e.id),
            "status": e.status,
            "payment_status": e.payment_status,
            "academic_year": e.academic_year,
            "enrolled_at": str(e.enrolled_at),
            "class_schedule": {
                "id": str(e.class_schedule.id),
                "program": e.class_schedule.program.name if e.class_schedule.program else None,
                "day_of_week": e.class_schedule.day_of_week,
                "start_time": str(e.class_schedule.start_time),
                "location": e.class_schedule.location,
            },
        }
        for e in enrollments
    ]


@router.get("/schedule")
def get_schedule(
    user_id: str = Depends(get_current_user_id),
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(ClassSchedule)
        .join(Enrollment, ClassSchedule.id == Enrollment.class_schedule_id)
        .filter(Enrollment.user_id == user_id)
    )
    if academic_year:
        query = query.filter(ClassSchedule.academic_year == academic_year)

    schedules = query.all()
    return [
        {
            "id": str(s.id),
            "program": s.program.name if s.program else None,
            "day_of_week": s.day_of_week,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "location": s.location,
        }
        for s in schedules
    ]


@router.get("/payments")
def list_payments(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(p.id),
            "amount": p.amount,
            "type": p.type,
            "status": p.status,
            "created_at": str(p.created_at),
        }
        for p in payments
    ]


@router.get("/messages")
def list_messages(
    user_id: str = Depends(get_current_user_id),
    unread_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Message).filter(
        (Message.receiver_id == user_id) | (Message.sender_id == user_id)
    )
    if unread_only:
        query = query.filter(Message.is_read == False)

    messages = query.order_by(Message.created_at.desc()).all()
    return [
        {
            "id": str(m.id),
            "subject": m.subject,
            "body": m.body,
            "is_read": m.is_read,
            "sender_name": f"{m.sender.first_name} {m.sender.last_name}" if m.sender else "System",
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


@router.post("/enrollments")
def create_enrollment(
    class_schedule_id: str,
    academic_year: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.class_schedule_id == class_schedule_id,
            Enrollment.academic_year == academic_year,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this class")

    schedule = db.query(ClassSchedule).filter(ClassSchedule.id == class_schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Class not found")

    enrollment = Enrollment(
        user_id=user_id,
        class_schedule_id=class_schedule_id,
        academic_year=academic_year,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {"id": str(enrollment.id), "status": enrollment.status}


@router.post("/events/{event_id}/register")
def register_for_event(
    event_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == user_id,
    ).first()
    if event:
        raise HTTPException(status_code=400, detail="Already registered")

    registration = EventRegistration(event_id=event_id, user_id=user_id)
    db.add(registration)
    db.commit()
    db.refresh(registration)

    return {"id": str(registration.id), "status": "registered"}
