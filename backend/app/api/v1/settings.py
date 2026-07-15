import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings as app_settings
from app.core.database import get_db
from app.core.permissions import has_permission, permission_denied, require_user_permission
from app.core.security import decode_token, oauth2_scheme
from app.core.translations import (
    LOCALES,
    dump_translations,
    ensure_text_column,
    localized_payload,
    normalize_locale,
    parse_translations,
    set_translation_bundle,
    translation_bundle,
)
from app.models import RegistrationSettings, SystemSettings, User
from app.schemas.settings import (
    RegistrationLinks,
    RegistrationLinksUpdate,
    HomepageButton,
    HomepageBlock,
    HomepageHeroSlide,
    HomepageSettings,
    HomepageSettingsBundle,
    HomepageSettingsBundleUpdate,
    HomepageSettingsUpdate,
    HomepageDraftResponse,
    HomepageDocumentV2,
    HomepageV2Block,
    HomepageV2DraftResponse,
    HomepageV2Item,
    HomepageV2LocalizedContent,
    HomepageV2Translations,
    AiProviderSettings,
    AiProviderSettingsUpdate,
    SchoolPolicyBundle,
    SchoolPolicyBundleUpdate,
    SchoolPolicyContent,
    SystemSettingsResponse,
    SystemSettingsUpdate,
    SystemSettingsDraftResponse,
)


router = APIRouter()
PAGES_DIR = Path(app_settings.NEWS_FILES_DIR).parent / "pages"
POLICY_LOCALES = ("zh", "en", "fr")
SYSTEM_TRANSLATABLE_FIELDS = (
    "site_name",
    "header_cta_label",
    "announcement_text",
    "footer_description",
    "footer_newsletter_title",
    "footer_newsletter_text",
    "copyright_text",
    "contact_address",
    "program_pricing_json",
    "classroom_pricing_json",
)

DEFAULT_POLICY_CONTENT = {
    "zh": SchoolPolicyContent(
        title="学校规章制度及退费规则",
        body_markdown="# 学校规章制度及退费规则\n\n请在报名及缴费前仔细阅读学校规章制度及退费规则。\n",
    ),
    "en": SchoolPolicyContent(
        title="School Policies and Refund Rules",
        body_markdown=(
            "# School Policies and Refund Rules\n\n"
            "Please read the school policies and refund rules carefully before registration and payment.\n"
        ),
    ),
    "fr": SchoolPolicyContent(
        title="Règlement de l'école et règles de remboursement",
        body_markdown=(
            "# Règlement de l'école et règles de remboursement\n\n"
            "Veuillez lire attentivement le règlement de l'école et les règles de remboursement avant l'inscription et le paiement.\n"
        ),
    ),
}


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
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return user


def require_registration_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "teaching.registration", "manage")


def require_homepage_view(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "content.homepage", "view")


def require_homepage_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "content.homepage", "manage")


SITE_PERMISSION_FIELDS = {
    "system.brand": {"site_name", "logo_url", "header_cta_label", "header_cta_href", "show_admin_login"},
    "system.announcement": {"announcement_enabled", "announcement_text", "announcement_href"},
    "system.footer": {"footer_description", "footer_newsletter_title", "footer_newsletter_text", "copyright_text", "privacy_href"},
    "system.contact": {"contact_email", "contact_phone", "contact_address", "youtube_url", "xiaohongshu_url", "instagram_url", "facebook_url", "tiktok_url"},
    "system.email": {"outbound_email", "classroom_request_limit_per_contact"},
}


def require_site_view(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "system", "view")


def require_ai_view(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "system.ai", "view")


def require_ai_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "system.ai", "manage")


def require_policy_view(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "system.policy", "view")


