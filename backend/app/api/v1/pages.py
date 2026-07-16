import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.settings import get_current_user
from app.core.database import get_db
from app.core.permissions import require_user_permission
from app.models import SitePageDocument as SitePageDocumentModel, SystemSettings, User
from app.schemas.settings import (
    SitePageBlock,
    SitePageDocument,
    SitePageDraftResponse,
    SitePageLocalizedContent,
    SitePageTranslations,
)

router = APIRouter()
PAGE_SLUGS = {"about", "contact"}


def _content(**values: str) -> SitePageTranslations:
    return SitePageTranslations(zh=SitePageLocalizedContent(**values.get("zh", {})), en=SitePageLocalizedContent(**values.get("en", {})), fr=SitePageLocalizedContent(**values.get("fr", {})))


def _about_defaults() -> SitePageDocument:
    return SitePageDocument(
        slug="about",
        hero=SitePageBlock(
            id="about-hero", type="hero", admin_label="About hero",
            content=_content(
                zh={"eyebrow": "木兰舞蹈工作室", "title": "关于我们", "subtitle": "在舞动中学习，在舞台上成长。"},
                en={"eyebrow": "Mulan Dance Studio", "title": "About Us", "subtitle": "Learn through movement and grow with every performance."},
                fr={"eyebrow": "Mulan Dance Studio", "title": "À propos de nous", "subtitle": "Apprendre par le mouvement et grandir à chaque spectacle."},
            ),
        ),
        blocks=[
            SitePageBlock(
                id="about-intro", type="rich_text", admin_label="Introduction",
                content=_content(
                    zh={"title": "让舞动成为艺术", "body": "木兰舞蹈工作室为不同年龄和水平的学生提供专业、温暖而有系统的舞蹈训练。"},
                    en={"title": "Where movement becomes art", "body": "Mulan Dance Studio offers thoughtful, welcoming dance training for students of different ages and levels."},
                    fr={"title": "Quand le mouvement devient art", "body": "Mulan Dance Studio offre une formation attentive et chaleureuse aux élèves de tous âges et niveaux."},
                ),
            ),
            SitePageBlock(
                id="about-goals", type="bullet_list", admin_label="Our goals",
                content=_content(zh={"title": "我们的目标"}, en={"title": "Our goals"}, fr={"title": "Nos objectifs"}),
                items=[
                    {"zh": "建立扎实的舞蹈基础", "en": "Build strong dance foundations", "fr": "Développer de solides bases en danse"},
                    {"zh": "培养自信、专注和创造力", "en": "Develop confidence, focus, and creativity", "fr": "Développer confiance, concentration et créativité"},
                    {"zh": "让每位学生都能感受到进步", "en": "Help every student experience progress", "fr": "Faire vivre à chaque élève le plaisir de progresser"},
                ],
            ),
            SitePageBlock(
                id="about-vision", type="values_grid", admin_label="Our vision",
                content=_content(zh={"title": "我们的愿景", "body": "以尊重、热情和持续学习建立一个支持每位舞者的社区。"}, en={"title": "Our vision", "body": "Build a community that supports every dancer through respect, passion, and lifelong learning."}, fr={"title": "Notre vision", "body": "Créer une communauté qui accompagne chaque danseur avec respect, passion et apprentissage continu."}),
                items=[],
            ),
            SitePageBlock(
                id="about-cta", type="cta", admin_label="Contact CTA",
                content=_content(zh={"title": "加入木兰舞蹈大家庭", "primary_label": "联系我们"}, en={"title": "Join the Mulan Dance family", "primary_label": "Contact us"}, fr={"title": "Rejoignez la famille Mulan Dance", "primary_label": "Nous contacter"}),
                href="/about/contact",
            ),
        ],
    )


