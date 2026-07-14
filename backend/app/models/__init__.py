from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Numeric, UniqueConstraint
from sqlalchemy.sql import func
import uuid
import enum
import json

from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    STUDENT = "student"
    PARENT = "parent"
    ALUMNI = "alumni"
    PUBLIC = "public"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="public")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    nickname_zh = Column(String(100))
    nickname_en = Column(String(100))
    nickname_fr = Column(String(100))
    avatar_url = Column(String(500))
    phone = Column(String(20))
    date_of_birth = Column(DateTime)
    address = Column(Text)
    emergency_contact = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Program(Base):
    __tablename__ = "programs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    level = Column(String(100))
    syllabus_ref = Column(String(200))
    cover_image = Column(String(1000))
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    translations_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgramModule(Base):
    __tablename__ = "program_modules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)


class ClassSchedule(Base):
    __tablename__ = "class_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    instructor_id = Column(String(36), ForeignKey("users.id"))
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(200))
    max_capacity = Column(Integer)
    is_active = Column(Boolean, default=True)
    academic_year = Column(String(9))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    class_schedule_id = Column(String(36), ForeignKey("class_schedules.id"), nullable=False)
    academic_year = Column(String(9), nullable=False)
    status = Column(String(50), default="enrolled")
    payment_status = Column(String(50), default="pending")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())


class Performance(Base):
    __tablename__ = "performances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(200), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    venue = Column(String(200))
    cover_image = Column(String(500))
    is_current = Column(Boolean, default=False)
    translations_json = Column(Text)
    related_article_ids = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_key = Column(String(120), nullable=False)
    can_view = Column(Boolean, nullable=False, default=False)
    can_manage = Column(Boolean, nullable=False, default=False)
    updated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint("user_id", "permission_key", name="uq_user_permission_key"),)


class PermissionAuditLog(Base):
    __tablename__ = "permission_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    target_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    before_json = Column(Text, nullable=False, default="{}")
    after_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PermissionPreset(Base):
    __tablename__ = "permission_presets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False, default="")
    permissions_json = Column(Text, nullable=False, default="[]")
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PerformanceCast(Base):
    __tablename__ = "performance_cast"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    performance_id = Column(String(36), ForeignKey("performances.id"), nullable=False)
    dancer_id = Column(String(36), ForeignKey("users.id"))
    role = Column(String(200))


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(200), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(200))
    event_type = Column(String(50))
    cover_image = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"))
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="registered")


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(200), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    summary = Column(Text)
    body = Column(Text)
    author_id = Column(String(36), ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True))
    cover_image = Column(String(500))
    is_published = Column(Boolean, default=False)
    locale = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GalleryAlbum(Base):
    __tablename__ = "gallery_albums"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    album_id = Column(String(36), ForeignKey("gallery_albums.id"), nullable=False)
    url = Column(String(500), nullable=False)
    caption = Column(String(300))
    order_index = Column(Integer, default=0)


class Donation(Base):
    __tablename__ = "donations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    frequency = Column(String(20), default="one-time")
    payment_intent_id = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    quote = Column(Text, nullable=False)
    image_url = Column(String(500))
    program_affiliation = Column(String(200))
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject = Column(String(300), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(50), nullable=False)
    reference_id = Column(String(36))
    status = Column(String(50), default="pending")
    stripe_payment_id = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VenueSpace(Base):
    __tablename__ = "venue_spaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    capacity = Column(Integer)
    amenities = Column(Text)
    hourly_rate = Column(Float)
    is_active = Column(Boolean, default=True)


class VenueBooking(Base):
    __tablename__ = "venue_bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    venue_id = Column(String(36), ForeignKey("venue_spaces.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"))
    booking_date = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending")