def require_policy_manage(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return require_user_permission(user, db, "system.policy", "manage")


def _assert_site_change_permissions(user: User, db: Session, before: dict, after: dict) -> None:
    changed = {key for key, value in after.items() if key != "translations" and before.get(key) != value}
    before_translations = before.get("translations") or {}
    after_translations = after.get("translations") or {}
    for locale in set(before_translations) | set(after_translations):
        old_locale = before_translations.get(locale) or {}
        new_locale = after_translations.get(locale) or {}
        changed.update(key for key, value in new_locale.items() if old_locale.get(key) != value)
    for permission, fields in SITE_PERMISSION_FIELDS.items():
        if changed & fields and not has_permission(db, user, permission, "manage"):
            raise permission_denied(permission, "manage")


def _normalize_policy_locale(locale: str) -> str:
    value = (locale or "zh").lower()
    if value.startswith("fr"):
        return "fr"
    if value.startswith("en"):
        return "en"
    return "zh"


def _policy_path(locale: str) -> Path:
    return PAGES_DIR / f"school-policy.{locale}.md"


def _legacy_policy_path() -> Path:
    return PAGES_DIR / "school-policy.md"


def _read_policy(locale: str) -> SchoolPolicyContent:
    normalized = _normalize_policy_locale(locale)
    path = _policy_path(normalized)
    if path.exists():
        body = path.read_text(encoding="utf-8")
    elif normalized == "zh" and _legacy_policy_path().exists():
        body = _legacy_policy_path().read_text(encoding="utf-8")
    else:
        body = DEFAULT_POLICY_CONTENT[normalized].body_markdown

    title = DEFAULT_POLICY_CONTENT[normalized].title
    for line in body.splitlines():
        if line.startswith("# "):
            title = line[2:].strip() or title
            break
    return SchoolPolicyContent(title=title, body_markdown=body)


def _write_policy(locale: str, policy: SchoolPolicyContent) -> SchoolPolicyContent:
    normalized = _normalize_policy_locale(locale)
    title = (policy.title or DEFAULT_POLICY_CONTENT[normalized].title).strip()
    body = policy.body_markdown or ""
    if not body.strip():
        body = f"# {title}\n"
    elif not body.lstrip().startswith("#"):
        body = f"# {title}\n\n{body.lstrip()}"

    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    _policy_path(normalized).write_text(body, encoding="utf-8", newline="")
    if normalized == "zh":
        _legacy_policy_path().write_text(body, encoding="utf-8", newline="")
    return SchoolPolicyContent(title=title, body_markdown=body)


def _policy_bundle() -> SchoolPolicyBundle:
    return SchoolPolicyBundle(
        zh=_read_policy("zh"),
        en=_read_policy("en"),
        fr=_read_policy("fr"),
    )


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
        if not settings.homepage_v2_json:
            published_bundle = _homepage_bundle_from_raw(settings.homepage_json)
            settings.homepage_v2_json = _legacy_homepage_to_v2(published_bundle).model_dump_json()
            draft_bundle = _homepage_bundle_from_raw(settings.homepage_draft_json) if settings.homepage_draft_json else published_bundle
            settings.homepage_v2_draft_json = _legacy_homepage_to_v2(draft_bundle).model_dump_json()
            db.commit()
            db.refresh(settings)
        return settings

    settings = SystemSettings(id=1)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    settings.homepage_v2_json = _legacy_homepage_to_v2(_homepage_bundle_from_raw(None)).model_dump_json()
    settings.homepage_v2_draft_json = settings.homepage_v2_json
    db.commit()
    db.refresh(settings)
    return settings


def _ensure_system_settings_columns(db: Session) -> None:
    inspector = inspect(db.bind)
    columns = {column["name"] for column in inspector.get_columns("system_settings")}
    if "homepage_json" not in columns:
        db.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_json TEXT"))
        db.commit()
    homepage_v2_columns = {
        "homepage_v2_json": "ALTER TABLE system_settings ADD COLUMN homepage_v2_json TEXT",
        "homepage_v2_draft_json": "ALTER TABLE system_settings ADD COLUMN homepage_v2_draft_json TEXT",
    }
    for column, statement in homepage_v2_columns.items():
        if column not in columns:
            db.execute(text(statement))
            db.commit()
    ai_columns = {
        "ai_enabled": "ALTER TABLE system_settings ADD COLUMN ai_enabled INTEGER DEFAULT 0",
        "ai_thinking_enabled": "ALTER TABLE system_settings ADD COLUMN ai_thinking_enabled INTEGER DEFAULT 0",
        "ai_image_enabled": "ALTER TABLE system_settings ADD COLUMN ai_image_enabled INTEGER DEFAULT 0",
        "ai_provider": "ALTER TABLE system_settings ADD COLUMN ai_provider VARCHAR(100) DEFAULT 'openai_compatible'",
        "ai_api_base_url": "ALTER TABLE system_settings ADD COLUMN ai_api_base_url VARCHAR(1000) DEFAULT 'https://api.openai.com/v1'",
        "ai_api_key": "ALTER TABLE system_settings ADD COLUMN ai_api_key TEXT DEFAULT ''",
        "ai_model": "ALTER TABLE system_settings ADD COLUMN ai_model VARCHAR(200) DEFAULT ''",
        "ai_timeout_seconds": "ALTER TABLE system_settings ADD COLUMN ai_timeout_seconds INTEGER DEFAULT 600",
        "ai_feature_models_json": "ALTER TABLE system_settings ADD COLUMN ai_feature_models_json TEXT",
    }
    added_ai_column = False
    for column, statement in ai_columns.items():
        if column not in columns:
            db.execute(text(statement))
            added_ai_column = True
    if added_ai_column:
        db.commit()
    ensure_text_column(db, "system_settings")


def _mask_secret(value: str | None) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "********"
    return f"{value[:4]}...{value[-4:]}"


def _ai_settings_to_response(settings: SystemSettings) -> AiProviderSettings:
    api_key = settings.ai_api_key or app_settings.AI_API_KEY or ""
    try:
        feature_models = json.loads(settings.ai_feature_models_json or "{}")
    except (TypeError, ValueError):
        feature_models = {}
    if not isinstance(feature_models, dict):
        feature_models = {}
    return AiProviderSettings(
        enabled=bool(settings.ai_enabled),
        thinking_enabled=bool(settings.ai_thinking_enabled),
        image_enabled=bool(settings.ai_image_enabled),
        provider=settings.ai_provider or app_settings.AI_PROVIDER or "openai_compatible",
        api_base_url=settings.ai_api_base_url or app_settings.AI_API_BASE_URL or "https://api.openai.com/v1",
        model=settings.ai_model or app_settings.AI_MODEL or "",
        timeout_seconds=settings.ai_timeout_seconds or app_settings.AI_TIMEOUT_SECONDS or 600,
        feature_models={str(key): str(value) for key, value in feature_models.items() if isinstance(value, str) and value.strip()},
        api_key_set=bool(api_key),
        api_key_masked=_mask_secret(api_key),
    )


def _system_to_response(settings: SystemSettings, locale: str | None = None, include_translations: bool = False) -> SystemSettingsResponse:
    data = dict(
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
        translations=translation_bundle(settings) if include_translations else {},
    )
    data.update(localized_payload(settings, SYSTEM_TRANSLATABLE_FIELDS, locale))
    return SystemSettingsResponse(**data)


def _homepage_defaults(locale: str = "zh") -> HomepageSettings:
    normalized = normalize_locale(locale)
    if normalized == "en":
        return HomepageSettings(
            hero_slides=[
                {
                    "badge": "Mulan Dance Studio",
                    "title": "Where Movement Becomes Art",
                    "subtitle": "Learn with joy, reflection, and growth at Mulan Dance Studio.",
                    "primary": {"label": "Explore Programs", "href": "/programs"},
                    "secondary": {"label": "Watch Video", "href": "https://www.youtube.com/@mulandancestudio21"},
                    "overlay": "from-primary/90 via-primary/70 to-primary/40",
                    "is_active": True,
                },
                {
                    "badge": "Season Performances",
                    "title": "2025/2026 Season",
                    "subtitle": "Annual student showcase and Xiaohe Fengcai Children's Dance Competition.",
                    "primary": {"label": "Learn About Events", "href": "/performances"},
                    "secondary": {"label": "Watch on YouTube", "href": "https://www.youtube.com/@mulandancestudio21"},
                    "overlay": "from-primary/95 via-primary/80 to-purple-900/60",
                    "is_active": True,
                },
                {
                    "badge": "Summer Camp",
                    "title": "Summer Dance Camps 2026",
                    "subtitle": "A one-week immersive dance experience for students ages 5 to 17.",
                    "primary": {"label": "Register Now", "href": "/classes/register"},
                    "secondary": {"label": "Learn More", "href": "/programs/summer-camps"},
                    "overlay": "from-violet-800 via-purple-800 to-primary/80",
                    "is_active": True,
                },
            ],
            stats=[
                {"value": "200+", "label": "Students"},
                {"value": "5+", "label": "Years Teaching"},
                {"value": "100+", "label": "Performances"},
                {"value": "5+", "label": "Faculty"},
            ],
            sections={
                "programs": {"title": "Our Programs", "subtitle": "Comprehensive dance training for every age and level in Ottawa", "link_label": "View all programs", "is_enabled": True},
                "performances": {"title": "Season Performances", "subtitle": "Join us for student showcases, competitions, and special events", "link_label": "Learn about all events", "is_enabled": True},
                "news": {"title": "Latest News", "subtitle": "Updates from Mulan Dance Studio", "link_label": "View all news", "is_enabled": True},
            },
            cta={
                "title": "Join the Mulan Dance Family",
                "subtitle": "2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766",
                "note": "Our studio welcomes dancers into a warm, focused community.",
                "primary": {"label": "Register Now", "href": "/classes/register"},
                "secondary": {"label": "Contact Us", "href": "/about/contact"},
            },
        )
    if normalized == "fr":
        return HomepageSettings(
            hero_slides=[
                {
                    "badge": "Mulan Dance Studio",
                    "title": "Quand le mouvement devient art",
                    "subtitle": "Apprendre avec plaisir, réflexion et progression chez Mulan Dance Studio.",
                    "primary": {"label": "Voir les cours", "href": "/programs"},
                    "secondary": {"label": "Voir la vidéo", "href": "https://www.youtube.com/@mulandancestudio21"},
                    "overlay": "from-primary/90 via-primary/70 to-primary/40",
                    "is_active": True,
                },
                {
                    "badge": "Saison de spectacles",
                    "title": "Saison 2025/2026",
                    "subtitle": "Spectacle annuel des eleves et concours de danse pour enfants Xiaohe Fengcai.",
                    "primary": {"label": "Voir les evenements", "href": "/performances"},
                    "secondary": {"label": "Voir sur YouTube", "href": "https://www.youtube.com/@mulandancestudio21"},
                    "overlay": "from-primary/95 via-primary/80 to-purple-900/60",
                    "is_active": True,
                },
                {
                    "badge": "Camp d'ete",
                    "title": "Camps de danse ete 2026",
                    "subtitle": "Une experience immersive d'une semaine pour les eleves de 5 a 17 ans.",
                    "primary": {"label": "S'inscrire", "href": "/classes/register"},
                    "secondary": {"label": "En savoir plus", "href": "/programs/summer-camps"},
                    "overlay": "from-violet-800 via-purple-800 to-primary/80",
                    "is_active": True,
                },
            ],
            stats=[
                {"value": "200+", "label": "Élèves"},
                {"value": "5+", "label": "Années d'enseignement"},
                {"value": "100+", "label": "Spectacles"},
                {"value": "5+", "label": "Professeurs"},
            ],
            sections={
                "programs": {"title": "Nos programmes", "subtitle": "Une formation complète en danse pour tous les âges et tous les niveaux à Ottawa", "link_label": "Voir tous les programmes", "is_enabled": True},
                "performances": {"title": "Spectacles de saison", "subtitle": "Spectacles étudiants, concours et événements spéciaux", "link_label": "Découvrir tous les événements", "is_enabled": True},
                "news": {"title": "Dernières actualités", "subtitle": "Nouvelles de Mulan Dance Studio", "link_label": "Voir toutes les actualités", "is_enabled": True},
            },
            cta={
                "title": "Rejoignez la famille Mulan Dance",
                "subtitle": "2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766",
                "note": "Notre studio accueille les danseurs dans une communauté chaleureuse et sérieuse.",
                "primary": {"label": "S'inscrire", "href": "/classes/register"},
                "secondary": {"label": "Nous contacter", "href": "/about/contact"},
            },
        )
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
        sections={
            "programs": {"title": "开设课程", "subtitle": "为不同年龄和水平的学员提供系统舞蹈训练", "link_label": "查看全部课程", "is_enabled": True},
            "performances": {"title": "演出与赛事", "subtitle": "了解学员演出、舞蹈比赛和特别活动", "link_label": "查看全部演出", "is_enabled": True},
            "news": {"title": "最新资讯", "subtitle": "木兰舞蹈工作室动态", "link_label": "查看全部新闻", "is_enabled": True},
        },
        cta={
            "title": "加入木兰舞蹈大家庭",
            "subtitle": "2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766",
            "note": "工作室期待你加入这个温暖的大家庭。",
            "primary": {"label": "立即报名", "href": "/classes/register"},
            "secondary": {"label": "联系我们", "href": "/about/contact"},
        },
    )