def _contact_defaults() -> SitePageDocument:
    return SitePageDocument(
        slug="contact",
        hero=SitePageBlock(
            id="contact-hero", type="hero", admin_label="Contact hero",
            content=_content(
                zh={"eyebrow": "木兰舞蹈工作室", "title": "联系我们", "subtitle": "欢迎咨询课程、报名、演出与教室使用。"},
                en={"eyebrow": "Mulan Dance Studio", "title": "Contact Us", "subtitle": "We are happy to help with classes, registration, performances, and studio use."},
                fr={"eyebrow": "Mulan Dance Studio", "title": "Nous contacter", "subtitle": "Nous sommes là pour vous aider concernant les cours, l'inscription et l'utilisation du studio."},
            ),
        ),
        blocks=[
            SitePageBlock(id="contact-intro", type="rich_text", admin_label="Introduction", content=_content(zh={"title": "和我们聊聊", "body": "填写表单或使用下方联系方式，我们会尽快回复。"}, en={"title": "Let’s talk", "body": "Use the form or the contact details below and we will get back to you soon."}, fr={"title": "Parlons-nous", "body": "Utilisez le formulaire ou les coordonnées ci-dessous et nous vous répondrons bientôt."})),
            SitePageBlock(id="contact-details", type="contact_details", admin_label="Contact details", content=_content(zh={"title": "工作室信息"}, en={"title": "Studio details"}, fr={"title": "Coordonnées du studio"})),
            SitePageBlock(id="contact-form", type="contact_form", admin_label="Contact form", content=_content(zh={"title": "发送消息", "label": "提交表单", "placeholder": "请输入您的问题", "success_message": "邮件窗口已打开，请检查并发送您的消息。"}, en={"title": "Send a message", "label": "Submit form", "placeholder": "Tell us how we can help", "success_message": "Your email app opened. Please review and send your message."}, fr={"title": "Envoyer un message", "label": "Envoyer", "placeholder": "Dites-nous comment nous pouvons vous aider", "success_message": "Votre application de courriel est ouverte. Vérifiez puis envoyez votre message."})),
        ],
    )


def _about_defaults_v2() -> SitePageDocument:
    """UTF-8-safe initial About page used when no saved document exists."""
    return SitePageDocument(
        slug="about",
        hero=SitePageBlock(
            id="about-hero", type="hero", admin_label="About hero",
            content=_content(
                zh={"eyebrow": "木兰舞蹈工作室", "title": "关于我们", "subtitle": "在舞动中学习，在舞台上成长。"},
                en={"eyebrow": "Mulan Dance Studio", "title": "About Us", "subtitle": "Learn through movement and grow with every performance."},
                fr={"eyebrow": "Mulan Dance Studio", "title": "À propos de nous", "subtitle": "Apprendre par le mouvement et grandir à chaque spectacle."},
            ),
        ),
        blocks=[
            SitePageBlock(
                id="about-intro", type="rich_text", admin_label="Introduction",
                content=_content(
                    zh={"title": "让舞动成为艺术", "body": "木兰舞蹈工作室为不同年龄和水平的学生提供专业、温暖而有系统的舞蹈训练。"},
                    en={"title": "Where movement becomes art", "body": "Mulan Dance Studio offers thoughtful, welcoming dance training for students of different ages and levels."},
                    fr={"title": "Quand le mouvement devient art", "body": "Mulan Dance Studio offre une formation attentive et chaleureuse aux élèves de tous âges et niveaux."},
                ),
            ),
            SitePageBlock(
                id="about-goals", type="bullet_list", admin_label="Our goals",
                content=_content(zh={"title": "我们的目标"}, en={"title": "Our goals"}, fr={"title": "Nos objectifs"}),
                items=[
                    {"zh": "建立扎实的舞蹈基础", "en": "Build strong dance foundations", "fr": "Développer de solides bases en danse"},
                    {"zh": "培养自信、专注和创造力", "en": "Develop confidence, focus, and creativity", "fr": "Développer confiance, concentration et créativité"},
                    {"zh": "让每位学生都能感受到进步", "en": "Help every student experience progress", "fr": "Faire vivre à chaque élève le plaisir de progresser"},
                ],
            ),
            SitePageBlock(
                id="about-vision", type="values_grid", admin_label="Our vision",
                content=_content(
                    zh={"title": "我们的愿景", "body": "以尊重、热情和持续学习建立一个支持每位舞者的社区。"},
                    en={"title": "Our vision", "body": "Build a community that supports every dancer through respect, passion, and lifelong learning."},
                    fr={"title": "Notre vision", "body": "Créer une communauté qui accompagne chaque danseur avec respect, passion et apprentissage continu."},
                ),
            ),
            SitePageBlock(
                id="about-cta", type="cta", admin_label="Contact CTA",
                content=_content(
                    zh={"title": "加入木兰舞蹈大家庭", "primary_label": "联系我们"},
                    en={"title": "Join the Mulan Dance family", "primary_label": "Contact us"},
                    fr={"title": "Rejoignez la famille Mulan Dance", "primary_label": "Nous contacter"},
                ),
                href="/about/contact",
            ),
        ],
    )