class RegistrationSettings(Base):
    __tablename__ = "registration_settings"

    id = Column(Integer, primary_key=True, default=1)
    registration_url = Column(String(1000), default="")
    summer_camp_registration_url = Column(String(1000), default="")
    summer_camp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    site_name = Column(String(200), default="Mulan Dance Studio")
    logo_url = Column(String(1000), default="/logo.png")
    header_cta_label = Column(String(100), default="Register")
    header_cta_href = Column(String(1000), default="/classes/register")
    show_admin_login = Column(Boolean, default=True)
    announcement_enabled = Column(Boolean, default=False)
    announcement_text = Column(String(500), default="")
    announcement_href = Column(String(1000), default="")
    footer_description = Column(Text)
    footer_newsletter_title = Column(String(200), default="Join Us")
    footer_newsletter_text = Column(Text)
    copyright_text = Column(String(500), default="All rights reserved.")
    privacy_href = Column(String(1000), default="/privacy")
    contact_email = Column(String(255), default="info@mulandance.com")
    contact_phone = Column(String(100), default="3437771766")
    contact_address = Column(Text)
    outbound_email = Column(String(255), default="")
    classroom_request_limit_per_contact = Column(Integer, default=0)
    program_pricing_json = Column(Text)
    classroom_pricing_json = Column(Text)
    youtube_url = Column(String(1000), default="https://www.youtube.com/@mulandancestudio21")
    xiaohongshu_url = Column(String(1000), default="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476")
    instagram_url = Column(String(1000), default="")
    facebook_url = Column(String(1000), default="")
    tiktok_url = Column(String(1000), default="")
    homepage_json = Column(Text)
    homepage_draft_json = Column(Text)
    homepage_published_at = Column(DateTime(timezone=True))
    site_draft_json = Column(Text)
    site_published_at = Column(DateTime(timezone=True))
    translations_json = Column(Text)
    ai_enabled = Column(Boolean, default=False)
    ai_thinking_enabled = Column(Boolean, default=False)
    ai_image_enabled = Column(Boolean, default=False)
    ai_provider = Column(String(100), default="openai_compatible")
    ai_api_base_url = Column(String(1000), default="https://api.openai.com/v1")
    ai_api_key = Column(Text, default="")
    ai_model = Column(String(200), default="")
    ai_timeout_seconds = Column(Integer, default=600)
    ai_feature_models_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FacultyMember(Base):
    __tablename__ = "faculty_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True, index=True)
    name = Column(String(200), nullable=False)
    role = Column(String(200))
    bio = Column(Text)
    photo_url = Column(String(1000))
    specialties = Column(Text)
    achievements = Column(Text)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    translations_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ClassroomBooking(Base):
    __tablename__ = "classroom_bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room = Column(String(20), nullable=False)  # large or small
    booking_type = Column(String(20), nullable=False, default="internal")  # internal or external
    status = Column(String(20), nullable=False, default="confirmed")  # pending, confirmed, rejected
    title = Column(String(200), nullable=False)
    teacher_name = Column(String(100))
    applicant_name = Column(String(100))
    applicant_contact = Column(String(100))
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    notes = Column(Text)
    translations_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CourseScheduleItem(Base):
    __tablename__ = "course_schedule_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    day_of_week = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    description = Column(Text)
    location = Column(String(300), nullable=False)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    translations_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SchoolPolicy(Base):
    __tablename__ = "school_policies"

    id = Column(Integer, primary_key=True, default=1)
    title = Column(String(200), default="学校规章制度及退费规则")
    body_markdown = Column(Text, default="")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(36))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============================================================
# Blog/CMS Models
# ============================================================

