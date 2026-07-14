import json
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.core.permissions import require_user_permission
from app.core.translations import localized_value, set_translation_bundle, translation_bundle
from app.models import (
    PricingCatalog, PricingContentBlock, PricingOption, PricingPlan,
    Program, Studio, StudioRoom, SystemSettings, User,
)
from app.schemas.pricing import PricingCatalogDraft, PricingCatalogResponse, PricingPublishResponse

router = APIRouter()
KINDS = {"program", "rental"}


def pricing_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> tuple[User, Session]:
    payload = decode_token(token)
    user = db.query(User).filter(User.id == (payload or {}).get("sub"), User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return user, db


def require_pricing_view(auth: tuple[User, Session] = Depends(pricing_user)) -> User:
    user, db = auth
    return require_user_permission(user, db, "teaching.pricing", "view")


def require_pricing_manage(auth: tuple[User, Session] = Depends(pricing_user)) -> User:
    user, db = auth
    return require_user_permission(user, db, "teaching.pricing", "manage")


def _json_list(raw: str | None) -> list:
    try:
        value = json.loads(raw or "[]")
        return value if isinstance(value, list) else []
    except (TypeError, ValueError):
        return []


def _catalog(db: Session, kind: str) -> PricingCatalog:
    if kind not in KINDS:
        raise HTTPException(status_code=404, detail="Pricing catalog not found")
    item = db.query(PricingCatalog).filter(PricingCatalog.kind == kind).first()
    if item:
        return item
    defaults = {
        "program": ("课程价格", "选择适合学习安排的课程或课时方案。"),
        "rental": ("教室租赁价格", "查看可出租教室的价格并提交租赁申请。"),
    }
    item = PricingCatalog(kind=kind, title=defaults[kind][0], subtitle=defaults[kind][1], is_dirty=True)
    db.add(item); db.commit(); db.refresh(item)
    return item


def _option_dict(option: PricingOption, locale: str | None = None, translations: bool = False) -> dict:
    data = {
        "id": option.id, "label": localized_value(option, "label", locale),
        "amount": str(option.amount), "currency": option.currency, "unit": localized_value(option, "unit", locale),
        "note": localized_value(option, "note", locale), "sort_order": option.sort_order,
        "translations": translation_bundle(option) if translations else {},
    }
    return data


def _plan_dict(db: Session, plan: PricingPlan, locale: str | None = None, translations: bool = False) -> dict:
    program = db.query(Program).filter(Program.id == plan.program_id).first() if plan.program_id else None
    room = db.query(StudioRoom).filter(StudioRoom.id == plan.room_id).first() if plan.room_id else None
    studio = db.query(Studio).filter(Studio.id == room.studio_id).first() if room else None
    options = db.query(PricingOption).filter(PricingOption.plan_id == plan.id).order_by(PricingOption.sort_order, PricingOption.id).all()
    return {
        "id": plan.id, "program_id": plan.program_id, "room_id": plan.room_id,
        "title": localized_value(plan, "title", locale), "description": localized_value(plan, "description", locale),
        "badge": localized_value(plan, "badge", locale), "image_url": plan.image_url or "",
        "details": _localized_list(plan, "details", locale), "is_active": bool(plan.is_active),
        "is_featured": bool(plan.is_featured), "sort_order": plan.sort_order,
        "translations": translation_bundle(plan) if translations else {},
        "options": [_option_dict(option, locale, translations) for option in options],
        "program_name": localized_value(program, "name", locale) if program else "",
        "room_name": room.name if room else "", "studio_name": studio.name if studio else "",
        "room_is_rentable": bool(room and room.is_active and room.is_rentable and studio and studio.is_active),
    }


def _localized_list(obj, field: str, locale: str | None) -> list[str]:
    bundle = translation_bundle(obj)
    normalized = "fr" if (locale or "").startswith("fr") else "en" if (locale or "").startswith("en") else "zh"
    translated = bundle.get(normalized, {}).get(field)
    if isinstance(translated, list):
        return [str(item) for item in translated]
    return [str(item) for item in _json_list(getattr(obj, f"{field}_json", None))]


def _block_dict(block: PricingContentBlock, locale: str | None = None, translations: bool = False) -> dict:
    return {
        "id": block.id, "block_type": block.block_type,
        "title": localized_value(block, "title", locale), "body": localized_value(block, "body", locale),
        "items": _localized_list(block, "items", locale), "is_active": bool(block.is_active),
        "sort_order": block.sort_order, "translations": translation_bundle(block) if translations else {},
    }


def _draft_response(db: Session, catalog: PricingCatalog, locale: str | None = None, translations: bool = True) -> dict:
    plans = db.query(PricingPlan).filter(PricingPlan.catalog_id == catalog.id).order_by(PricingPlan.sort_order, PricingPlan.id).all()
    blocks = db.query(PricingContentBlock).filter(PricingContentBlock.catalog_id == catalog.id).order_by(PricingContentBlock.sort_order, PricingContentBlock.id).all()
    return {
        "id": catalog.id, "kind": catalog.kind, "title": localized_value(catalog, "title", locale),
        "subtitle": localized_value(catalog, "subtitle", locale),
        "translations": translation_bundle(catalog) if translations else {},
        "plans": [_plan_dict(db, plan, locale, translations) for plan in plans],
        "blocks": [_block_dict(block, locale, translations) for block in blocks],
        "is_dirty": bool(catalog.is_dirty), "published_at": catalog.published_at,
    }


def _replace_draft(db: Session, catalog: PricingCatalog, payload: PricingCatalogDraft) -> PricingCatalog:
    catalog.title, catalog.subtitle = payload.title.strip(), payload.subtitle
    set_translation_bundle(catalog, payload.translations)
    db.query(PricingContentBlock).filter(PricingContentBlock.catalog_id == catalog.id).delete(synchronize_session=False)
    plan_ids = [row[0] for row in db.query(PricingPlan.id).filter(PricingPlan.catalog_id == catalog.id).all()]
    if plan_ids:
        db.query(PricingOption).filter(PricingOption.plan_id.in_(plan_ids)).delete(synchronize_session=False)
    db.query(PricingPlan).filter(PricingPlan.catalog_id == catalog.id).delete(synchronize_session=False)
    for index, plan_data in enumerate(payload.plans):
        plan = PricingPlan(
            catalog_id=catalog.id, program_id=plan_data.program_id or None, room_id=plan_data.room_id or None,
            title=plan_data.title.strip(), description=plan_data.description, badge=plan_data.badge,
            image_url=plan_data.image_url, details_json=json.dumps(plan_data.details, ensure_ascii=False),
            is_active=plan_data.is_active, is_featured=plan_data.is_featured, sort_order=index,
        )
        set_translation_bundle(plan, plan_data.translations); db.add(plan); db.flush()
        for option_index, option_data in enumerate(plan_data.options):
            option = PricingOption(
                plan_id=plan.id, label=option_data.label.strip(), amount=option_data.amount,
                currency=option_data.currency.upper(), unit=option_data.unit, note=option_data.note,
                sort_order=option_index,
            )
            set_translation_bundle(option, option_data.translations); db.add(option)
    for index, block_data in enumerate(payload.blocks):
        block = PricingContentBlock(
            catalog_id=catalog.id, block_type=block_data.block_type, title=block_data.title.strip(),
            body=block_data.body, items_json=json.dumps(block_data.items, ensure_ascii=False),
            is_active=block_data.is_active, sort_order=index,
        )
        set_translation_bundle(block, block_data.translations); db.add(block)
    catalog.is_dirty = True; db.commit(); db.refresh(catalog)
    return catalog


def _validate_publish(db: Session, catalog: PricingCatalog) -> list[str]:
    errors: list[str] = []
    catalog_translations = translation_bundle(catalog)
    for locale in ("zh", "en", "fr"):
        if not str(catalog_translations.get(locale, {}).get("title") or "").strip():
            errors.append(f"Catalog title is missing for {locale}")
    plans = db.query(PricingPlan).filter(PricingPlan.catalog_id == catalog.id, PricingPlan.is_active.is_(True)).all()
    if not plans: errors.append("At least one active pricing plan is required")
    used_room_ids: set[str] = set()
    for plan in plans:
        label = plan.title or plan.id
        if not plan.title.strip(): errors.append(f"Plan {plan.id} needs a name")
        plan_translations = translation_bundle(plan)
        for locale in ("zh", "en", "fr"):
            if not str(plan_translations.get(locale, {}).get("title") or "").strip():
                errors.append(f"{label}: name is missing for {locale}")
        if catalog.kind == "rental":
            room = db.query(StudioRoom).filter(StudioRoom.id == plan.room_id).first() if plan.room_id else None
            studio = db.query(Studio).filter(Studio.id == room.studio_id).first() if room else None
            if not room or not studio or not room.is_active or not studio.is_active or not room.is_rentable:
                errors.append(f"{label}: linked room is not active and rentable")
            if plan.room_id in used_room_ids:
                errors.append(f"{label}: the same room can only have one active pricing plan")
            if plan.room_id: used_room_ids.add(plan.room_id)
        options = db.query(PricingOption).filter(PricingOption.plan_id == plan.id).all()
        if not options: errors.append(f"{label}: at least one price option is required")
        for option in options:
            if not option.label.strip(): errors.append(f"{label}: every price needs a label")
            if Decimal(option.amount or 0) <= 0: errors.append(f"{label}: prices must be greater than zero")
            option_translations = translation_bundle(option)
            for locale in ("zh", "en", "fr"):
                if not str(option_translations.get(locale, {}).get("label") or "").strip():
                    errors.append(f"{label}: a price label is missing for {locale}")
    blocks = db.query(PricingContentBlock).filter(PricingContentBlock.catalog_id == catalog.id, PricingContentBlock.is_active.is_(True)).all()
    for block in blocks:
        block_translations = translation_bundle(block)
        for locale in ("zh", "en", "fr"):
            if not str(block_translations.get(locale, {}).get("title") or "").strip():
                errors.append(f"Content block {block.id}: title is missing for {locale}")
    return errors


@router.get("/public/{kind}")
def public_catalog(kind: str, locale: str = Query("en"), db: Session = Depends(get_db)):
    catalog = _catalog(db, kind)
    if not catalog.published_json:
        return {"kind": kind, "title": "", "subtitle": "", "plans": [], "blocks": [], "published_at": None}
    try:
        snapshot = json.loads(catalog.published_json)
    except (TypeError, ValueError):
        snapshot = {}
    localized = (snapshot.get("locales") or {}).get("fr" if locale.startswith("fr") else "zh" if locale.startswith("zh") else "en")
    return localized or {"kind": kind, "title": "", "subtitle": "", "plans": [], "blocks": [], "published_at": catalog.published_at}


@router.get("/admin/{kind}", response_model=PricingCatalogResponse)
def admin_catalog(kind: str, user: User = Depends(require_pricing_view), db: Session = Depends(get_db)):
    return _draft_response(db, _catalog(db, kind))


@router.put("/admin/{kind}", response_model=PricingCatalogResponse)
def save_catalog(kind: str, payload: PricingCatalogDraft, user: User = Depends(require_pricing_manage), db: Session = Depends(get_db)):
    if payload.kind != kind: raise HTTPException(status_code=400, detail="Catalog kind does not match route")
    catalog = _replace_draft(db, _catalog(db, kind), payload)
    return _draft_response(db, catalog)


@router.post("/admin/{kind}/publish", response_model=PricingPublishResponse)
def publish_catalog(kind: str, user: User = Depends(require_pricing_manage), db: Session = Depends(get_db)):
    catalog = _catalog(db, kind)
    errors = _validate_publish(db, catalog)
    if errors: raise HTTPException(status_code=422, detail={"message": "Pricing catalog is not ready to publish", "errors": errors})
    locales = {}
    for locale in ("zh", "en", "fr"):
        value = _draft_response(db, catalog, locale, translations=False)
        value["plans"] = [plan for plan in value["plans"] if plan["is_active"]]
        value["blocks"] = [block for block in value["blocks"] if block["is_active"]]
        locales[locale] = value
    catalog.published_at = datetime.utcnow(); catalog.is_dirty = False
    catalog.published_json = json.dumps({"version": 1, "locales": locales}, ensure_ascii=False, default=str)
    db.commit(); db.refresh(catalog)
    return {"catalog": _draft_response(db, catalog), "warnings": []}