def _contact_defaults_v2() -> SitePageDocument:
    """UTF-8-safe initial Contact page used when no saved document exists."""
    return SitePageDocument(
        slug="contact",
        hero=SitePageBlock(
            id="contact-hero", type="hero", admin_label="Contact hero",
            content=_content(
                zh={"eyebrow": "木兰舞蹈工作室", "title": "联系我们", "subtitle": "欢迎咨询课程、报名、演出与教室使用。"},
                en={"eyebrow": "Mulan Dance Studio", "title": "Contact Us", "subtitle": "We are happy to help with classes, registration, performances, and studio use."},
                fr={"eyebrow": "Mulan Dance Studio", "title": "Nous contacter", "subtitle": "Nous sommes là pour vous aider concernant les cours, l'inscription et l'utilisation du studio."},
            ),
        ),
        blocks=[
            SitePageBlock(
                id="contact-intro", type="rich_text", admin_label="Introduction",
                content=_content(
                    zh={"title": "和我们聊聊", "body": "填写表单或使用下方联系方式，我们会尽快回复。"},
                    en={"title": "Let’s talk", "body": "Use the form or the contact details below and we will get back to you soon."},
                    fr={"title": "Parlons-nous", "body": "Utilisez le formulaire ou les coordonnées ci-dessous et nous vous répondrons bientôt."},
                ),
            ),
            SitePageBlock(
                id="contact-details", type="contact_details", admin_label="Contact details",
                content=_content(zh={"title": "工作室信息"}, en={"title": "Studio details"}, fr={"title": "Coordonnées du studio"}),
            ),
            SitePageBlock(
                id="contact-form", type="contact_form", admin_label="Contact form",
                content=_content(
                    zh={"title": "发送消息", "label": "提交表单", "placeholder": "请输入您的问题", "success_message": "邮件窗口已打开，请检查并发送您的消息。"},
                    en={"title": "Send a message", "label": "Submit form", "placeholder": "Tell us how we can help", "success_message": "Your email app opened. Please review and send your message."},
                    fr={"title": "Envoyer un message", "label": "Envoyer", "placeholder": "Dites-nous comment nous pouvons vous aider", "success_message": "Votre application de courriel est ouverte. Vérifiez puis envoyez votre message."},
                ),
            ),
        ],
    )


DEFAULTS = {"about": _about_defaults_v2, "contact": _contact_defaults_v2}
FORM_FIELD_DEFAULTS = {
    "zh": {"name_label": "\u59d3\u540d", "email_label": "\u90ae\u7bb1", "subject_label": "\u4e3b\u9898", "message_label": "\u7559\u8a00", "primary_label": "\u53d1\u9001\u6d88\u606f"},
    "en": {"name_label": "Name", "email_label": "Email", "subject_label": "Subject", "message_label": "Message", "primary_label": "Send message"},
    "fr": {"name_label": "Nom", "email_label": "Courriel", "subject_label": "Objet", "message_label": "Message", "primary_label": "Envoyer"},
}


def _normalize_page(page: SitePageDocument) -> SitePageDocument:
    """Fill fields added after V1 without overwriting saved editor content."""
    for block in [page.hero, *page.blocks]:
        if block.type != "contact_form":
            continue
        for locale, defaults in FORM_FIELD_DEFAULTS.items():
            content = getattr(block.content, locale)
            content.name_label = content.name_label or defaults["name_label"]
            content.email_label = content.email_label or defaults["email_label"]
            content.subject_label = content.subject_label or defaults["subject_label"]
            content.message_label = content.message_label or defaults["message_label"]
            content.primary_label = content.primary_label or content.label or defaults["primary_label"]
    return page


def _permission(slug: str) -> str:
    return f"content.pages.{slug}"


def _parse_document(raw: str | None, slug: str) -> SitePageDocument:
    try:
        if raw:
            return _normalize_page(SitePageDocument.model_validate(json.loads(raw)))
    except (TypeError, ValueError, json.JSONDecodeError):
        pass
    return _normalize_page(DEFAULTS[slug]())


def _get_row(db: Session, slug: str, create: bool = False) -> SitePageDocumentModel | None:
    row = db.query(SitePageDocumentModel).filter(SitePageDocumentModel.slug == slug).first()
    if row is None and create:
        page = DEFAULTS[slug]().model_dump(mode="json")
        row = SitePageDocumentModel(slug=slug, schema_version=1, draft_json=json.dumps(page, ensure_ascii=False), published_json=json.dumps(page, ensure_ascii=False), is_dirty=False, published_at=datetime.now(timezone.utc))
        db.add(row)
        db.flush()
    return row


