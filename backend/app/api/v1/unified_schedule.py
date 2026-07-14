from datetime import date, datetime, timedelta
from calendar import monthrange
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.settings import get_current_user, require_admin_or_editor, require_super_admin
from app.core.database import get_db
from app.core.permissions import has_permission, permission_denied, require_user_permission
from app.core.translations import localized_value, set_translation_bundle, translation_bundle
from app.models import (
    CourseOffering, CourseOfferingSlot, CourseOfferingSlotException, CourseTemplate,
    FixedClassException,
    FixedClassPlan,
    ScheduleBooking,
    ScheduleCoordinationRequest,
    ExternalRentalRequest,
    Studio,
    StudioRoom,
    User, UserProfile,
)
from app.schemas.unified_schedule import (
    BookingBatchUpdate, BookingBody, BookingResponse, BookingUpdate, CalendarEvent, CoordinationRequestBody,
    CoordinationRequestResponse, CoordinationResolution, FixedExceptionBody,
    FixedExceptionResponse, FixedPlanBody, FixedPlanResponse, RoomBody, RoomResponse,
    StudioBody, StudioResponse,
    CourseOfferingBody, CourseOfferingResponse, CourseSlotBody, CourseSlotExceptionBody,
    CourseSlotExceptionResponse, CourseTemplateBody, CourseTemplateResponse,
    CourseDraftCreateBody,
    ExternalRentalRequestBody, ExternalRentalRequestResponse, ExternalRentalRequestUpdate,
    ExternalRentalReview, PublicRentalResource, RoomOccupancy,
)

router = APIRouter()


def permission_dependency(key: str, action: str = "view"):
    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        return require_user_permission(user, db, key, action)  # type: ignore[arg-type]
    return dependency


calendar_view = permission_dependency("teaching.schedules.calendar")
calendar_manage = permission_dependency("teaching.schedules.calendar", "manage")
fixed_view = permission_dependency("teaching.schedules.fixed")
fixed_manage = permission_dependency("teaching.schedules.fixed", "manage")
bookings_view = permission_dependency("teaching.schedules.bookings")
bookings_manage = permission_dependency("teaching.schedules.bookings", "manage")
rentals_view = permission_dependency("classrooms.rentals")
rentals_manage = permission_dependency("classrooms.rentals", "manage")
studio_view = permission_dependency("system.studio")
studio_manage = permission_dependency("system.studio", "manage")


def fixed_or_ai_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if has_permission(db, user, "teaching.schedules.fixed", "manage") or has_permission(db, user, "teaching.schedules.ai", "manage"):
        return user
    raise permission_denied("teaching.schedules.ai", "manage")


def _iso(value: date) -> str:
    return value.isoformat()


def _public_calendar_limit() -> date:
    current = date.today()
    month_index = current.month - 1 + 6
    year = current.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, min(current.day, monthrange(year, month)[1]))


def _require_room(db: Session, room_id: str) -> StudioRoom:
    room = db.query(StudioRoom).filter(StudioRoom.id == room_id, StudioRoom.is_active.is_(True)).first()
    if not room:
        raise HTTPException(status_code=400, detail="Active studio room not found")
    return room


def _require_rentable_room(db: Session, room_id: str) -> StudioRoom:
    room = db.query(StudioRoom).filter(StudioRoom.id == room_id, StudioRoom.is_active.is_(True), StudioRoom.is_rentable.is_(True)).first()
    if not room:
        raise HTTPException(status_code=400, detail="This room is not available for public rental")
    studio = db.query(Studio).filter(Studio.id == room.studio_id, Studio.is_active.is_(True)).first()
    if not studio:
        raise HTTPException(status_code=400, detail="This studio is not active")
    return room


def _request_dates(request: ExternalRentalRequest | ExternalRentalRequestBody) -> list[date]:
    if request.request_mode == "single":
        value = request.date or request.start_date
        if isinstance(value, str):
            value = date.fromisoformat(value)
        return [value] if value else []
    start = date.fromisoformat(request.start_date) if isinstance(request.start_date, str) else request.start_date
    end = date.fromisoformat(request.end_date) if isinstance(request.end_date, str) else request.end_date
    days = set(request.days_of_week)
    if not start or not end:
        return []
    values: list[date] = []
    current = start
    while current <= end:
        if ((current.weekday() + 1) % 7) in days:
            values.append(current)
        current += timedelta(days=1)
    return values


