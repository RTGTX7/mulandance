import json
from typing import Iterable

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session


LOCALES = ("zh", "en", "fr")


def normalize_locale(locale: str | None) -> str:
    value = (locale or "zh").lower()
    if value.startswith("fr"):
        return "fr"
    if value.startswith("en"):
        return "en"
    return "zh"


def parse_translations(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def dump_translations(value: dict | None) -> str:
    cleaned: dict[str, dict] = {}
    for locale in LOCALES:
        entry = (value or {}).get(locale)
        cleaned[locale] = entry if isinstance(entry, dict) else {}
    return json.dumps(cleaned, ensure_ascii=False)


def translation_bundle(obj) -> dict:
    return parse_translations(getattr(obj, "translations_json", None))


def set_translation_bundle(obj, value: dict | None) -> None:
    setattr(obj, "translations_json", dump_translations(value))


def localized_value(obj, field: str, locale: str | None):
    normalized = normalize_locale(locale)
    translations = translation_bundle(obj)
    value = translations.get(normalized, {}).get(field)
    if value not in (None, ""):
        return value
    fallback = getattr(obj, field, None)
    if fallback not in (None, ""):
        return fallback
    zh_value = translations.get("zh", {}).get(field)
    if zh_value not in (None, ""):
        return zh_value
    return ""


def localized_payload(obj, fields: Iterable[str], locale: str | None) -> dict:
    return {field: localized_value(obj, field, locale) for field in fields}


def ensure_text_column(db: Session, table_name: str, column_name: str = "translations_json") -> None:
    inspector = inspect(db.bind)
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name not in columns:
        db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} TEXT"))
        db.commit()