def _homepage_single_from_raw(raw) -> HomepageSettings | None:
    try:
        return HomepageSettings.model_validate(raw)
    except (TypeError, ValueError):
        return None


def _default_homepage_blocks() -> list[dict]:
    return [
        {"id": "hero", "type": "hero", "is_enabled": True},
        {"id": "stats", "type": "stats", "is_enabled": True},
        {"id": "performances", "type": "performances", "is_enabled": True},
        {"id": "programs", "type": "programs", "is_enabled": True},
        {"id": "news", "type": "news", "is_enabled": True},
        {"id": "cta", "type": "cta", "is_enabled": True},
    ]


def _merge_homepage_with_defaults(value: HomepageSettings | None, locale: str) -> HomepageSettings:
    defaults = _homepage_defaults(locale)
    if value is None:
        return defaults

    return HomepageSettings(
        hero_slides=value.hero_slides or defaults.hero_slides,
        stats=value.stats or defaults.stats,
        sections={
            "programs": {
                "title": value.sections.programs.title or defaults.sections.programs.title,
                "subtitle": value.sections.programs.subtitle or defaults.sections.programs.subtitle,
                "link_label": value.sections.programs.link_label or defaults.sections.programs.link_label,
                "is_enabled": value.sections.programs.is_enabled,
            },
            "performances": {
                "title": value.sections.performances.title or defaults.sections.performances.title,
                "subtitle": value.sections.performances.subtitle or defaults.sections.performances.subtitle,
                "link_label": value.sections.performances.link_label or defaults.sections.performances.link_label,
                "is_enabled": value.sections.performances.is_enabled,
            },
            "news": {
                "title": value.sections.news.title or defaults.sections.news.title,
                "subtitle": value.sections.news.subtitle or defaults.sections.news.subtitle,
                "link_label": value.sections.news.link_label or defaults.sections.news.link_label,
                "is_enabled": value.sections.news.is_enabled,
            },
        },
        cta=value.cta if any(
            [
                value.cta.title,
                value.cta.subtitle,
                value.cta.note,
                value.cta.primary.label,
                value.cta.secondary.label,
            ]
        ) else defaults.cta,
        blocks=value.blocks or _default_homepage_blocks(),
    )


