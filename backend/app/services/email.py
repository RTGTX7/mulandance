import logging
import re
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings
from app.models import ClassroomBooking

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(?:\.[\w-]+)+")

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
ROOM_LABELS = {
    "large": "Large Classroom / \u5927\u6559\u5ba4",
    "small": "Small Classroom / \u5c0f\u6559\u5ba4",
}


def extract_email(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    match = EMAIL_RE.search(value)
    return match.group(0) if match else None


def email_enabled(from_email: Optional[str] = None) -> bool:
    sender = from_email or settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    return bool(settings.SMTP_HOST and sender)


def send_email(to_email: str, subject: str, body: str, from_email: Optional[str] = None) -> bool:
    sender = from_email or settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    if not email_enabled(sender):
        logger.info("SMTP is not configured; skipping email to %s", to_email)
        return False

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


def classroom_booking_receipt_body(booking: ClassroomBooking) -> str:
    weekday = WEEKDAYS[booking.day_of_week] if 0 <= booking.day_of_week < len(WEEKDAYS) else str(booking.day_of_week)
    room = ROOM_LABELS.get(booking.room, booking.room)

    return f"""Your classroom rental request has been received.
\u60a8\u7684\u6559\u5ba4\u79df\u501f\u7533\u8bf7\u5df2\u63d0\u4ea4\u3002

Status / \u72b6\u6001: Pending review / \u5f85\u5ba1\u6838

Request details / \u7533\u8bf7\u5185\u5bb9
- Classroom / \u6559\u5ba4: {room}
- Weekday / \u661f\u671f: {weekday}
- Time / \u65f6\u95f4: {booking.start_time} - {booking.end_time}
- Purpose / \u7528\u9014: {booking.title}
- Applicant / \u7533\u8bf7\u4eba: {booking.applicant_name or "-"}
- Contact / \u8054\u7cfb\u65b9\u5f0f: {booking.applicant_contact or "-"}
- Notes / \u5907\u6ce8: {booking.notes or "-"}

After an administrator confirms the request, this time slot will appear on the public calendar.
\u7ba1\u7406\u5458\u786e\u8ba4\u540e\uff0c\u8be5\u65f6\u6bb5\u4f1a\u663e\u793a\u5728\u516c\u5f00\u65e5\u5386\u4e2d\u3002

Mulan Dance Studio
"""


def send_classroom_booking_receipt(booking: ClassroomBooking, from_email: Optional[str] = None) -> bool:
    to_email = extract_email(booking.applicant_contact)
    if not to_email:
        return False

    subject = "Mulan Dance Studio - Classroom rental request received"
    return send_email(to_email, subject, classroom_booking_receipt_body(booking), from_email=from_email)
