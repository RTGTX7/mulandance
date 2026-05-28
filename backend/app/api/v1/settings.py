from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import RegistrationSettings, SystemSettings, User
from app.schemas.settings import (
    RegistrationLinks,
    RegistrationLinksUpdate,
    SystemSettingsResponse,
    SystemSettingsUpdate,
)


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user


def require_admin_or_editor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "editor", "faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def _get_or_create_settings(db: Session) -> RegistrationSettings:
    settings = db.query(RegistrationSettings).filter(RegistrationSettings.id == 1).first()
    if settings:
        return settings

    settings = RegistrationSettings(id=1)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _to_response(settings: RegistrationSettings) -> RegistrationLinks:
    return RegistrationLinks(
        registration_url=settings.registration_url or "",
        summer_camp_registration_url=settings.summer_camp_registration_url or "",
        summer_camp_enabled=bool(settings.summer_camp_enabled),
    )


def _get_or_create_system_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if settings:
        return settings

    settings = SystemSettings(id=1)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _system_to_response(settings: SystemSettings) -> SystemSettingsResponse:
    return SystemSettingsResponse(
        site_name=settings.site_name or "Mulan Dance Studio",
        logo_url=settings.logo_url or "/logo.png",
        header_cta_label=settings.header_cta_label or "",
        header_cta_href=settings.header_cta_href or "",
        show_admin_login=bool(settings.show_admin_login),
        announcement_enabled=bool(settings.announcement_enabled),
        announcement_text=settings.announcement_text or "",
        announcement_href=settings.announcement_href or "",
        footer_description=settings.footer_description or "",
        footer_newsletter_title=settings.footer_newsletter_title or "",
        footer_newsletter_text=settings.footer_newsletter_text or "",
        copyright_text=settings.copyright_text or "",
        privacy_href=settings.privacy_href or "/privacy",
        contact_email=settings.contact_email or "",
        contact_phone=settings.contact_phone or "",
        contact_address=settings.contact_address or "",
        youtube_url=settings.youtube_url or "",
        xiaohongshu_url=settings.xiaohongshu_url or "",
        instagram_url=settings.instagram_url or "",
        facebook_url=settings.facebook_url or "",
        tiktok_url=settings.tiktok_url or "",
    )


@router.get("/registration-links", response_model=RegistrationLinks)
def get_registration_links(db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)
    return _to_response(settings)


@router.put("/registration-links", response_model=RegistrationLinks)
def update_registration_links(
    payload: RegistrationLinksUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_settings(db)
    settings.registration_url = payload.registration_url.strip()
    settings.summer_camp_registration_url = payload.summer_camp_registration_url.strip()
    settings.summer_camp_enabled = payload.summer_camp_enabled

    db.commit()
    db.refresh(settings)
    return _to_response(settings)


@router.get("/site", response_model=SystemSettingsResponse)
def get_site_settings(db: Session = Depends(get_db)):
    settings = _get_or_create_system_settings(db)
    return _system_to_response(settings)


@router.put("/site", response_model=SystemSettingsResponse)
def update_site_settings(
    payload: SystemSettingsUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    for field, value in payload.model_dump().items():
        if isinstance(value, str):
            value = value.strip()
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return _system_to_response(settings)