class NewsCategory(Base):
    __tablename__ = "news_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_zh = Column(String(100))
    description = Column(Text)
    color = Column(String(7), default="#6366f1")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NewsTag(Base):
    __tablename__ = "news_tags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_zh = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NewsArticleCategory(Base):
    __tablename__ = "news_article_categories"

    article_id = Column(String(36), ForeignKey("news_articles.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(String(36), ForeignKey("news_categories.id", ondelete="CASCADE"), primary_key=True)


class NewsArticleTag(Base):
    __tablename__ = "news_article_tags"

    article_id = Column(String(36), ForeignKey("news_articles.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String(36), ForeignKey("news_tags.id", ondelete="CASCADE"), primary_key=True)


# ============================================================
# Article Group & Translation Models
# ============================================================

class ArticleGroup(Base):
    """Shared container for article translations. Categories/tags belong here."""
    __tablename__ = "article_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shared_slug = Column(String(200), unique=True, nullable=False, index=True)
    source_url = Column(String(1200), index=True)
    show_on_homepage = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ============================================================
# Unified scheduling (fixed public classes + internal bookings)
# ============================================================

class CourseTemplate(Base):
    __tablename__ = "course_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True, nullable=False)
    translations_json = Column(Text)
    is_ai_draft = Column(Boolean, default=False, nullable=False)
    ai_draft_meta_json = Column(Text)
    allow_unassigned_teacher = Column(Boolean, default=False, nullable=False)
    allow_unassigned_room = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def translations(self):
        try:
            value = json.loads(self.translations_json or "{}")
            return value if isinstance(value, dict) else {}
        except (TypeError, ValueError):
            return {}


class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_template_id = Column(String(36), ForeignKey("course_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    start_date = Column(String(10), nullable=False, index=True)
    end_date = Column(String(10), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CourseOfferingSlot(Base):
    __tablename__ = "course_offering_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    offering_id = Column(String(36), ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=True, index=True)
    days_of_week_json = Column(Text, default="[]")
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def days_of_week(self):
        try:
            value = json.loads(self.days_of_week_json or "[]")
            return [int(day) for day in value if 0 <= int(day) <= 6]
        except (TypeError, ValueError):
            return []


class CourseOfferingSlotException(Base):
    __tablename__ = "course_offering_slot_exceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slot_id = Column(String(36), ForeignKey("course_offering_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)
    kind = Column(String(20), nullable=False, default="cancel")
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=True)
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Studio(Base):
    __tablename__ = "studios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(160), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudioRoom(Base):
    __tablename__ = "studio_rooms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    studio_id = Column(String(36), ForeignKey("studios.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_rentable = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FixedClassPlan(Base):
    __tablename__ = "fixed_class_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)
    days_of_week_json = Column(Text, default="[]")
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    start_date = Column(String(10), nullable=False, index=True)
    end_date = Column(String(10), nullable=False, index=True)
    is_public = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    translations_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def translations(self):
        try:
            value = json.loads(self.translations_json or "{}")
            return value if isinstance(value, dict) else {}
        except (TypeError, ValueError):
            return {}

    @property
    def days_of_week(self):
        try:
            values = json.loads(self.days_of_week_json or "[]")
            return values if isinstance(values, list) and values else [self.day_of_week]
        except (TypeError, ValueError):
            return [self.day_of_week]


class FixedClassException(Base):
    __tablename__ = "fixed_class_exceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(36), ForeignKey("fixed_class_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)
    kind = Column(String(20), nullable=False, default="cancel")  # cancel or replace
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=True)
    start_time = Column(String(5), nullable=True)
    end_time = Column(String(5), nullable=True)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScheduleBooking(Base):
    __tablename__ = "schedule_bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    date = Column(String(10), nullable=False, index=True)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    booking_type = Column(String(30), nullable=False)
    title = Column(String(200), nullable=False)
    student_name = Column(String(200), default="")
    participant_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, default="")
    status = Column(String(20), nullable=False, default="confirmed")  # pending, confirmed, rejected, cancelled
    is_locked = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    external_request_id = Column(String(36), ForeignKey("external_rental_requests.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ExternalRentalRequest(Base):
    __tablename__ = "external_rental_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="RESTRICT"), nullable=False, index=True)
    request_mode = Column(String(20), nullable=False, default="single")
    date = Column(String(10), nullable=True, index=True)
    start_date = Column(String(10), nullable=True, index=True)
    end_date = Column(String(10), nullable=True, index=True)
    days_of_week_json = Column(Text, default="[]", nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    title = Column(String(200), nullable=False)
    applicant_name = Column(String(160), nullable=False)
    applicant_contact = Column(String(200), nullable=False)
    notes = Column(Text, default="")
    status = Column(String(20), nullable=False, default="pending", index=True)
    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def days_of_week(self):
        try:
            value = json.loads(self.days_of_week_json or "[]")
            return [int(day) for day in value if 0 <= int(day) <= 6]
        except (TypeError, ValueError):
            return []


class ScheduleCoordinationRequest(Base):
    __tablename__ = "schedule_coordination_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requested_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(String(36), ForeignKey("schedule_bookings.id", ondelete="SET NULL"), nullable=True)
    requested_date = Column(String(10), nullable=False)
    requested_room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="SET NULL"), nullable=True)
    requested_start_time = Column(String(5), nullable=False)
    requested_end_time = Column(String(5), nullable=False)
    message = Column(Text, default="")
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    resolved_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_note = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ArticleGroupCategory(Base):
    __tablename__ = "article_group_categories"

    group_id = Column(String(36), ForeignKey("article_groups.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(String(36), ForeignKey("news_categories.id", ondelete="CASCADE"), primary_key=True)


class ArticleGroupTag(Base):
    __tablename__ = "article_group_tags"

    group_id = Column(String(36), ForeignKey("article_groups.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String(36), ForeignKey("news_tags.id", ondelete="CASCADE"), primary_key=True)


class ArticleTranslation(Base):
    """Locale-specific article content. One ArticleGroup can have EN and ZH versions."""
    __tablename__ = "article_translations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("article_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    locale = Column(String(10), nullable=False, default="en")  # "en" or "zh"
    slug = Column(String(200), nullable=False)  # locale-specific slug
    title = Column(String(300), nullable=False)
    summary = Column(Text)
    body = Column(Text)
    author_id = Column(String(36), ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True))
    cover_image = Column(String(500))
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    class Config:
        pass


class PricingCatalog(Base):
    __tablename__ = "pricing_catalogs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kind = Column(String(20), nullable=False, unique=True, index=True)  # program, rental
    title = Column(String(240), nullable=False, default="")
    subtitle = Column(Text, default="")
    translations_json = Column(Text, default="{}")
    published_json = Column(Text, default="")
    is_dirty = Column(Boolean, nullable=False, default=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PricingPlan(Base):
    __tablename__ = "pricing_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    catalog_id = Column(String(36), ForeignKey("pricing_catalogs.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(String(36), ForeignKey("programs.id", ondelete="SET NULL"), nullable=True, index=True)
    room_id = Column(String(36), ForeignKey("studio_rooms.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(240), nullable=False, default="")
    description = Column(Text, default="")
    badge = Column(String(120), default="")
    image_url = Column(String(1000), default="")
    details_json = Column(Text, default="[]")
    translations_json = Column(Text, default="{}")
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PricingOption(Base):
    __tablename__ = "pricing_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(36), ForeignKey("pricing_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(180), nullable=False, default="")
    amount = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="CAD")
    unit = Column(String(120), default="")
    note = Column(Text, default="")
    translations_json = Column(Text, default="{}")
    sort_order = Column(Integer, nullable=False, default=0)


class PricingContentBlock(Base):
    __tablename__ = "pricing_content_blocks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    catalog_id = Column(String(36), ForeignKey("pricing_catalogs.id", ondelete="CASCADE"), nullable=False, index=True)
    block_type = Column(String(40), nullable=False, default="info")
    title = Column(String(240), nullable=False, default="")
    body = Column(Text, default="")
    items_json = Column(Text, default="[]")
    translations_json = Column(Text, default="{}")
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
