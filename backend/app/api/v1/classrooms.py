from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models import ClassroomBooking
from app.schemas.classroom import (
    ClassroomBookingCreate,
    ClassroomBookingResponse,
    ClassroomBookingUpdate,
)


router = APIRouter()


@router.get("/bookings", response_model=List[ClassroomBookingResponse])
def list_classroom_bookings(
    room: Optional[str] = Query(None, pattern="^(large|small)$"),
    status: Optional[str] = Query(None, pattern="^(pending|confirmed|rejected)$"),
    db: Session = Depends(get_db),
):
    query = db.query(ClassroomBooking)
    if room:
        query = query.filter(ClassroomBooking.room == room)
    if status:
        query = query.filter(ClassroomBooking.status == status)
    return query.order_by(
        ClassroomBooking.day_of_week.asc(),
        ClassroomBooking.start_time.asc(),
        ClassroomBooking.room.asc(),
    ).all()


@router.post("/bookings", response_model=ClassroomBookingResponse)
def create_classroom_booking(
    booking_data: ClassroomBookingCreate,
    db: Session = Depends(get_db),
):
    if booking_data.start_time >= booking_data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    booking = ClassroomBooking(**booking_data.model_dump())
    if booking.booking_type == "external" and booking.status == "confirmed":
        booking.status = "pending"

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.put("/bookings/{booking_id}", response_model=ClassroomBookingResponse)
def update_classroom_booking(
    booking_id: str,
    booking_data: ClassroomBookingUpdate,
    db: Session = Depends(get_db),
):
    booking = db.query(ClassroomBooking).filter(ClassroomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Classroom booking not found")

    updates = booking_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(booking, field, value)

    if booking.start_time >= booking.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/bookings/{booking_id}")
def delete_classroom_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(ClassroomBooking).filter(ClassroomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Classroom booking not found")

    db.delete(booking)
    db.commit()
    return {"detail": "Classroom booking deleted"}
