from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    EDITOR = "editor"
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FacultyMember(Base):
    __tablename__ = "faculty_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    role = Column(String(200))
    bio = Column(Text)
    photo_url = Column(String(1000))
    specialties = Column(Text)
    achievements = Column(Text)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
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