def _localized_slide_with_reference(
    *,
    target: HomepageHeroSlide | None,
    fallback: HomepageHeroSlide | None,
    reference: HomepageHeroSlide,
) -> HomepageHeroSlide:
    target = target or HomepageHeroSlide()
    fallback = fallback or HomepageHeroSlide()
    return HomepageHeroSlide(
        badge=target.badge or fallback.badge or reference.badge,
        title=target.title or fallback.title or reference.title,
        subtitle=target.subtitle or fallback.subtitle or reference.subtitle,
        primary=HomepageButton(
            label=target.primary.label or fallback.primary.label or reference.primary.label,
            href=target.primary.href or reference.primary.href or fallback.primary.href,
        ),
        secondary=HomepageButton(
            label=target.secondary.label or fallback.secondary.label or reference.secondary.label,
            href=target.secondary.href or reference.secondary.href or fallback.secondary.href,
        ),
        image_url=reference.image_url or target.image_url or fallback.image_url,
        overlay=reference.overlay or target.overlay or fallback.overlay,
        is_active=reference.is_active,
    )


def _align_homepage_carousel_to_reference(value: HomepageSettings, locale: str, reference: HomepageSettings) -> HomepageSettings:
    if not reference.hero_slides:
        return value
    defaults = _homepage_defaults(locale)
    aligned_slides = [
        _localized_slide_with_reference(
            target=value.hero_slides[index] if index < len(value.hero_slides) else None,
            fallback=defaults.hero_slides[index] if index < len(defaults.hero_slides) else None,
            reference=reference_slide,
        )
        for index, reference_slide in enumerate(reference.hero_slides)
    ]
    return HomepageSettings(hero_slides=aligned_slides, stats=value.stats, sections=value.sections, cta=value.cta, blocks=value.blocks)


def _homepage_bundle_from_raw(raw_text: str | None) -> HomepageSettingsBundle:
    if not raw_text:
        return HomepageSettingsBundle(
            zh=_merge_homepage_with_defaults(_homepage_defaults("zh"), "zh"),
            en=_merge_homepage_with_defaults(_homepage_defaults("en"), "en"),
            fr=_merge_homepage_with_defaults(_homepage_defaults("fr"), "fr"),
        )

    try:
        raw = json.loads(raw_text)
    except (TypeError, json.JSONDecodeError, ValueError):
        raw = None

    if isinstance(raw, dict) and any(locale in raw for locale in LOCALES):
        zh = _merge_homepage_with_defaults(_homepage_single_from_raw(raw.get("zh")), "zh")
        en = _merge_homepage_with_defaults(_homepage_single_from_raw(raw.get("en")), "en")
        fr = _merge_homepage_with_defaults(_homepage_single_from_raw(raw.get("fr")), "fr")
        return HomepageSettingsBundle(
            zh=zh,
            en=_align_homepage_carousel_to_reference(en, "en", zh),
            fr=_align_homepage_carousel_to_reference(fr, "fr", zh),
        )

    legacy = _homepage_single_from_raw(raw)
    return HomepageSettingsBundle(
        zh=legacy or _homepage_defaults("zh"),
        en=_homepage_defaults("en"),
        fr=_homepage_defaults("fr"),
    )


def _homepage_to_response(settings: SystemSettings, locale: str | None = None) -> HomepageSettings:
    bundle = _homepage_bundle(settings)
    return getattr(bundle, normalize_locale(locale), bundle.zh)


HOMEPAGE_V2_TYPE_MAP = {
    "hero": "hero_carousel",
    "stats": "statistics",
    "performances": "performances",
    "programs": "program_directory",
    "news": "latest_news",
    "media": "media_story",
    "cta": "cta",
}

HOMEPAGE_V2_ADMIN_LABELS = {
    "hero_carousel": "Hero Carousel",
    "video_hero": "Video Hero",
    "media_story": "Media Story",
    "video_player": "Video Player",
    "image_marquee": "Three-row Image Marquee",
    "masonry_gallery": "Masonry Gallery",
    "awards_showcase": "Awards Showcase",
    "sponsor_wall": "Sponsor Wall",
    "campaign": "Campaign / Advertisement",
    "testimonials": "Testimonials",
    "statistics": "Statistics",
    "feature_grid": "Feature Grid",
    "program_directory": "Program Directory",
    "performances": "Performances",
    "latest_news": "Latest News",
    "timeline": "Timeline",
    "editorial_quote": "Editorial Quote",
    "cta": "Call to Action",
}


