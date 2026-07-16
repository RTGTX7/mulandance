from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, UserPermission

PermissionAction = Literal["view", "manage"]


@dataclass(frozen=True)
class PermissionDefinition:
    key: str
    group: str
    parent: str | None = None
    label_key: str = ""


PERMISSION_DEFINITIONS = (
    PermissionDefinition("content", "content", label_key="permissions.content"),
    PermissionDefinition("content.homepage", "content", "content", "permissions.homepage"),
    PermissionDefinition("content.news", "content", "content", "permissions.news"),
    PermissionDefinition("content.news.articles", "content", "content.news", "permissions.newsArticles"),
    PermissionDefinition("content.news.categories", "content", "content.news", "permissions.categories"),
    PermissionDefinition("content.news.tags", "content", "content.news", "permissions.tags"),
    PermissionDefinition("content.performances", "content", "content", "permissions.performances"),
    PermissionDefinition("content.pages", "content", "content", "permissions.pages"),
    PermissionDefinition("content.pages.about", "content", "content.pages", "permissions.aboutPage"),
    PermissionDefinition("content.pages.contact", "content", "content.pages", "permissions.contactPage"),
    PermissionDefinition("teaching", "teaching", label_key="permissions.teaching"),
    PermissionDefinition("teaching.programs", "teaching", "teaching", "permissions.programs"),
    PermissionDefinition("teaching.schedules", "teaching", "teaching", "permissions.schedules"),
    PermissionDefinition("teaching.schedules.calendar", "teaching", "teaching.schedules", "permissions.scheduleCalendar"),
    PermissionDefinition("teaching.schedules.fixed", "teaching", "teaching.schedules", "permissions.fixedCourses"),
    PermissionDefinition("teaching.schedules.bookings", "teaching", "teaching.schedules", "permissions.internalBookings"),
    PermissionDefinition("teaching.schedules.ai", "teaching", "teaching.schedules", "permissions.scheduleAi"),
    PermissionDefinition("teaching.pricing", "teaching", "teaching", "permissions.pricing"),
    PermissionDefinition("teaching.pricing.program", "teaching", "teaching.pricing", "permissions.programPricing"),
    PermissionDefinition("teaching.pricing.rental", "teaching", "teaching.pricing", "permissions.rentalPricing"),
    PermissionDefinition("teaching.faculty", "teaching", "teaching", "permissions.faculty"),
    PermissionDefinition("teaching.registration", "teaching", "teaching", "permissions.registration"),
    PermissionDefinition("classrooms", "classrooms", label_key="permissions.classrooms"),
    PermissionDefinition("classrooms.rentals", "classrooms", "classrooms", "permissions.rentalRequests"),
    PermissionDefinition("system", "system", label_key="permissions.system"),
    PermissionDefinition("system.brand", "system", "system", "permissions.brand"),
    PermissionDefinition("system.announcement", "system", "system", "permissions.announcement"),
    PermissionDefinition("system.footer", "system", "system", "permissions.footer"),
    PermissionDefinition("system.contact", "system", "system", "permissions.contact"),
    PermissionDefinition("system.studio", "system", "system", "permissions.studio"),
    PermissionDefinition("system.policy", "system", "system", "permissions.policy"),
    PermissionDefinition("system.email", "system", "system", "permissions.email"),
    PermissionDefinition("system.ai", "system", "system", "permissions.ai"),
    PermissionDefinition("system.backup", "system", "system", "permissions.backup"),
    PermissionDefinition("system.accounts", "system", "system", "permissions.accounts"),
)

PERMISSION_MAP = {item.key: item for item in PERMISSION_DEFINITIONS}

TEACHER_DEFAULTS = {
    "teaching": (True, True),
    "teaching.schedules": (True, True),
    "teaching.schedules.calendar": (True, False),
    "teaching.schedules.bookings": (True, True),
}

# Matches the old ordinary-admin surface during migration.
LEGACY_ADMIN_DEFAULTS = {
    "content": (True, True),
    "content.homepage": (True, True),
    "content.news": (True, True),
    "content.news.articles": (True, True),
    "content.news.categories": (True, True),
    "content.news.tags": (True, True),
    "content.performances": (True, True),
    "content.pages": (True, True),
    "content.pages.about": (True, True),
    "content.pages.contact": (True, True),
    "teaching": (True, True),
    "teaching.programs": (True, True),
    "teaching.schedules": (True, True),
    "teaching.schedules.calendar": (True, False),
    "teaching.schedules.fixed": (True, False),
    "teaching.schedules.bookings": (True, True),
    "teaching.schedules.ai": (True, False),
}


def stored_permissions(db: Session, user: User) -> dict[str, dict[str, bool]]:
    if user.role == "super_admin":
        return {item.key: {"view": True, "manage": True} for item in PERMISSION_DEFINITIONS}
    rows = db.query(UserPermission).filter(UserPermission.user_id == user.id).all()
    if not rows and user.role == "admin":
        return {key: {"view": value[0] or value[1], "manage": value[1]} for key, value in LEGACY_ADMIN_DEFAULTS.items()}
    return {row.permission_key: {"view": bool(row.can_view or row.can_manage), "manage": bool(row.can_manage)} for row in rows}


def effective_permissions(db: Session, user: User) -> dict[str, dict[str, bool]]:
    stored = stored_permissions(db, user)
    effective: dict[str, dict[str, bool]] = {}
    for definition in PERMISSION_DEFINITIONS:
        own = stored.get(definition.key, {"view": False, "manage": False})
        if definition.parent:
            parent = effective.get(definition.parent, {"view": False, "manage": False})
            view = bool(own["view"] and parent["view"])
            manage = bool(own["manage"] and parent["manage"] and view)
        else:
            view = bool(own["view"])
            manage = bool(own["manage"] and view)
        effective[definition.key] = {"view": view, "manage": manage}
    return effective


def has_permission(db: Session, user: User, key: str, action: PermissionAction = "view") -> bool:
    return bool(effective_permissions(db, user).get(key, {}).get(action, False))


def permission_denied(key: str, action: PermissionAction) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "permission_denied", "permission": key, "action": action},
    )


def require_user_permission(user: User, db: Session, key: str, action: PermissionAction = "view") -> User:
    if not has_permission(db, user, key, action):
        raise permission_denied(key, action)
    return user


def grant_defaults(db: Session, user: User, defaults: dict[str, tuple[bool, bool]]) -> None:
    for key, (can_view, can_manage) in defaults.items():
        db.add(UserPermission(user_id=user.id, permission_key=key, can_view=can_view or can_manage, can_manage=can_manage))
