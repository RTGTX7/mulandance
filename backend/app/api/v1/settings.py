import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import RegistrationSettings, SystemSettings, User
from app.schemas.settings import (
    RegistrationLinks,
    RegistrationLinksUpdate,
    HomepageSettings,
    HomepageSettingsUpdate,
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
    _ensure_system_settings_columns(db)
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if settings:
        return settings

    settings = SystemSettings(id=1)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _ensure_system_settings_columns(db: Session) -> None:
    inspector = inspect(db.bind)
    columns = {column["name"] for column in inspector.get_columns("system_settings")}
    if "homepage_json" not in columns:
        db.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_json TEXT"))
        db.commit()


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
        outbound_email=settings.outbound_email or "",
        classroom_request_limit_per_contact=settings.classroom_request_limit_per_contact or 0,
        program_pricing_json=settings.program_pricing_json or "",
        classroom_pricing_json=settings.classroom_pricing_json or "",
        youtube_url=settings.youtube_url or "",
        xiaohongshu_url=settings.xiaohongshu_url or "",
        instagram_url=settings.instagram_url or "",
        facebook_url=settings.facebook_url or "",
        tiktok_url=settings.tiktok_url or "",
    )


def _homepage_defaults() -> HomepageSettings:
    return HomepageSettings(
        hero_slides=[
            {
                "badge": "木兰舞蹈工作室",
                "title": "让舞动成为艺术",
                "subtitle": "学中乐、学中思、学中悟 - 木兰舞蹈工作室",
                "primary": {"label": "探索课程", "href": "/programs"},
                "secondary": {"label": "观看宣传片", "href": "https://www.youtube.com/@mulandancestudio21"},
                "overlay": "from-primary/90 via-primary/70 to-primary/40",
                "is_active": True,
            },
            {
                "badge": "演出季",
                "title": "2025/2026 演出季",
                "subtitle": "年度学员专场秀 + 小荷风采少儿舞蹈大赛",
                "primary": {"label": "了解演出", "href": "/performances"},
                "secondary": {"label": "观看YouTube", "href": "https://www.youtube.com/@mulandancestudio21"},
                "overlay": "from-primary/95 via-primary/80 to-purple-900/60",
                "is_active": True,
            },
            {
                "badge": "夏令营",
                "title": "2026 暑期舞蹈夏令营",
                "subtitle": "适合5-17岁学员的一周沉浸式舞蹈体验",
                "primary": {"label": "立即报名", "href": "/classes/register"},
                "secondary": {"label": "了解详情", "href": "/programs/summer-camps"},
                "overlay": "from-violet-800 via-purple-800 to-primary/80",
                "is_active": True,
            },
        ],
        stats=[
            {"value": "200+", "label": "学员"},
            {"value": "5+", "label": "年教学经验"},
            {"value": "100+", "label": "演出次数"},
            {"value": "5+", "label": "专业教师"},
        ],
        cta={
            "title": "加入木兰舞蹈大家庭",
            "subtitle": "2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766",
            "note": "工作室期待你加入这个温暖的大家庭。",
            "primary": {"label": "立即报名", "href": "/classes/register"},
            "secondary": {"label": "联系我们", "href": "/about/contact"},
        },
    )


def _homepage_to_response(settings: SystemSettings) -> HomepageSettings:
    if not settings.homepage_json:
        return _homepage_defaults()

    try:
        return HomepageSettings.model_validate(json.loads(settings.homepage_json))
    except (TypeError, json.JSONDecodeError, ValueError):
        return _homepage_defaults()


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


@router.get("/homepage", response_model=HomepageSettings)
def get_homepage_settings(db: Session = Depends(get_db)):
    settings = _get_or_create_system_settings(db)
    return _homepage_to_response(settings)


@router.put("/homepage", response_model=HomepageSettings)
def update_homepage_settings(
    payload: HomepageSettingsUpdate,
    user: User = Depends(require_admin_or_editor),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    settings.homepage_json = payload.model_dump_json()

    db.commit()
    db.refresh(settings)
    return _homepage_to_response(settings)