def _v2_content(**values) -> HomepageV2LocalizedContent:
    return HomepageV2LocalizedContent(**{key: value or "" for key, value in values.items()})


def _v2_translations(contents: dict[str, HomepageV2LocalizedContent]) -> HomepageV2Translations:
    return HomepageV2Translations(
        zh=contents.get("zh", HomepageV2LocalizedContent()),
        en=contents.get("en", HomepageV2LocalizedContent()),
        fr=contents.get("fr", HomepageV2LocalizedContent()),
    )


def _legacy_block(bundle: HomepageSettingsBundle, locale: str, block_id: str):
    return next((item for item in getattr(bundle, locale).blocks if item.id == block_id), None)


def _legacy_homepage_to_v2(bundle: HomepageSettingsBundle) -> HomepageDocumentV2:
    reference = bundle.zh.blocks or [HomepageBlock.model_validate(item) for item in _default_homepage_blocks()]
    blocks: list[HomepageV2Block] = []
    used_ids: set[str] = set()

    for index, reference_block in enumerate(reference):
        block_id = reference_block.id if reference_block.id not in used_ids else f"{reference_block.id}-{index + 1}"
        used_ids.add(block_id)
        block_type = HOMEPAGE_V2_TYPE_MAP[reference_block.type]
        localized: dict[str, HomepageV2LocalizedContent] = {}
        items: list[HomepageV2Item] = []
        config: dict = {"migrated_from_v1": True}

        if reference_block.type == "hero":
            max_slides = max(len(getattr(bundle, locale).hero_slides) for locale in LOCALES)
            for slide_index in range(max_slides):
                ref_slide = bundle.zh.hero_slides[slide_index] if slide_index < len(bundle.zh.hero_slides) else HomepageHeroSlide()
                slide_content = {}
                for locale in LOCALES:
                    locale_slides = getattr(bundle, locale).hero_slides
                    slide = locale_slides[slide_index] if slide_index < len(locale_slides) else ref_slide
                    slide_content[locale] = _v2_content(
                        eyebrow=slide.badge,
                        title=slide.title,
                        subtitle=slide.subtitle,
                        primary_label=slide.primary.label,
                        secondary_label=slide.secondary.label,
                        alt_text=slide.title,
                    )
                items.append(HomepageV2Item(
                    id=f"{block_id}-slide-{slide_index + 1}",
                    is_enabled=ref_slide.is_active,
                    media_type="video" if ref_slide.image_url.lower().split("?")[0].endswith((".mp4", ".webm", ".mov", ".ogg")) else "image",
                    media_url=ref_slide.image_url,
                    content=_v2_translations(slide_content),
                    link={"href": ref_slide.primary.href},
                    meta={"secondary_href": ref_slide.secondary.href, "legacy_overlay": ref_slide.overlay},
                ))
            config["legacy_media_fallback"] = not any(item.media_url for item in items)
        elif reference_block.type == "stats":
            max_stats = max(len(getattr(bundle, locale).stats) for locale in LOCALES)
            for stat_index in range(max_stats):
                ref_stat = bundle.zh.stats[stat_index] if stat_index < len(bundle.zh.stats) else None
                if ref_stat is None:
                    continue
                stat_content = {}
                for locale in LOCALES:
                    locale_stats = getattr(bundle, locale).stats
                    stat = locale_stats[stat_index] if stat_index < len(locale_stats) else ref_stat
                    stat_content[locale] = _v2_content(label=stat.label)
                items.append(HomepageV2Item(
                    id=f"{block_id}-stat-{stat_index + 1}",
                    media_type="none",
                    content=_v2_translations(stat_content),
                    meta={"value": ref_stat.value},
                ))
        elif reference_block.type in {"programs", "performances", "news"}:
            section_name = {"programs": "programs", "performances": "performances", "news": "news"}[reference_block.type]
            for locale in LOCALES:
                section = getattr(getattr(bundle, locale).sections, section_name)
                localized[locale] = _v2_content(title=section.title, subtitle=section.subtitle, link_label=section.link_label)
        elif reference_block.type == "cta":
            for locale in LOCALES:
                cta = getattr(bundle, locale).cta
                localized[locale] = _v2_content(
                    title=cta.title,
                    subtitle=cta.subtitle,
                    body=cta.note,
                    primary_label=cta.primary.label,
                    secondary_label=cta.secondary.label,
                )
        else:
            for locale in LOCALES:
                legacy = _legacy_block(bundle, locale, reference_block.id) or reference_block
                localized[locale] = _v2_content(
                    title=legacy.title,
                    subtitle=legacy.subtitle,
                    body=legacy.body,
                    link_label=legacy.link.label,
                    alt_text=legacy.title,
                )
            if reference_block.media_url:
                items.append(HomepageV2Item(
                    id=f"{block_id}-media-1",
                    media_type="video" if reference_block.media_type == "video" else "image",
                    media_url=reference_block.media_url,
                    content=_v2_translations({locale: _v2_content(alt_text=localized[locale].title) for locale in LOCALES}),
                ))
            config["legacy_layout"] = reference_block.layout

        data_source = "none"
        if reference_block.type == "programs":
            data_source = "programs"
        elif reference_block.type == "performances":
            data_source = "performances"
        elif reference_block.type == "news":
            data_source = "news"

        block = HomepageV2Block(
            id=block_id,
            type=block_type,
            admin_label=HOMEPAGE_V2_ADMIN_LABELS[block_type],
            is_enabled=reference_block.is_enabled,
            content=_v2_translations(localized),
            items=items,
            primary_link={
                "href": bundle.zh.cta.primary.href if reference_block.type == "cta" else reference_block.link.href,
            },
            secondary_link={
                "href": bundle.zh.cta.secondary.href if reference_block.type == "cta" else "",
            },
            data_source={"source": data_source, "limit": 6},
            config=config,
        )
        blocks.append(block)

    return HomepageDocumentV2(blocks=blocks)