def _external_request_response(item: ExternalRentalRequest) -> ExternalRentalRequestResponse:
    return ExternalRentalRequestResponse(
        id=item.id,
        room_id=item.room_id,
        request_mode=item.request_mode,
        date=date.fromisoformat(item.date) if item.date else None,
        start_date=date.fromisoformat(item.start_date) if item.start_date else None,
        end_date=date.fromisoformat(item.end_date) if item.end_date else None,
        days_of_week=item.days_of_week,
        start_time=item.start_time,
        end_time=item.end_time,
        title=item.title,
        applicant_name=item.applicant_name,
        applicant_contact=item.applicant_contact,
        notes=item.notes or "",
        status=item.status,
        reviewed_by_id=item.reviewed_by_id,
        reviewed_at=item.reviewed_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _overlaps(start_a: str, end_a: str, start_b: str, end_b: str) -> bool:
    # A booking ending at 00:00 occupies the selected date through midnight.
    normalized_end_a = "24:00" if end_a == "00:00" else end_a
    normalized_end_b = "24:00" if end_b == "00:00" else end_b
    return start_a < normalized_end_b and normalized_end_a > start_b


def _date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def _plan_days(plan: FixedClassPlan) -> list[int]:
    try:
        import json
        values = json.loads(plan.days_of_week_json or "[]")
        values = [int(value) for value in values if 0 <= int(value) <= 6]
        return values or [plan.day_of_week]
    except (TypeError, ValueError):
        return [plan.day_of_week]


def _plan_event(plan: FixedClassPlan, event_date: date, exception: FixedClassException | None = None, locale: str | None = None) -> CalendarEvent | None:
    if exception and exception.kind == "cancel":
        return None
    return CalendarEvent(
        id=f"fixed:{plan.id}:{event_date.isoformat()}", source="fixed", date=event_date,
        room_id=(exception.room_id if exception and exception.room_id else plan.room_id),
        teacher_id=plan.teacher_id,
        start_time=(exception.start_time if exception and exception.start_time else plan.start_time),
        end_time=(exception.end_time if exception and exception.end_time else plan.end_time),
        title=(exception.title if exception and exception.title else localized_value(plan, "title", locale)),
        description=(exception.description if exception and exception.description is not None else localized_value(plan, "description", locale)),
        is_public=plan.is_public, status="confirmed",
    )


def _fixed_events(db: Session, start: date, end: date, *, public_only: bool = False, exclude_plan_id: str | None = None, locale: str | None = None) -> list[CalendarEvent]:
    query = db.query(FixedClassPlan).filter(
        FixedClassPlan.is_active.is_(True), FixedClassPlan.start_date <= _iso(end), FixedClassPlan.end_date >= _iso(start)
    )
    if public_only:
        query = query.filter(FixedClassPlan.is_public.is_(True))
    if exclude_plan_id:
        query = query.filter(FixedClassPlan.id != exclude_plan_id)
    plans = query.all()
    exceptions = db.query(FixedClassException).filter(
        FixedClassException.date >= _iso(start), FixedClassException.date <= _iso(end)
    ).all()
    exception_map = {(item.plan_id, item.date): item for item in exceptions}
    events: list[CalendarEvent] = []
    for plan in plans:
        plan_start = max(start, date.fromisoformat(plan.start_date))
        plan_end = min(end, date.fromisoformat(plan.end_date))
        for current in _date_range(plan_start, plan_end):
            if ((current.weekday() + 1) % 7) not in _plan_days(plan):
                continue
            event = _plan_event(plan, current, exception_map.get((plan.id, _iso(current))), locale)
            if event:
                events.append(event)
    return events


def _booking_event(booking: ScheduleBooking) -> CalendarEvent:
    return CalendarEvent(
        id=f"booking:{booking.id}", source="booking", date=date.fromisoformat(booking.date),
        room_id=booking.room_id, teacher_id=booking.teacher_id, start_time=booking.start_time,
        end_time=booking.end_time, title=booking.title, booking_type=booking.booking_type,
        status=booking.status, is_locked=booking.is_locked, is_public=booking.is_public,
        description=booking.notes or "",
    )


def _course_event(template: CourseTemplate, offering: CourseOffering, slot: CourseOfferingSlot, event_date: date, exception: CourseOfferingSlotException | None, locale: str | None, room_names: dict[str, str]) -> CalendarEvent | None:
    if exception and exception.kind == "cancel":
        return None
    return CalendarEvent(
        id=f"course-slot:{slot.id}:{event_date.isoformat()}", source="fixed", date=event_date,
        room_id=(exception.room_id if exception and exception.room_id else slot.room_id) or "",
        room_name=room_names.get(exception.room_id if exception and exception.room_id else slot.room_id, ""),
        teacher_id=slot.teacher_id,
        start_time=exception.start_time if exception and exception.start_time else slot.start_time,
        end_time=exception.end_time if exception and exception.end_time else slot.end_time,
        title=localized_value(template, "title", locale),
        description="", is_public=offering.is_public, status="confirmed",
    )


def _course_events(db: Session, start: date, end: date, *, public_only: bool = False, locale: str | None = None) -> list[CalendarEvent]:
    query = db.query(CourseTemplate, CourseOffering, CourseOfferingSlot).join(
        CourseOffering, CourseOffering.course_template_id == CourseTemplate.id
    ).join(CourseOfferingSlot, CourseOfferingSlot.offering_id == CourseOffering.id).filter(
        CourseTemplate.is_active.is_(True), CourseOffering.is_active.is_(True),
        CourseOffering.start_date <= _iso(end), CourseOffering.end_date >= _iso(start),
    )
    if public_only:
        query = query.filter(CourseOffering.is_public.is_(True))
    rows = query.all()
    room_names = {item.id: item.name for item in db.query(StudioRoom).all()}
    slot_ids = [slot.id for _, _, slot in rows]
    exceptions = db.query(CourseOfferingSlotException).filter(
        CourseOfferingSlotException.slot_id.in_(slot_ids), CourseOfferingSlotException.date >= _iso(start),
        CourseOfferingSlotException.date <= _iso(end),
    ).all() if slot_ids else []
    exception_map = {(item.slot_id, item.date): item for item in exceptions}
    events: list[CalendarEvent] = []
    for template, offering, slot in rows:
        for current in _date_range(max(start, date.fromisoformat(offering.start_date)), min(end, date.fromisoformat(offering.end_date))):
            if ((current.weekday() + 1) % 7) not in slot.days_of_week:
                continue
            event = _course_event(template, offering, slot, current, exception_map.get((slot.id, _iso(current))), locale, room_names)
            if event:
                events.append(event)
    return events


def _calendar_events(db: Session, start: date, end: date, *, teacher_id: str | None = None) -> list[CalendarEvent]:
    events = _course_events(db, start, end)
    query = db.query(ScheduleBooking).filter(
        ScheduleBooking.date >= _iso(start), ScheduleBooking.date <= _iso(end), ScheduleBooking.status == "confirmed"
    )
    if teacher_id:
        query = query.filter(ScheduleBooking.teacher_id == teacher_id)
        events = [event for event in events if event.teacher_id == teacher_id]
    events.extend(_booking_event(item) for item in query.all())
    return sorted(events, key=lambda item: (item.date, item.start_time, item.room_id))


def _schedule_conflict_detail(
    db: Session, *, target_date: date, event: CalendarEvent, teacher_id: str | None,
) -> dict:
    """Build an authenticated scheduling error without exposing course details."""
    same_teacher = bool(teacher_id and event.teacher_id == teacher_id)
    room = db.query(StudioRoom).filter(StudioRoom.id == event.room_id).first()
    if same_teacher:
        profile = db.query(UserProfile).filter(UserProfile.user_id == teacher_id).first()
        return {
            "code": "teacher_conflict",
            "teacher_id": teacher_id,
            "teacher_name": (
                profile.nickname_zh or profile.first_name or ""
            ).strip() if profile else "",
            "room_id": event.room_id,
            "room_name": room.name if room else "",
            "date": _iso(target_date),
            "start_time": event.start_time,
            "end_time": event.end_time,
            "message": "The responsible teacher already has an overlapping schedule.",
        }
    return {
        "code": "room_conflict",
        "room_id": event.room_id,
        "room_name": room.name if room else "",
        "date": _iso(target_date),
        "start_time": event.start_time,
        "end_time": event.end_time,
        "message": "The room already has an overlapping schedule.",
    }


def _assert_available(
    db: Session, *, target_date: date, room_id: str, start_time: str, end_time: str,
    teacher_id: str | None, exclude_booking_id: str | None = None, exclude_plan_id: str | None = None,
    exclude_course_slot_id: str | None = None, exclude_course_slot_ids: set[str] | None = None,
):
    excluded_course_slot_ids = set(exclude_course_slot_ids or set())
    if exclude_course_slot_id:
        excluded_course_slot_ids.add(exclude_course_slot_id)
    for event in _calendar_events(db, target_date, target_date):
        if exclude_booking_id and event.id == f"booking:{exclude_booking_id}":
            continue
        if exclude_plan_id and event.id.startswith(f"fixed:{exclude_plan_id}:"):
            continue
        if any(event.id.startswith(f"course-slot:{slot_id}:") for slot_id in excluded_course_slot_ids):
            continue
        same_room = event.room_id == room_id
        same_teacher = bool(teacher_id and event.teacher_id == teacher_id)
        if (same_room or same_teacher) and _overlaps(start_time, end_time, event.start_time, event.end_time):
            # A teacher cannot lead two simultaneous classes, even where the
            # requested room is also occupied. Prefer the teacher conflict so
            # the scheduler can give the person responsible a useful answer.
            raise HTTPException(
                status_code=409,
                detail=_schedule_conflict_detail(
                    db, target_date=target_date, event=event, teacher_id=teacher_id,
                ),
            )


def _assert_public_rental_available(
    db: Session,
    *,
    room_id: str,
    dates: list[date],
    start_time: str,
    end_time: str,
    exclude_request_id: str | None = None,
):
    """Check rental availability without leaking internal event details."""
    for target_date in dates:
        for event in _calendar_events(db, target_date, target_date):
            if event.room_id == room_id and _overlaps(start_time, end_time, event.start_time, event.end_time):
                raise HTTPException(status_code=409, detail=f"Room is unavailable on {_iso(target_date)} from {start_time} to {end_time}")
        pending = db.query(ExternalRentalRequest).filter(
            ExternalRentalRequest.room_id == room_id,
            ExternalRentalRequest.status == "pending",
        ).all()
        for item in pending:
            if exclude_request_id and item.id == exclude_request_id:
                continue
            if target_date in _request_dates(item) and _overlaps(start_time, end_time, item.start_time, item.end_time):
                raise HTTPException(status_code=409, detail=f"Room is temporarily held on {_iso(target_date)} from {start_time} to {end_time}")


def _ensure_plan_available(db: Session, plan: FixedClassPlan, exclude_plan_id: str | None = None):
    start = date.fromisoformat(plan.start_date)
    end = date.fromisoformat(plan.end_date)
    for current in _date_range(start, end):
        if ((current.weekday() + 1) % 7) in _plan_days(plan):
            _assert_available(db, target_date=current, room_id=plan.room_id, start_time=plan.start_time,
                              end_time=plan.end_time, teacher_id=plan.teacher_id, exclude_plan_id=exclude_plan_id)


def _is_super(user: User) -> bool:
    return user.role == "super_admin"


def _can_manage_calendar(db: Session, user: User) -> bool:
    return has_permission(db, user, "teaching.schedules.calendar", "manage")


@router.get("/public/classes", response_model=list[CalendarEvent])
def public_classes(start: date = Query(...), end: date = Query(...), locale: str = Query("zh"), db: Session = Depends(get_db)):
    if end < start or (end - start).days > 370:
        raise HTTPException(status_code=400, detail="Use a date range up to 370 days")
    events = _course_events(db, start, end, public_only=True, locale=locale)
    room_names = {item.id: item.name for item in db.query(StudioRoom).all()}
    bookings = db.query(ScheduleBooking).filter(
        ScheduleBooking.date >= _iso(start), ScheduleBooking.date <= _iso(end),
        ScheduleBooking.status == "confirmed", ScheduleBooking.is_public.is_(True),
    ).all()
    events.extend(CalendarEvent(
        id=f"booking:{item.id}", source="booking", date=date.fromisoformat(item.date),
        room_id=item.room_id, room_name=room_names.get(item.room_id, ""),
        start_time=item.start_time, end_time=item.end_time, title=item.title,
        booking_type=item.booking_type, status="confirmed", is_public=True, description="",
    ) for item in bookings)
    return sorted(events, key=lambda item: (item.date, item.start_time, item.room_id))


@router.get("/public/rental-resources", response_model=list[PublicRentalResource])
def public_rental_resources(db: Session = Depends(get_db)):
    rows = db.query(StudioRoom, Studio).join(Studio, Studio.id == StudioRoom.studio_id).filter(
        StudioRoom.is_active.is_(True), StudioRoom.is_rentable.is_(True), Studio.is_active.is_(True)
    ).order_by(Studio.name, StudioRoom.sort_order, StudioRoom.name).all()
    return [PublicRentalResource(id=room.id, studio_id=room.studio_id, studio_name=studio.name, name=room.name) for room, studio in rows]


@router.get("/public/room-occupancy", response_model=list[RoomOccupancy])
def public_room_occupancy(start: date = Query(...), end: date = Query(...), room_id: str | None = Query(None), db: Session = Depends(get_db)):
    today = date.today()
    limit = _public_calendar_limit()
    if start < today or end > limit or end < start:
        raise HTTPException(status_code=400, detail="Public room occupancy is available from today through the next six months")
    rentable_query = db.query(StudioRoom).filter(StudioRoom.is_active.is_(True), StudioRoom.is_rentable.is_(True))
    if room_id:
        rentable_query = rentable_query.filter(StudioRoom.id == room_id)
    rooms = rentable_query.order_by(StudioRoom.sort_order, StudioRoom.name).all()
    room_ids = {room.id for room in rooms}
    names = {room.id: room.name for room in rooms}
    events = _calendar_events(db, start, end)
    return [
        RoomOccupancy(room_id=event.room_id, room_name=names[event.room_id], date=event.date, start_time=event.start_time, end_time=event.end_time)
        for event in events if event.room_id in room_ids
    ]


@router.post("/external-rental-requests", response_model=ExternalRentalRequestResponse)
def create_external_rental_request(payload: ExternalRentalRequestBody, db: Session = Depends(get_db)):
    from app.api.v1.classrooms import _verify_captcha

    _require_rentable_room(db, payload.room_id)
    _verify_captcha(payload.captcha_token, payload.captcha_answer)
    dates = _request_dates(payload)
    if not dates:
        raise HTTPException(status_code=400, detail="The request does not contain any dates")
    if dates[0] < date.today() or dates[-1] > _public_calendar_limit():
        raise HTTPException(status_code=400, detail="External rental requests must be between today and the next six months")
    if len(dates) > 370:
        raise HTTPException(status_code=400, detail="The request range is too large")
    _assert_public_rental_available(db, room_id=payload.room_id, dates=dates, start_time=payload.start_time, end_time=payload.end_time)
    data = payload.model_dump(exclude={"captcha_token", "captcha_answer"})
    data["date"] = _iso(payload.date) if payload.date else None
    data["start_date"] = _iso(payload.start_date) if payload.start_date else None
    data["end_date"] = _iso(payload.end_date) if payload.end_date else None
    data["days_of_week_json"] = json.dumps(payload.days_of_week)
    data.pop("days_of_week", None)
    data["title"] = payload.title.strip()
    data["applicant_name"] = payload.applicant_name.strip()
    data["applicant_contact"] = payload.applicant_contact.strip()
    data["notes"] = payload.notes.strip()
    item = ExternalRentalRequest(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _external_request_response(item)


@router.get("/external-rental-requests", response_model=list[ExternalRentalRequestResponse])
def list_external_rental_requests(status: str | None = Query(None), user: User = Depends(rentals_view), db: Session = Depends(get_db)):
    query = db.query(ExternalRentalRequest)
    if status:
        if status not in {"pending", "confirmed", "rejected", "cancelled"}:
            raise HTTPException(status_code=400, detail="Invalid request status")
        query = query.filter(ExternalRentalRequest.status == status)
    return [_external_request_response(item) for item in query.order_by(ExternalRentalRequest.created_at.desc()).all()]


@router.put("/external-rental-requests/{request_id}", response_model=ExternalRentalRequestResponse)
def update_external_rental_request(request_id: str, payload: ExternalRentalRequestUpdate, user: User = Depends(rentals_manage), db: Session = Depends(get_db)):
    item = db.query(ExternalRentalRequest).filter(ExternalRentalRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="External rental request not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be edited")
    _require_rentable_room(db, payload.room_id)
    dates = _request_dates(payload)
    if len(dates) > 370:
        raise HTTPException(status_code=400, detail="The request range is too large")
    _assert_public_rental_available(db, room_id=payload.room_id, dates=dates, start_time=payload.start_time, end_time=payload.end_time, exclude_request_id=item.id)
    updates = payload.model_dump(exclude={"captcha_token", "captcha_answer", "days_of_week"})
    updates["date"] = _iso(payload.date) if payload.date else None
    updates["start_date"] = _iso(payload.start_date) if payload.start_date else None
    updates["end_date"] = _iso(payload.end_date) if payload.end_date else None
    updates["days_of_week_json"] = json.dumps(payload.days_of_week)
    updates["title"] = payload.title.strip()
    updates["applicant_name"] = payload.applicant_name.strip()
    updates["applicant_contact"] = payload.applicant_contact.strip()
    updates["notes"] = payload.notes.strip()
    for key, value in updates.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return _external_request_response(item)


@router.post("/external-rental-requests/{request_id}/approve", response_model=ExternalRentalRequestResponse)
def approve_external_rental_request(request_id: str, payload: ExternalRentalReview | None = None, user: User = Depends(rentals_manage), db: Session = Depends(get_db)):
    item = db.query(ExternalRentalRequest).filter(ExternalRentalRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="External rental request not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
    _require_rentable_room(db, item.room_id)
    dates = _request_dates(item)
    if not dates:
        raise HTTPException(status_code=400, detail="The request does not contain any dates")
    _assert_public_rental_available(db, room_id=item.room_id, dates=dates, start_time=item.start_time, end_time=item.end_time, exclude_request_id=item.id)
    created: list[ScheduleBooking] = []
    try:
        for target_date in dates:
            booking = ScheduleBooking(
                room_id=item.room_id,
                teacher_id=None,
                date=_iso(target_date),
                start_time=item.start_time,
                end_time=item.end_time,
                booking_type="external_rental",
                title=item.title,
                student_name="",
                participant_count=0,
                notes=item.notes or "",
                status="confirmed",
                is_locked=False,
                is_public=False,
                external_request_id=item.id,
                created_by_id=str(user.id),
            )
            db.add(booking)
            created.append(booking)
        item.status = "confirmed"
        item.reviewed_by_id = str(user.id)
        item.reviewed_at = datetime.utcnow()
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(item)
    return _external_request_response(item)


@router.post("/external-rental-requests/{request_id}/reject", response_model=ExternalRentalRequestResponse)
def reject_external_rental_request(request_id: str, payload: ExternalRentalReview | None = None, user: User = Depends(rentals_manage), db: Session = Depends(get_db)):
    item = db.query(ExternalRentalRequest).filter(ExternalRentalRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="External rental request not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
    item.status = "rejected"
    item.reviewed_by_id = str(user.id)
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return _external_request_response(item)


@router.post("/external-rental-requests/{request_id}/cancel", response_model=ExternalRentalRequestResponse)
def cancel_external_rental_request(request_id: str, user: User = Depends(rentals_manage), db: Session = Depends(get_db)):
    item = db.query(ExternalRentalRequest).filter(ExternalRentalRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="External rental request not found")
    if item.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed requests can be cancelled")
    db.query(ScheduleBooking).filter(ScheduleBooking.external_request_id == item.id, ScheduleBooking.status == "confirmed").update({ScheduleBooking.status: "cancelled"}, synchronize_session=False)
    item.status = "cancelled"
    item.reviewed_by_id = str(user.id)
    item.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return _external_request_response(item)


@router.get("/calendar", response_model=list[CalendarEvent])
def calendar_events(start: date = Query(...), end: date = Query(...), mine: bool = False,
                    user: User = Depends(calendar_view), db: Session = Depends(get_db)):
    if end < start or (end - start).days > 62:
        raise HTTPException(status_code=400, detail="Use a date range up to 62 days")
    return _calendar_events(db, start, end, teacher_id=str(user.id) if mine and not _can_manage_calendar(db, user) else None)


@router.get("/resources", response_model=list[RoomResponse])
def list_rooms(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(StudioRoom)
    if active_only:
        query = query.join(Studio, Studio.id == StudioRoom.studio_id).filter(StudioRoom.is_active.is_(True), Studio.is_active.is_(True))
    return query.order_by(StudioRoom.sort_order, StudioRoom.name).all()


@router.get("/studios", response_model=list[StudioResponse])
def list_studios(user: User = Depends(studio_view), db: Session = Depends(get_db)):
    return db.query(Studio).order_by(Studio.name).all()


@router.post("/studios", response_model=StudioResponse)
def create_studio(payload: StudioBody, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    studio = Studio(**payload.model_dump())
    db.add(studio); db.commit(); db.refresh(studio)
    return studio


@router.put("/studios/{studio_id}", response_model=StudioResponse)
def update_studio(studio_id: str, payload: StudioBody, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    studio = db.query(Studio).filter(Studio.id == studio_id).first()
    if not studio: raise HTTPException(status_code=404, detail="Studio not found")
    studio.name, studio.is_active = payload.name, payload.is_active
    if not payload.is_active:
        # An archived studio must not leave selectable rooms behind.
        db.query(StudioRoom).filter(StudioRoom.studio_id == studio_id).update({StudioRoom.is_active: False})
    db.commit(); db.refresh(studio); return studio


@router.delete("/studios/{studio_id}")
def delete_studio(studio_id: str, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    studio = db.query(Studio).filter(Studio.id == studio_id).first()
    if not studio: raise HTTPException(status_code=404, detail="Studio not found")
    room_ids = [item.id for item in db.query(StudioRoom.id).filter(StudioRoom.studio_id == studio_id).all()]
    if room_ids and (db.query(ScheduleBooking).filter(ScheduleBooking.room_id.in_(room_ids)).count() or db.query(CourseOfferingSlot).filter(CourseOfferingSlot.room_id.in_(room_ids)).count()):
        raise HTTPException(status_code=409, detail="Studio has scheduling records and cannot be deleted")
    if room_ids:
        db.query(StudioRoom).filter(StudioRoom.id.in_(room_ids)).delete(synchronize_session=False)
    db.delete(studio); db.commit(); return {"detail": "Studio deleted"}


@router.post("/rooms", response_model=RoomResponse)
def create_room(payload: RoomBody, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    if not db.query(Studio).filter(Studio.id == payload.studio_id).first():
        raise HTTPException(status_code=400, detail="Studio not found")
    room = StudioRoom(**payload.model_dump())
    db.add(room); db.commit(); db.refresh(room)
    return room


@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: str, payload: RoomBody, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    room = db.query(StudioRoom).filter(StudioRoom.id == room_id).first()
    if not room: raise HTTPException(status_code=404, detail="Room not found")
    for key, value in payload.model_dump().items(): setattr(room, key, value)
    db.commit(); db.refresh(room); return room


@router.delete("/rooms/{room_id}")
def delete_room(room_id: str, user: User = Depends(studio_manage), db: Session = Depends(get_db)):
    room = db.query(StudioRoom).filter(StudioRoom.id == room_id).first()
    if not room: raise HTTPException(status_code=404, detail="Room not found")
    if db.query(ScheduleBooking).filter(ScheduleBooking.room_id == room_id).count() or db.query(CourseOfferingSlot).filter(CourseOfferingSlot.room_id == room_id).count():
        raise HTTPException(status_code=409, detail="Room has scheduling records and cannot be deleted")
    db.delete(room); db.commit(); return {"detail": "Room deleted"}


def _offering_response(offering: CourseOffering, db: Session) -> CourseOfferingResponse:
    slots = db.query(CourseOfferingSlot).filter(CourseOfferingSlot.offering_id == offering.id).order_by(CourseOfferingSlot.sort_order).all()
    return CourseOfferingResponse(
        id=offering.id, course_template_id=offering.course_template_id, name=offering.name,
        start_date=offering.start_date, end_date=offering.end_date, is_active=offering.is_active,
        is_public=offering.is_public,
        slots=[CourseSlotBody(teacher_id=slot.teacher_id, room_id=slot.room_id, days_of_week=slot.days_of_week, start_time=slot.start_time, end_time=slot.end_time, sort_order=slot.sort_order) for slot in slots],
        created_at=offering.created_at, updated_at=offering.updated_at,
    )


def _template_response(template: CourseTemplate, db: Session) -> CourseTemplateResponse:
    meta = _template_draft_meta(template)
    questions = meta.get("questions") if isinstance(meta.get("questions"), list) else []
    assumptions = meta.get("assumptions") if isinstance(meta.get("assumptions"), list) else []
    unresolved = _visible_draft_warnings(questions, assumptions)
    return CourseTemplateResponse(
        id=template.id, title=template.title, description=template.description or "", is_active=template.is_active,
        translations=translation_bundle(template),
        allow_unassigned_teacher=bool(template.allow_unassigned_teacher),
        allow_unassigned_room=bool(template.allow_unassigned_room),
        offering_count=db.query(CourseOffering).filter(CourseOffering.course_template_id == template.id).count(),
        is_ai_draft=bool(template.is_ai_draft),
        draft_questions=unresolved,
        draft_assumptions=[],
        unresolved_question_count=len(unresolved),
        created_at=template.created_at, updated_at=template.updated_at,
    )


def _template_draft_meta(template: CourseTemplate) -> dict:
    try:
        value = json.loads(template.ai_draft_meta_json or "{}")
    except (TypeError, ValueError):
        value = {}
    return value if isinstance(value, dict) else {}


def _save_template_draft_meta(template: CourseTemplate, meta: dict) -> None:
    template.ai_draft_meta_json = json.dumps(meta, ensure_ascii=False)


def _visible_draft_warnings(questions: list, assumptions: list) -> list[dict]:
    warnings: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for raw_issue in [*questions, *assumptions]:
        if not isinstance(raw_issue, dict) or raw_issue.get("resolved", False):
            continue
        issue = dict(raw_issue)
        field = str(issue.get("field") or "").strip()
        message = str(issue.get("message") or field).strip()
        if not message:
            continue
        key = (field, message.casefold())
        if key in seen:
            continue
        seen.add(key)
        issue["message"] = message
        issue["resolved"] = False
        warnings.append(issue)
    return warnings


def _resolve_draft_warning_fields(template: CourseTemplate, fields: set[str]) -> None:
    if not template.is_ai_draft or not fields:
        return
    meta = _template_draft_meta(template)
    changed = False
    for issue in [*(meta.get("questions") or []), *(meta.get("assumptions") or [])]:
        if isinstance(issue, dict) and str(issue.get("field") or "") in fields and not issue.get("resolved", False):
            issue["resolved"] = True
            changed = True
    if changed:
        _save_template_draft_meta(template, meta)


def _validate_offering_slots(
    db: Session,
    offering: CourseOffering,
    slots: list[CourseSlotBody],
    *,
    template_is_active: bool = True,
    allow_unassigned_teacher: bool = False,
    allow_unassigned_room: bool = False,
):
    if not offering.is_active or not template_is_active:
        return
    start, end = date.fromisoformat(offering.start_date), date.fromisoformat(offering.end_date)
    for slot in slots:
        if not slot.teacher_id and not allow_unassigned_teacher:
            raise HTTPException(status_code=409, detail="Assign a responsible teacher or enable the unassigned-teacher exception before saving")
        if not slot.room_id:
            if allow_unassigned_room:
                continue
            raise HTTPException(status_code=409, detail="Assign a room or enable the unassigned-room exception before saving")
        _require_room(db, slot.room_id)
        for current in _date_range(start, end):
            if ((current.weekday() + 1) % 7) not in slot.days_of_week:
                continue
            _assert_available(db, target_date=current, room_id=slot.room_id, start_time=slot.start_time,
                              end_time=slot.end_time, teacher_id=slot.teacher_id)


def _validate_template_activation(db: Session, template: CourseTemplate) -> None:
    if not template.title.strip() or template.title.startswith("AI Draft -"):
        raise HTTPException(status_code=409, detail="Enter the course name before enabling")
    offerings = db.query(CourseOffering).filter(
        CourseOffering.course_template_id == template.id,
        CourseOffering.is_active.is_(True),
    ).all()
    slots = [
        slot for offering in offerings
        for slot in db.query(CourseOfferingSlot).filter(CourseOfferingSlot.offering_id == offering.id).all()
    ]
    own_slot_ids = {slot.id for slot in slots}
    if not offerings:
        raise HTTPException(status_code=409, detail="Add at least one active term offering before enabling")
    for offering in offerings:
        start, end = date.fromisoformat(offering.start_date), date.fromisoformat(offering.end_date)
        offering_slots = [slot for slot in slots if slot.offering_id == offering.id]
        if not offering_slots:
            raise HTTPException(status_code=409, detail="Add at least one valid weekly slot before enabling")
        for slot in offering_slots:
            if not slot.days_of_week or len(slot.start_time or "") != 5 or len(slot.end_time or "") != 5 or slot.end_time <= slot.start_time:
                raise HTTPException(status_code=409, detail="Complete the weekly days and valid start/end times before enabling")
            if not slot.teacher_id and not template.allow_unassigned_teacher:
                raise HTTPException(status_code=409, detail="Assign a responsible teacher or enable the unassigned-teacher exception before enabling")
            if not slot.room_id:
                if template.allow_unassigned_room:
                    continue
                raise HTTPException(status_code=409, detail="Assign a room or enable the unassigned-room exception before enabling")
            _require_room(db, slot.room_id)
            for current in _date_range(start, end):
                if ((current.weekday() + 1) % 7) not in slot.days_of_week:
                    continue
                _assert_available(
                    db,
                    target_date=current,
                    room_id=slot.room_id,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                    teacher_id=slot.teacher_id,
                    exclude_course_slot_ids=own_slot_ids,
                )


@router.get("/course-templates", response_model=list[CourseTemplateResponse])
def list_course_templates(user: User = Depends(fixed_view), db: Session = Depends(get_db)):
    return [_template_response(item, db) for item in db.query(CourseTemplate).order_by(CourseTemplate.title).all()]


@router.post("/course-templates", response_model=CourseTemplateResponse)
def create_course_template(payload: CourseTemplateBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    data = payload.model_dump(); translations = data.pop("translations", None)
    item = CourseTemplate(**data); set_translation_bundle(item, translations)
    db.add(item); db.commit(); db.refresh(item); return _template_response(item, db)


@router.put("/course-templates/{template_id}", response_model=CourseTemplateResponse)
def update_course_template(template_id: str, payload: CourseTemplateBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    item = db.query(CourseTemplate).filter(CourseTemplate.id == template_id).first()
    if not item: raise HTTPException(status_code=404, detail="Course template not found")
    data = payload.model_dump(); translations = data.pop("translations", None)
    enabling = not item.is_active and bool(data.get("is_active"))
    # Keep the item inactive while validation runs. A failed check therefore
    # cannot leak an unverified course into the public schedule or calendar.
    if enabling:
        previous_allow_unassigned = item.allow_unassigned_teacher
        previous_allow_unassigned_room = item.allow_unassigned_room
        item.allow_unassigned_teacher = bool(data.get("allow_unassigned_teacher"))
        item.allow_unassigned_room = bool(data.get("allow_unassigned_room"))
        try:
            _validate_template_activation(db, item)
        except Exception:
            item.allow_unassigned_teacher = previous_allow_unassigned
            item.allow_unassigned_room = previous_allow_unassigned_room
            raise
    for key, value in data.items(): setattr(item, key, value)
    set_translation_bundle(item, translations)
    if item.title.strip() and not item.title.startswith("AI Draft -"):
        _resolve_draft_warning_fields(item, {"template.title", "title"})
    db.commit(); db.refresh(item); return _template_response(item, db)


@router.post("/course-drafts", response_model=CourseTemplateResponse)
def create_course_draft(payload: CourseDraftCreateBody, user: User = Depends(fixed_or_ai_manage), db: Session = Depends(get_db)):
    """Persist one confirmed AI import item as an inactive fixed-course template."""
    template_data = payload.template if isinstance(payload.template, dict) else {}
    offering_data = payload.offering if isinstance(payload.offering, dict) else {}
    questions = [dict(item) for item in payload.questions if isinstance(item, dict)]
    assumptions = [dict(item) for item in payload.assumptions if isinstance(item, dict)]
    title = str(template_data.get("title") or "").strip()
    if not title:
        title = "AI Draft - needs course name"
        questions.append({"id": "course-title", "field": "template.title", "message": "Course name is missing.", "blocking": True, "resolved": False})
    translations = template_data.get("translations") if isinstance(template_data.get("translations"), dict) else {}
    description = str(template_data.get("description") or "")
    try:
        start_date = date.fromisoformat(str(offering_data.get("start_date") or ""))
        end_date = date.fromisoformat(str(offering_data.get("end_date") or ""))
        if end_date < start_date:
            raise ValueError
    except ValueError:
        start_date = end_date = date.today()
        questions.append({"id": "offering-dates", "field": "date_range", "message": "Course date range is missing or invalid.", "blocking": True, "resolved": False})
    name = str(offering_data.get("name") or "").strip() or "AI draft term"

    # The only paths that enter the fixed-course importer create a disabled
    # template. No availability check is made here; that happens atomically on
    # the later master-switch activation.
    item = CourseTemplate(
        title=title,
        description=description,
        is_active=False,
        is_ai_draft=True,
        allow_unassigned_teacher=False,
        allow_unassigned_room=False,
    )
    set_translation_bundle(item, translations)
    _save_template_draft_meta(item, {
        "source": "ai",
        "contract": "fixed_course_import.v1",
        "questions": questions,
        "assumptions": assumptions,
    })
    db.add(item)
    db.flush()
    offering = CourseOffering(
        course_template_id=item.id,
        name=name,
        start_date=_iso(start_date),
        end_date=_iso(end_date),
        is_active=True,
        is_public=bool(offering_data.get("is_public", True)),
    )
    db.add(offering)
    db.flush()
    for index, raw_slot in enumerate(payload.slots):
        if not isinstance(raw_slot, dict):
            continue
        days = sorted({int(day) for day in raw_slot.get("days_of_week", []) if isinstance(day, int) and 0 <= day <= 6})
        start_time = str(raw_slot.get("start_time") or "")
        end_time = str(raw_slot.get("end_time") or "")
        if not days or len(start_time) != 5 or len(end_time) != 5 or end_time <= start_time:
            questions.append({"id": f"slot-{index}-time", "field": "time", "message": "Valid weekly days and times are required before this slot can be created.", "blocking": True, "resolved": False})
            continue
        room_id = str(raw_slot.get("room_id") or "").strip() or None
        if room_id and not db.query(StudioRoom).filter(StudioRoom.id == room_id, StudioRoom.is_active.is_(True)).first():
            room_id = None
        if not room_id:
            questions.append({"id": f"slot-{index}-room", "field": "room_id", "message": "Room is not assigned.", "blocking": True, "resolved": False})
        teacher_id = str(raw_slot.get("teacher_id") or "").strip() or None
        if teacher_id and not db.query(User).filter(User.id == teacher_id, User.is_active.is_(True)).first():
            teacher_id = None
        if not teacher_id:
            questions.append({"id": f"slot-{index}-teacher", "field": "teacher_id", "message": "Responsible teacher is not assigned.", "blocking": True, "resolved": False})
        db.add(CourseOfferingSlot(
            offering_id=offering.id,
            teacher_id=teacher_id,
            room_id=room_id,
            days_of_week_json=json.dumps(days),
            start_time=start_time,
            end_time=end_time,
            sort_order=index,
        ))
    # The slot loop can add newly-discovered questions after the initial meta
    # assignment, so write the final metadata before commit.
    _save_template_draft_meta(item, {
        "source": "ai",
        "contract": "fixed_course_import.v1",
        "questions": questions,
        "assumptions": assumptions,
    })
    db.commit(); db.refresh(item)
    return _template_response(item, db)


@router.delete("/course-templates/{template_id}")
def delete_course_template(template_id: str, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    item = db.query(CourseTemplate).filter(CourseTemplate.id == template_id).first()
    if not item: raise HTTPException(status_code=404, detail="Course template not found")
    db.delete(item); db.commit(); return {"detail": "Course template deleted"}


@router.get("/course-templates/{template_id}/offerings", response_model=list[CourseOfferingResponse])
def list_course_offerings(template_id: str, user: User = Depends(fixed_view), db: Session = Depends(get_db)):
    return [_offering_response(item, db) for item in db.query(CourseOffering).filter(CourseOffering.course_template_id == template_id).order_by(CourseOffering.start_date.desc()).all()]


@router.post("/course-templates/{template_id}/offerings", response_model=CourseOfferingResponse)
def create_course_offering(template_id: str, payload: CourseOfferingBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    template = db.query(CourseTemplate).filter(CourseTemplate.id == template_id).first()
    if not template: raise HTTPException(status_code=404, detail="Course template not found")
    offering = CourseOffering(course_template_id=template_id, name=payload.name, start_date=_iso(payload.start_date), end_date=_iso(payload.end_date), is_active=payload.is_active, is_public=payload.is_public)
    _validate_offering_slots(
        db, offering, payload.slots,
        template_is_active=bool(template.is_active),
        allow_unassigned_teacher=bool(template.allow_unassigned_teacher),
        allow_unassigned_room=bool(template.allow_unassigned_room),
    )
    db.add(offering); db.flush()
    for slot in payload.slots:
        db.add(CourseOfferingSlot(offering_id=offering.id, teacher_id=slot.teacher_id, room_id=slot.room_id or None, days_of_week_json=__import__("json").dumps(slot.days_of_week), start_time=slot.start_time, end_time=slot.end_time, sort_order=slot.sort_order))
    completed_fields = {"date_range", "time", "days_of_week"}
    if payload.slots and all(slot.room_id for slot in payload.slots): completed_fields.add("room_id")
    if payload.slots and all(slot.teacher_id for slot in payload.slots): completed_fields.add("teacher_id")
    _resolve_draft_warning_fields(template, completed_fields)
    db.commit(); db.refresh(offering); return _offering_response(offering, db)


@router.put("/course-offerings/{offering_id}", response_model=CourseOfferingResponse)
def update_course_offering(offering_id: str, payload: CourseOfferingBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    offering = db.query(CourseOffering).filter(CourseOffering.id == offering_id).first()
    if not offering: raise HTTPException(status_code=404, detail="Course offering not found")
    offering.name, offering.start_date, offering.end_date = payload.name, _iso(payload.start_date), _iso(payload.end_date)
    offering.is_active, offering.is_public = payload.is_active, payload.is_public
    db.query(CourseOfferingSlot).filter(CourseOfferingSlot.offering_id == offering_id).delete()
    db.flush()
    template = db.query(CourseTemplate).filter(CourseTemplate.id == offering.course_template_id).first()
    _validate_offering_slots(
        db, offering, payload.slots,
        template_is_active=bool(template and template.is_active),
        allow_unassigned_teacher=bool(template and template.allow_unassigned_teacher),
        allow_unassigned_room=bool(template and template.allow_unassigned_room),
    )
    for slot in payload.slots:
        db.add(CourseOfferingSlot(offering_id=offering_id, teacher_id=slot.teacher_id, room_id=slot.room_id or None, days_of_week_json=__import__("json").dumps(slot.days_of_week), start_time=slot.start_time, end_time=slot.end_time, sort_order=slot.sort_order))
    if template:
        completed_fields = {"date_range", "time", "days_of_week"}
        if payload.slots and all(slot.room_id for slot in payload.slots): completed_fields.add("room_id")
        if payload.slots and all(slot.teacher_id for slot in payload.slots): completed_fields.add("teacher_id")
        _resolve_draft_warning_fields(template, completed_fields)
    db.commit(); db.refresh(offering); return _offering_response(offering, db)


@router.delete("/course-offerings/{offering_id}")
def delete_course_offering(offering_id: str, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    item = db.query(CourseOffering).filter(CourseOffering.id == offering_id).first()
    if not item: raise HTTPException(status_code=404, detail="Course offering not found")
    db.delete(item); db.commit(); return {"detail": "Course offering deleted"}


@router.post("/course-slots/{slot_id}/exceptions", response_model=CourseSlotExceptionResponse)
def create_course_slot_exception(slot_id: str, payload: CourseSlotExceptionBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    slot = db.query(CourseOfferingSlot).filter(CourseOfferingSlot.id == slot_id).first()
    if not slot: raise HTTPException(status_code=404, detail="Course slot not found")
    if payload.kind == "replace":
        if not payload.room_id or not payload.start_time or not payload.end_time or payload.end_time <= payload.start_time:
            raise HTTPException(status_code=400, detail="Replacement needs room and valid time")
        _require_room(db, payload.room_id)
        _assert_available(db, target_date=payload.date, room_id=payload.room_id, start_time=payload.start_time, end_time=payload.end_time, teacher_id=slot.teacher_id, exclude_course_slot_id=slot.id)
    item = CourseOfferingSlotException(slot_id=slot_id, **{**payload.model_dump(), "date": _iso(payload.date)})
    db.add(item); db.commit(); db.refresh(item); return item


@router.delete("/course-slot-exceptions/{exception_id}")
def delete_course_slot_exception(exception_id: str, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    item = db.query(CourseOfferingSlotException).filter(CourseOfferingSlotException.id == exception_id).first()
    if not item: raise HTTPException(status_code=404, detail="Course slot exception not found")
    db.delete(item); db.commit(); return {"detail": "Course slot exception deleted"}


@router.get("/fixed-plans", response_model=list[FixedPlanResponse])
def list_fixed_plans(user: User = Depends(fixed_view), db: Session = Depends(get_db)):
    return db.query(FixedClassPlan).order_by(FixedClassPlan.start_date, FixedClassPlan.day_of_week, FixedClassPlan.start_time).all()


@router.post("/fixed-plans", response_model=FixedPlanResponse)
def create_fixed_plan(payload: FixedPlanBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    _require_room(db, payload.room_id)
    data = payload.model_dump(); translations = data.pop("translations", None); days = data.pop("days_of_week", [])
    data["days_of_week_json"] = __import__("json").dumps(days)
    plan = FixedClassPlan(**{**data, "start_date": _iso(payload.start_date), "end_date": _iso(payload.end_date)})
    set_translation_bundle(plan, translations)
    _ensure_plan_available(db, plan)
    db.add(plan); db.commit(); db.refresh(plan); return plan


@router.put("/fixed-plans/{plan_id}", response_model=FixedPlanResponse)
def update_fixed_plan(plan_id: str, payload: FixedPlanBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    plan = db.query(FixedClassPlan).filter(FixedClassPlan.id == plan_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Fixed plan not found")
    _require_room(db, payload.room_id)
    updates = {**payload.model_dump(), "start_date": _iso(payload.start_date), "end_date": _iso(payload.end_date)}
    translations = updates.pop("translations", None)
    days = updates.pop("days_of_week", [])
    updates["days_of_week_json"] = __import__("json").dumps(days)
    for key, value in updates.items(): setattr(plan, key, value)
    set_translation_bundle(plan, translations)
    if plan.is_active: _ensure_plan_available(db, plan, exclude_plan_id=plan.id)
    db.commit(); db.refresh(plan); return plan


@router.delete("/fixed-plans/{plan_id}")
def delete_fixed_plan(plan_id: str, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    plan = db.query(FixedClassPlan).filter(FixedClassPlan.id == plan_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Fixed plan not found")
    db.delete(plan); db.commit(); return {"detail": "Fixed plan deleted"}


@router.get("/fixed-plans/{plan_id}/exceptions", response_model=list[FixedExceptionResponse])
def list_exceptions(plan_id: str, user: User = Depends(fixed_view), db: Session = Depends(get_db)):
    return db.query(FixedClassException).filter(FixedClassException.plan_id == plan_id).order_by(FixedClassException.date).all()


@router.post("/fixed-plans/{plan_id}/exceptions", response_model=FixedExceptionResponse)
def create_exception(plan_id: str, payload: FixedExceptionBody, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    plan = db.query(FixedClassPlan).filter(FixedClassPlan.id == plan_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Fixed plan not found")
    if payload.kind == "replace":
        if not payload.room_id or not payload.start_time or not payload.end_time or payload.end_time <= payload.start_time:
            raise HTTPException(status_code=400, detail="Replacement needs room and valid time")
        _require_room(db, payload.room_id)
        _assert_available(db, target_date=payload.date, room_id=payload.room_id, start_time=payload.start_time,
                          end_time=payload.end_time, teacher_id=plan.teacher_id, exclude_plan_id=plan.id)
    item = FixedClassException(plan_id=plan_id, **{**payload.model_dump(), "date": _iso(payload.date)})
    db.add(item); db.commit(); db.refresh(item); return item


@router.delete("/exceptions/{exception_id}")
def delete_exception(exception_id: str, user: User = Depends(fixed_manage), db: Session = Depends(get_db)):
    item = db.query(FixedClassException).filter(FixedClassException.id == exception_id).first()
    if not item: raise HTTPException(status_code=404, detail="Exception not found")
    db.delete(item); db.commit(); return {"detail": "Exception deleted"}


@router.get("/bookings", response_model=list[BookingResponse])
def list_bookings(start: date = Query(...), end: date = Query(...), mine: bool = False,
                  user: User = Depends(bookings_view), db: Session = Depends(get_db)):
    query = db.query(ScheduleBooking).filter(ScheduleBooking.date >= _iso(start), ScheduleBooking.date <= _iso(end))
    if not _can_manage_calendar(db, user):
        query = query.filter(ScheduleBooking.teacher_id == user.id)
    elif mine:
        query = query.filter(ScheduleBooking.teacher_id == user.id)
    return query.order_by(ScheduleBooking.date, ScheduleBooking.start_time).all()


@router.post("/bookings", response_model=BookingResponse)
def create_booking(payload: BookingBody, user: User = Depends(bookings_manage), db: Session = Depends(get_db)):
    is_admin = _can_manage_calendar(db, user)
    if not is_admin and payload.booking_type in ("external_rental", "room_lock"):
        raise HTTPException(status_code=403, detail="Only administrators can create this booking type")
    _require_room(db, payload.room_id)
    teacher_id = payload.teacher_id if is_admin else str(user.id)
    # Teacher-created bookings always require a second confirmation. External
    # rentals remain pending even when submitted by an administrator.
    status = "pending" if (not is_admin or payload.booking_type == "external_rental") else "confirmed"
    if status == "confirmed":
        _assert_available(db, target_date=payload.date, room_id=payload.room_id, start_time=payload.start_time,
                          end_time=payload.end_time, teacher_id=teacher_id)
    booking = ScheduleBooking(**{**payload.model_dump(), "date": _iso(payload.date), "teacher_id": teacher_id,
                                 "status": status, "created_by_id": str(user.id)})
    db.add(booking); db.commit(); db.refresh(booking); return booking


@router.put("/bookings/batch", response_model=list[BookingResponse])
def batch_update_bookings(payload: BookingBatchUpdate, user: User = Depends(calendar_manage), db: Session = Depends(get_db)):
    """Apply a same-day adjustment atomically, allowing room/time swaps within the batch."""
    ids = [item.id for item in payload.items]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Each booking can only appear once")
    bookings = db.query(ScheduleBooking).filter(ScheduleBooking.id.in_(ids)).all()
    booking_map = {item.id: item for item in bookings}
    if len(booking_map) != len(ids):
        raise HTTPException(status_code=404, detail="One or more bookings were not found")
    if any(item.status != "confirmed" for item in bookings):
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be adjusted in a batch")

    candidates = []
    for item in payload.items:
        candidate = item.booking
        _require_room(db, candidate.room_id)
        for event in _calendar_events(db, candidate.date, candidate.date):
            if event.id.startswith("booking:") and event.id.removeprefix("booking:") in booking_map:
                continue
            same_room = event.room_id == candidate.room_id
            same_teacher = bool(candidate.teacher_id and event.teacher_id == candidate.teacher_id)
            if (same_room or same_teacher) and _overlaps(candidate.start_time, candidate.end_time, event.start_time, event.end_time):
                raise HTTPException(
                    status_code=409,
                    detail=_schedule_conflict_detail(
                        db, target_date=candidate.date, event=event, teacher_id=candidate.teacher_id,
                    ),
                )
        for other in candidates:
            same_room = other.room_id == candidate.room_id
            same_teacher = bool(candidate.teacher_id and other.teacher_id == candidate.teacher_id)
            if other.date == candidate.date and (same_room or same_teacher) and _overlaps(candidate.start_time, candidate.end_time, other.start_time, other.end_time):
                raise HTTPException(
                    status_code=409,
                    detail=_schedule_conflict_detail(
                        db, target_date=candidate.date, event=other, teacher_id=candidate.teacher_id,
                    ),
                )
        candidates.append(candidate)

    for item in payload.items:
        booking = booking_map[item.id]
        data = item.booking.model_dump()
        data["date"] = _iso(item.booking.date)
        for key, value in data.items():
            setattr(booking, key, value)
    db.commit()
    for booking in bookings:
        db.refresh(booking)
    return bookings


@router.put("/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: str, payload: BookingUpdate, user: User = Depends(bookings_manage), db: Session = Depends(get_db)):
    booking = db.query(ScheduleBooking).filter(ScheduleBooking.id == booking_id).first()
    if not booking: raise HTTPException(status_code=404, detail="Booking not found")
    is_admin = _can_manage_calendar(db, user)
    if not is_admin and booking.teacher_id != user.id: raise HTTPException(status_code=403, detail="You can only edit your own bookings")
    if not is_admin and booking.is_locked: raise HTTPException(status_code=403, detail="This booking is locked; request coordination")
    data = payload.model_dump(exclude={"status", "is_locked"})
    if not is_admin: data["teacher_id"] = str(user.id)
    data["date"] = _iso(payload.date)
    for key, value in data.items(): setattr(booking, key, value)
    if is_admin and payload.status is not None: booking.status = payload.status
    if is_admin and payload.is_locked is not None: booking.is_locked = payload.is_locked
    if booking.status == "confirmed":
        _assert_available(db, target_date=payload.date, room_id=booking.room_id, start_time=booking.start_time,
                          end_time=booking.end_time, teacher_id=booking.teacher_id, exclude_booking_id=booking.id)
    db.commit(); db.refresh(booking); return booking


@router.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: str, user: User = Depends(bookings_manage), db: Session = Depends(get_db)):
    booking = db.query(ScheduleBooking).filter(ScheduleBooking.id == booking_id).first()
    if not booking: raise HTTPException(status_code=404, detail="Booking not found")
    if not _can_manage_calendar(db, user) and (booking.teacher_id != user.id or booking.is_locked):
        raise HTTPException(status_code=403, detail="This booking cannot be cancelled directly")
    booking.status = "cancelled"; db.commit(); return {"detail": "Booking cancelled"}


@router.post("/coordination-requests", response_model=CoordinationRequestResponse)
def create_coordination_request(payload: CoordinationRequestBody, user: User = Depends(bookings_manage), db: Session = Depends(get_db)):
    if payload.requested_end_time <= payload.requested_start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    item = ScheduleCoordinationRequest(**{**payload.model_dump(), "requested_date": _iso(payload.requested_date), "requested_by_id": str(user.id)})
    db.add(item); db.commit(); db.refresh(item); return item


@router.get("/coordination-requests", response_model=list[CoordinationRequestResponse])
def list_coordination_requests(user: User = Depends(bookings_view), db: Session = Depends(get_db)):
    query = db.query(ScheduleCoordinationRequest)
    if not _can_manage_calendar(db, user): query = query.filter(ScheduleCoordinationRequest.requested_by_id == user.id)
    return query.order_by(ScheduleCoordinationRequest.created_at.desc()).all()


@router.put("/coordination-requests/{request_id}", response_model=CoordinationRequestResponse)
def resolve_coordination_request(request_id: str, payload: CoordinationResolution, user: User = Depends(calendar_manage), db: Session = Depends(get_db)):
    item = db.query(ScheduleCoordinationRequest).filter(ScheduleCoordinationRequest.id == request_id).first()
    if not item: raise HTTPException(status_code=404, detail="Request not found")
    item.status = payload.status; item.resolution_note = payload.resolution_note; item.resolved_by_id = str(user.id)
    db.commit(); db.refresh(item); return item


@router.post("/bookings/{booking_id}/swap/{other_booking_id}")
def swap_booking_rooms(booking_id: str, other_booking_id: str, user: User = Depends(calendar_manage), db: Session = Depends(get_db)):
    first = db.query(ScheduleBooking).filter(ScheduleBooking.id == booking_id).first()
    second = db.query(ScheduleBooking).filter(ScheduleBooking.id == other_booking_id).first()
    if not first or not second: raise HTTPException(status_code=404, detail="Booking not found")
    if first.date != second.date or first.start_time != second.start_time or first.end_time != second.end_time:
        raise HTTPException(status_code=400, detail="Only bookings with the same date and time can swap rooms")
    first.room_id, second.room_id = second.room_id, first.room_id
    db.commit(); return {"detail": "Rooms swapped"}
