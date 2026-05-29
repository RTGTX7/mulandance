import base64
import hashlib
import hmac
import json
import random
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.config import settings
from app.core.database import get_db
from app.models import ClassroomBooking, SystemSettings
from app.schemas.classroom import (
    ClassroomCaptchaResponse,
    ClassroomBookingCreate,
    ClassroomBookingCreateResponse,
    ClassroomBookingResponse,
    ClassroomBookingUpdate,
)
from app.services.email import email_enabled, extract_email, send_classroom_booking_receipt


router = APIRouter()
CAPTCHA_MAX_AGE_SECONDS = 10 * 60


def _clean_text(value: Optional[str]) -> Optional[str]:
    return value.strip() if isinstance(value, str) else value


def _require_text(value: Optional[str], field_name: str):
    if not value or not value.strip():
        raise HTTPException(status_code=400, detail=f"{field_name} is required")


def _sign_captcha_payload(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("ascii")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def _read_captcha_token(token: Optional[str]) -> dict:
    if not token or "." not in token:
        raise HTTPException(status_code=400, detail="Captcha verification is required.")
    encoded, signature = token.rsplit(".", 1)
    expected = hmac.new(settings.SECRET_KEY.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=400, detail="Captcha verification failed.")
    try:
        payload = json.loads(base64.urlsafe_b64decode(encoded.encode("ascii")).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Captcha verification failed.")
    if int(time.time()) - int(payload.get("created_at", 0)) > CAPTCHA_MAX_AGE_SECONDS:
        raise HTTPException(status_code=400, detail="Captcha expired.")
    return payload


def _verify_captcha(token: Optional[str], answer: Optional[str]):
    payload = _read_captcha_token(token)
    try:
        submitted_answer = int(str(answer or "").strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="Captcha answer is required.")
    if submitted_answer != int(payload.get("answer")):
        raise HTTPException(status_code=400, detail="Captcha answer is incorrect.")


def _get_system_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    return settings or SystemSettings(id=1)


def _enforce_contact_request_limit(db: Session, contact: Optional[str]):
    settings = _get_system_settings(db)
    limit = settings.classroom_request_limit_per_contact or 0
    if limit <= 0 or not contact:
        return

    normalized_contact = contact.strip().lower()
    existing_count = (
        db.query(ClassroomBooking)
        .filter(ClassroomBooking.booking_type == "external")
        .filter(ClassroomBooking.status == "pending")
        .filter(func.lower(func.trim(ClassroomBooking.applicant_contact)) == normalized_contact)
        .count()
    )
    if existing_count >= limit:
        raise HTTPException(
            status_code=400,
            detail="This contact has reached the rental request limit.",
        )


@router.get("/captcha", response_model=ClassroomCaptchaResponse)
def get_classroom_captcha():
    left = random.randint(0, 10)
    right = random.randint(0, 10)
    operator = random.choice(["+", "-", "x"])
    if operator == "+":
        answer = left + right
    elif operator == "-":
        if right > left:
            left, right = right, left
        answer = left - right
    else:
        answer = left * right

    token = _sign_captcha_payload({
        "answer": answer,
        "created_at": int(time.time()),
    })
    return ClassroomCaptchaResponse(question=f"{left} {operator} {right} = ?", token=token)


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


@router.post("/bookings", response_model=ClassroomBookingCreateResponse)
def create_classroom_booking(
    booking_data: ClassroomBookingCreate,
    db: Session = Depends(get_db),
):
    if booking_data.start_time >= booking_data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    payload = booking_data.model_dump()
    captcha_token = payload.pop("captcha_token", None)
    captcha_answer = payload.pop("captcha_answer", None)
    for field in ("title", "teacher_name", "applicant_name", "applicant_contact", "notes"):
        payload[field] = _clean_text(payload.get(field))

    _require_text(payload.get("title"), "Purpose / activity name")
    if payload.get("booking_type") == "external":
        _require_text(payload.get("applicant_name"), "Applicant")
        _require_text(payload.get("applicant_contact"), "Contact")
        _verify_captcha(captcha_token, captcha_answer)
        _enforce_contact_request_limit(db, payload.get("applicant_contact"))

    booking = ClassroomBooking(**payload)
    if booking.booking_type == "external" and booking.status == "confirmed":
        booking.status = "pending"

    db.add(booking)
    db.commit()
    db.refresh(booking)
    receipt_email = None
    receipt_status = "not_requested"
    if booking.booking_type == "external":
        receipt_email = extract_email(booking.applicant_contact)
        system_settings = _get_system_settings(db)
        from_email = system_settings.outbound_email if system_settings and system_settings.outbound_email else None
        if not receipt_email:
            receipt_status = "not_requested"
        elif not email_enabled(from_email):
            receipt_status = "not_configured"
        elif send_classroom_booking_receipt(booking, from_email=from_email):
            receipt_status = "sent"
        else:
            receipt_status = "failed"
    return ClassroomBookingCreateResponse(
        booking=booking,
        receipt_email=receipt_email,
        receipt_status=receipt_status,
    )


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
        if field in ("title", "teacher_name", "applicant_name", "applicant_contact", "notes"):
            value = _clean_text(value)
        setattr(booking, field, value)

    if booking.start_time >= booking.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    _require_text(booking.title, "Purpose / activity name")
    if booking.booking_type == "external":
        _require_text(booking.applicant_name, "Applicant")
        _require_text(booking.applicant_contact, "Contact")

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