def _homepage_v2_from_raw(raw_text: str | None, fallback: HomepageSettingsBundle) -> HomepageDocumentV2:
    if raw_text:
        try:
            return HomepageDocumentV2.model_validate_json(raw_text)
        except (TypeError, ValueError):
            pass
    return _legacy_homepage_to_v2(fallback)


def _schedule_is_active(schedule, now: datetime | None = None) -> bool:
    timezone_name = schedule.timezone or "America/Toronto"
    try:
        zone = ZoneInfo(timezone_name)
    except (KeyError, ValueError):
        try:
            zone = ZoneInfo("America/Toronto")
        except (KeyError, ValueError):
            zone = timezone.utc
    current = now or datetime.now(zone)

    def parse(value: str | None):
        if not value:
            return None
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=zone) if parsed.tzinfo is None else parsed.astimezone(zone)

    try:
        start = parse(schedule.start_at)
        end = parse(schedule.end_at)
    except ValueError:
        return False
    return not ((start and current < start) or (end and current > end))


def _public_homepage_v2(document: HomepageDocumentV2) -> HomepageDocumentV2:
    blocks = []
    for block in document.blocks:
        if not block.is_enabled or not _schedule_is_active(block.schedule):
            continue
        items = [item for item in block.items if item.is_enabled and _schedule_is_active(item.schedule)]
        blocks.append(block.model_copy(update={"items": items}))
    return HomepageDocumentV2(blocks=blocks)


def _valid_homepage_link(href: str) -> bool:
    if not href:
        return True
    if href.startswith(("/", "#", "mailto:", "tel:")):
        return True
    return urlparse(href).scheme in {"http", "https"}


def _validate_homepage_v2(document: HomepageDocumentV2) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    enabled = [block for block in document.blocks if block.is_enabled]
    if not enabled or enabled[0].type not in {"hero_carousel", "video_hero"}:
        errors.append("The first enabled block must be Hero Carousel or Video Hero.")
    ids = [block.id for block in document.blocks]
    if len(ids) != len(set(ids)):
        errors.append("Homepage block IDs must be unique.")

    media_required = {
        "video_hero", "video_player", "image_marquee", "masonry_gallery",
        "awards_showcase", "sponsor_wall",
    }
    for block in document.blocks:
        if not block.is_enabled:
            continue
        prefix = block.admin_label or block.type
        if block.type == "hero_carousel" and not [item for item in block.items if item.is_enabled]:
            errors.append(f"{prefix}: add at least one enabled slide.")
        if block.type in media_required and not any(item.is_enabled and item.media_url for item in block.items):
            errors.append(f"{prefix}: add at least one media item.")
        if block.type == "video_hero":
            first = next((item for item in block.items if item.is_enabled), None)
            if first and (first.media_type != "video" or not first.poster_url):
                errors.append(f"{prefix}: the background video requires a poster image.")
        for link in (block.primary_link, block.secondary_link):
            if not _valid_homepage_link(link.href):
                errors.append(f"{prefix}: invalid link {link.href!r}.")
        for item in block.items:
            if not _valid_homepage_link(item.link.href):
                errors.append(f"{prefix}: item {item.id} has an invalid link.")
            if not _valid_homepage_link(str(item.meta.get("secondary_href") or "")):
                errors.append(f"{prefix}: item {item.id} has an invalid secondary link.")
            if item.media_url and item.media_type in {"image", "logo"} and not item.content.zh.alt_text:
                warnings.append(f"{prefix}: item {item.id} is missing Chinese alt text.")
        if block.content.zh.title:
            for locale in ("en", "fr"):
                if not getattr(block.content, locale).title:
                    warnings.append(f"{prefix}: {locale.upper()} title falls back to Chinese.")
    return errors, warnings


@router.get("/registration-links", response_model=RegistrationLinks)
def get_registration_links(db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)
    return _to_response(settings)