def _check_href(value: str) -> bool:
    if not value:
        return True
    parsed = urlparse(value)
    return value.startswith("/") or parsed.scheme in {"https", "http", "mailto", "tel"} and bool(parsed.netloc or parsed.scheme in {"mailto", "tel"})


def _validate_page(page: SitePageDocument, settings: SystemSettings) -> list[str]:
    errors: list[str] = []
    if not page.hero.content.zh.title.strip():
        errors.append("hero.title.zh is required")
    blocks = [page.hero, *page.blocks]
    for block in blocks:
        if not _check_href(block.href):
            errors.append(f"{block.id}.href is invalid")
        if block.image_url and not block.decorative_image and not block.content.zh.alt_text.strip():
            errors.append(f"{block.id}.content.zh.alt_text is required")
    if page.slug == "contact" and any(block.is_enabled and block.type == "contact_form" for block in page.blocks):
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", settings.contact_email or ""):
            errors.append("contact_email must be valid when the contact form is enabled")
    return errors


def _warnings(page: SitePageDocument) -> list[str]:
    warnings: list[str] = []
    for block in [page.hero, *page.blocks]:
        for locale in ("en", "fr"):
            content = getattr(block.content, locale)
            if block.content.zh.title.strip() and not content.title.strip():
                warnings.append(f"{block.id}: {locale} title falls back to Chinese")
            if block.content.zh.body.strip() and not content.body.strip():
                warnings.append(f"{block.id}: {locale} body falls back to Chinese")
    return warnings


def _require_page_user(slug: str, manage: bool):
    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        return require_user_permission(user, db, _permission(slug), "manage" if manage else "view")
    return dependency


@router.get("/{slug}")
def public_page(slug: str, locale: str = Query("zh"), db: Session = Depends(get_db)):
    if slug not in PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Page not found")
    row = _get_row(db, slug)
    page = _parse_document(row.published_json if row else "", slug)
    settings = db.query(SystemSettings).first()
    return {"page": page.model_dump(mode="json"), "locale": locale, "contact": {"email": settings.contact_email if settings else "", "phone": settings.contact_phone if settings else "", "address": (settings.contact_address if settings else "") or "2527 Baseline Rd, Ottawa, ON K2C 0E3", "social": {"youtube": settings.youtube_url if settings else "", "instagram": settings.instagram_url if settings else ""}}}


@router.get("/admin/{slug}/draft", response_model=SitePageDraftResponse)
def get_page_draft(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if slug not in PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Page not found")
    require_user_permission(user, db, _permission(slug), "view")
    row = _get_row(db, slug, create=True)
    page = _parse_document(row.draft_json, slug)
    # Persist a newly initialized document. Without this commit, the GET
    # response looked correct but the row was rolled back when the request
    # session closed and every subsequent edit started from a transient copy.
    db.commit()
    return SitePageDraftResponse(page=page, is_dirty=bool(row.is_dirty), published_at=row.published_at.isoformat() if row.published_at else None, warnings=_warnings(page))


@router.put("/admin/{slug}/draft", response_model=SitePageDraftResponse)
def save_page_draft(slug: str, page: SitePageDocument, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if slug not in PAGE_SLUGS or page.slug != slug:
        raise HTTPException(status_code=404, detail="Page not found")
    require_user_permission(user, db, _permission(slug), "manage")
    row = _get_row(db, slug, create=True)
    row.draft_json = json.dumps(page.model_dump(mode="json"), ensure_ascii=False)
    row.schema_version = page.schema_version
    row.is_dirty = True
    row.updated_by_id = user.id
    db.commit()
    return SitePageDraftResponse(page=page, is_dirty=True, published_at=row.published_at.isoformat() if row.published_at else None, warnings=_warnings(page))


@router.post("/admin/{slug}/publish", response_model=SitePageDraftResponse)
def publish_page(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if slug not in PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Page not found")
    require_user_permission(user, db, _permission(slug), "manage")
    row = _get_row(db, slug, create=True)
    page = _parse_document(row.draft_json, slug)
    settings = db.query(SystemSettings).first() or SystemSettings()
    errors = _validate_page(page, settings)
    if errors:
        raise HTTPException(status_code=422, detail={"code": "page_publish_invalid", "errors": errors, "warnings": _warnings(page)})
    row.published_json = json.dumps(page.model_dump(mode="json"), ensure_ascii=False)
    row.is_dirty = False
    row.published_at = datetime.now(timezone.utc)
    row.updated_by_id = user.id
    db.commit()
    return SitePageDraftResponse(page=page, is_dirty=False, published_at=row.published_at.isoformat(), warnings=_warnings(page))
