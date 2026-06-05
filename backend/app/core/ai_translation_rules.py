SUPPORTED_AI_LOCALES = {"zh", "en", "fr"}

LOCALE_NAMES = {
    "zh": "Simplified Chinese",
    "en": "English",
    "fr": "French",
}

MODULE_FIELD_ALLOWLIST = {
    "homepage": {
        "badge",
        "title",
        "subtitle",
        "primary_label",
        "secondary_label",
        "cta_title",
        "cta_subtitle",
        "cta_note",
        "cta_primary_label",
        "cta_secondary_label",
        "description",
        "body",
    },
    "articles": {"title", "summary", "body"},
    "news": {"title", "summary", "body"},
    "events": {"title", "summary", "description", "body", "location"},
    "performances": {"title", "description", "venue"},
    "programs": {"name", "title", "summary", "description", "body", "level", "syllabus_ref"},
    "schedules": {"title", "summary", "description", "body", "location"},
    "faculty": {"name", "title", "role", "bio", "specialties", "achievements"},
    "classrooms": {"name", "title", "description", "features", "notes_title", "notes_body", "body"},
    "pricing": {
        "program_items_text",
        "info_cards_text",
        "payment_title",
        "payment_columns_text",
        "rental_items_text",
        "rental_notes_title",
        "rental_notes_body",
    },
    "settings": {
        "site_name",
        "tagline",
        "school_policy",
        "body",
        "announcement_text",
        "footer_description",
        "footer_newsletter_title",
        "footer_newsletter_text",
        "copyright_text",
        "contact_address",
    },
    "school_policy": {"title", "body", "body_markdown"},
}


def allowed_fields_for_module(module: str) -> set[str]:
    return MODULE_FIELD_ALLOWLIST.get(module, set())


def normalize_locale(locale: str) -> str:
    if locale == "zh-Hant":
        return "zh"
    return locale


def validate_locales(locales: list[str]) -> list[str]:
    normalized = []
    for locale in locales:
        value = normalize_locale(locale)
        if value not in SUPPORTED_AI_LOCALES:
            raise ValueError(f"Unsupported locale: {locale}")
        if value not in normalized:
            normalized.append(value)
    return normalized


def filter_translatable_fields(module: str, fields: dict[str, str]) -> dict[str, str]:
    allowed = allowed_fields_for_module(module)
    if not allowed:
        raise ValueError(f"Unsupported AI module: {module}")
    return {
        key: value
        for key, value in fields.items()
        if key in allowed and isinstance(value, str) and value.strip()
    }