@router.put("/registration-links", response_model=RegistrationLinks)
def update_registration_links(
    payload: RegistrationLinksUpdate,
    user: User = Depends(require_registration_manage),
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
def get_site_settings(locale: str | None = None, db: Session = Depends(get_db)):
    settings = _get_or_create_system_settings(db)
    return _system_to_response(settings, locale)


@router.get("/site/all", response_model=SystemSettingsResponse)
def get_site_settings_all(
    user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    return _system_to_response(settings, include_translations=True)


@router.get("/site/draft", response_model=SystemSettingsDraftResponse)
def get_site_settings_draft(
    user: User = Depends(require_site_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    if settings.site_draft_json:
        try:
            draft = SystemSettingsResponse.model_validate_json(settings.site_draft_json)
        except (TypeError, ValueError):
            draft = _system_to_response(settings, include_translations=True)
    else:
        draft = _system_to_response(settings, include_translations=True)
    published = _system_to_response(settings, include_translations=True)
    return SystemSettingsDraftResponse(settings=draft, is_dirty=draft.model_dump() != published.model_dump(), published_at=settings.site_published_at.isoformat() if settings.site_published_at else None)


@router.put("/site/draft", response_model=SystemSettingsDraftResponse)
def save_site_settings_draft(
    payload: SystemSettingsUpdate,
    user: User = Depends(require_site_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    current = SystemSettingsResponse.model_validate_json(settings.site_draft_json).model_dump() if settings.site_draft_json else _system_to_response(settings, include_translations=True).model_dump()
    _assert_site_change_permissions(user, db, current, payload.model_dump())
    settings.site_draft_json = payload.model_dump_json()
    db.commit(); db.refresh(settings)
    published = _system_to_response(settings, include_translations=True)
    return SystemSettingsDraftResponse(settings=SystemSettingsResponse(**payload.model_dump()), is_dirty=payload.model_dump() != published.model_dump(), published_at=settings.site_published_at.isoformat() if settings.site_published_at else None)


@router.post("/site/publish", response_model=SystemSettingsDraftResponse)
def publish_site_settings_draft(
    user: User = Depends(require_site_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    if not settings.site_draft_json:
        raise HTTPException(status_code=400, detail="Save a settings draft before publishing")
    try:
        draft = SystemSettingsUpdate.model_validate_json(settings.site_draft_json)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Settings draft is invalid")
    published = _system_to_response(settings, include_translations=True).model_dump()
    _assert_site_change_permissions(user, db, published, draft.model_dump())
    data = draft.model_dump(); translations = data.pop("translations", None)
    for field, value in data.items():
        setattr(settings, field, value.strip() if isinstance(value, str) else value)
    if translations is not None: set_translation_bundle(settings, translations)
    settings.site_published_at = datetime.now(timezone.utc)
    settings.site_draft_json = SystemSettingsResponse(**draft.model_dump()).model_dump_json()
    db.commit(); db.refresh(settings)
    return SystemSettingsDraftResponse(settings=_system_to_response(settings, include_translations=True), is_dirty=False, published_at=settings.site_published_at.isoformat())


@router.put("/site", response_model=SystemSettingsResponse)
def update_site_settings(
    payload: SystemSettingsUpdate,
    user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    data = payload.model_dump()
    translations = data.pop("translations", None)
    for field, value in data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(settings, field, value)
    if translations is not None:
        set_translation_bundle(settings, translations)

    db.commit()
    db.refresh(settings)
    return _system_to_response(settings, include_translations=True)


@router.get("/homepage", response_model=HomepageSettings)
def get_homepage_settings(locale: str | None = None, db: Session = Depends(get_db)):
    settings = _get_or_create_system_settings(db)
    return _homepage_to_response(settings, locale)


@router.get("/homepage/all", response_model=HomepageSettingsBundle)
def get_homepage_settings_bundle(
    user: User = Depends(require_homepage_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    return _homepage_bundle(settings)


@router.get("/homepage/draft", response_model=HomepageDraftResponse)
def get_homepage_draft(
    user: User = Depends(require_homepage_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    raw = settings.homepage_draft_json or settings.homepage_json
    return HomepageDraftResponse(
        bundle=_homepage_bundle_from_raw(raw),
        is_dirty=bool(settings.homepage_draft_json and settings.homepage_draft_json != settings.homepage_json),
        published_at=settings.homepage_published_at.isoformat() if settings.homepage_published_at else None,
    )


@router.put("/homepage/draft", response_model=HomepageDraftResponse)
def save_homepage_draft(
    payload: HomepageSettingsBundleUpdate,
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    settings.homepage_draft_json = payload.model_dump_json()
    db.commit(); db.refresh(settings)
    return HomepageDraftResponse(
        bundle=_homepage_bundle_from_raw(settings.homepage_draft_json),
        is_dirty=settings.homepage_draft_json != settings.homepage_json,
        published_at=settings.homepage_published_at.isoformat() if settings.homepage_published_at else None,
    )


@router.post("/homepage/publish", response_model=HomepageDraftResponse)
def publish_homepage_draft(
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    if not settings.homepage_draft_json:
        raise HTTPException(status_code=400, detail="Save a homepage draft before publishing")
    bundle = _homepage_bundle_from_raw(settings.homepage_draft_json)
    for locale in LOCALES:
        enabled = [block for block in getattr(bundle, locale).blocks if block.is_enabled]
        if not enabled or enabled[0].type != "hero":
            raise HTTPException(status_code=422, detail=f"{locale}: the first enabled homepage block must be Hero")
    settings.homepage_json = bundle.model_dump_json()
    settings.homepage_draft_json = settings.homepage_json
    settings.homepage_published_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(settings)
    return HomepageDraftResponse(bundle=bundle, is_dirty=False, published_at=settings.homepage_published_at.isoformat())


@router.get("/homepage/v2", response_model=HomepageDocumentV2)
def get_homepage_v2(
    locale: str = "zh",
    db: Session = Depends(get_db),
):
    # The locale is accepted for a stable public contract; the renderer performs
    # Chinese fallback using the complete public translation bundle.
    normalize_locale(locale)
    settings = _get_or_create_system_settings(db)
    document = _homepage_v2_from_raw(settings.homepage_v2_json, _homepage_bundle(settings))
    return _public_homepage_v2(document)


@router.get("/homepage/v2/draft", response_model=HomepageV2DraftResponse)
def get_homepage_v2_draft(
    user: User = Depends(require_homepage_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    raw = settings.homepage_v2_draft_json or settings.homepage_v2_json
    document = _homepage_v2_from_raw(raw, _homepage_bundle(settings))
    _, warnings = _validate_homepage_v2(document)
    return HomepageV2DraftResponse(
        document=document,
        is_dirty=bool(settings.homepage_v2_draft_json and settings.homepage_v2_draft_json != settings.homepage_v2_json),
        published_at=settings.homepage_published_at.isoformat() if settings.homepage_published_at else None,
        warnings=warnings,
    )


@router.put("/homepage/v2/draft", response_model=HomepageV2DraftResponse)
def save_homepage_v2_draft(
    payload: HomepageDocumentV2,
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    errors, warnings = _validate_homepage_v2(payload)
    settings.homepage_v2_draft_json = payload.model_dump_json()
    db.commit()
    return HomepageV2DraftResponse(
        document=payload,
        is_dirty=settings.homepage_v2_draft_json != settings.homepage_v2_json,
        published_at=settings.homepage_published_at.isoformat() if settings.homepage_published_at else None,
        warnings=errors + warnings,
    )


@router.post("/homepage/v2/publish", response_model=HomepageV2DraftResponse)
def publish_homepage_v2_draft(
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    raw = settings.homepage_v2_draft_json or settings.homepage_v2_json
    document = _homepage_v2_from_raw(raw, _homepage_bundle(settings))
    errors, warnings = _validate_homepage_v2(document)
    if errors:
        raise HTTPException(status_code=422, detail={"code": "homepage_publish_invalid", "errors": errors, "warnings": warnings})
    settings.homepage_v2_json = document.model_dump_json()
    settings.homepage_v2_draft_json = settings.homepage_v2_json
    settings.homepage_published_at = datetime.now(timezone.utc)
    db.commit()
    return HomepageV2DraftResponse(
        document=document,
        is_dirty=False,
        published_at=settings.homepage_published_at.isoformat(),
        warnings=warnings,
    )


@router.put("/homepage/all", response_model=HomepageSettingsBundle)
def update_homepage_settings_bundle(
    payload: HomepageSettingsBundleUpdate,
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    settings.homepage_json = payload.model_dump_json()

    db.commit()
    db.refresh(settings)
    return _homepage_bundle(settings)


@router.put("/homepage", response_model=HomepageSettings)
def update_homepage_settings(
    payload: HomepageSettingsUpdate,
    locale: str = "zh",
    user: User = Depends(require_homepage_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    bundle = _homepage_bundle(settings)
    target_locale = normalize_locale(locale)
    if target_locale not in LOCALES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported locale")
    setattr(bundle, target_locale, payload)
    settings.homepage_json = bundle.model_dump_json()

    db.commit()
    db.refresh(settings)
    return _homepage_to_response(settings, target_locale)


@router.get("/ai", response_model=AiProviderSettings)
def get_ai_provider_settings(
    user: User = Depends(require_ai_view),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    return _ai_settings_to_response(settings)


@router.get("/ai/models")
def list_ai_models(user: User = Depends(require_ai_view), db: Session = Depends(get_db)):
    """Proxy OpenAI-compatible /models without exposing the stored API key."""
    import json
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError

    settings = _get_or_create_system_settings(db)
    base_url = (settings.ai_api_base_url or "").rstrip("/")
    if not base_url:
        raise HTTPException(status_code=400, detail="AI API Base URL is required")
    headers = {"Accept": "application/json"}
    if settings.ai_api_key:
        headers["Authorization"] = f"Bearer {settings.ai_api_key}"
    try:
        with urlopen(Request(f"{base_url}/models", headers=headers), timeout=min(settings.ai_timeout_seconds or 300, 60)) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Unable to fetch AI models: {exc}")
    models = payload.get("data", payload.get("models", [])) if isinstance(payload, dict) else []
    ids = sorted({str(item.get("id") or item.get("name")) for item in models if isinstance(item, dict) and (item.get("id") or item.get("name"))})
    return {"models": ids}


@router.post("/ai/models")
def list_ai_models_from_form(
    payload: dict = Body(default={}),
    user: User = Depends(require_ai_manage),
    db: Session = Depends(get_db),
):
    """List models using unsaved AI form values; the key is never persisted or returned."""
    import json
    from urllib.error import HTTPError, URLError
    from urllib.request import Request, urlopen

    settings = _get_or_create_system_settings(db)
    base_url = str(payload.get("api_base_url") or settings.ai_api_base_url or "").strip().rstrip("/")
    api_key = str(payload.get("api_key") or settings.ai_api_key or "").strip()
    if not base_url:
        raise HTTPException(status_code=400, detail="AI API Base URL is required")
    headers = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        with urlopen(Request(f"{base_url}/models", headers=headers), timeout=30) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Unable to fetch AI models: {exc}")
    models = response_data.get("data", response_data.get("models", [])) if isinstance(response_data, dict) else []
    return {"models": sorted({str(item.get("id") or item.get("name")) for item in models if isinstance(item, dict) and (item.get("id") or item.get("name"))})}


@router.put("/ai", response_model=AiProviderSettings)
def update_ai_provider_settings(
    payload: AiProviderSettingsUpdate,
    user: User = Depends(require_ai_manage),
    db: Session = Depends(get_db),
):
    settings = _get_or_create_system_settings(db)
    settings.ai_enabled = payload.enabled
    settings.ai_thinking_enabled = payload.thinking_enabled
    settings.ai_image_enabled = payload.image_enabled
    settings.ai_provider = payload.provider.strip() or "openai_compatible"
    settings.ai_api_base_url = payload.api_base_url.strip().rstrip("/") or "https://api.openai.com/v1"
    settings.ai_model = payload.model.strip()
    settings.ai_timeout_seconds = payload.timeout_seconds
    settings.ai_feature_models_json = json.dumps(
        {str(key): str(value).strip() for key, value in payload.feature_models.items() if str(value).strip()},
        ensure_ascii=False,
    )
    if payload.clear_api_key:
        settings.ai_api_key = ""
    elif payload.api_key is not None and payload.api_key.strip():
        settings.ai_api_key = payload.api_key.strip()

    db.commit()
    db.refresh(settings)
    return _ai_settings_to_response(settings)


def _homepage_bundle(settings: SystemSettings) -> HomepageSettingsBundle:
    return _homepage_bundle_from_raw(settings.homepage_json)


@router.get("/school-policy", response_model=SchoolPolicyContent)
def get_school_policy(locale: str = "zh"):
    return _read_policy(locale)


@router.get("/school-policy/all", response_model=SchoolPolicyBundle)
def get_school_policy_bundle(user: User = Depends(require_policy_view)):
    return _policy_bundle()


@router.put("/school-policy", response_model=SchoolPolicyBundle)
def update_school_policy_bundle(
    payload: SchoolPolicyBundleUpdate,
    user: User = Depends(require_policy_manage),
):
    return SchoolPolicyBundle(
        zh=_write_policy("zh", payload.zh),
        en=_write_policy("en", payload.en),
        fr=_write_policy("fr", payload.fr),
    )
