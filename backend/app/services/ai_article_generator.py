import json
from dataclasses import dataclass

from app.core.ai_translation_rules import LOCALE_NAMES, normalize_locale, validate_locales
from app.schemas.ai import AiDraft, ImportedSource
from app.services.ai_translation import AiRuntimeConfig, chat_json


@dataclass
class GeneratedImportedContent:
    content_type: str
    suggested_category_slugs: list[str]
    suggested_tag_slugs: list[str]
    drafts: list[AiDraft]


def generate_article_drafts(
    *,
    source: ImportedSource,
    source_locale: str,
    target_locales: list[str],
    manual_text: str | None = None,
    extra_instruction: str | None = None,
    config: AiRuntimeConfig | None = None,
) -> list[AiDraft]:
    return generate_imported_content(
        source=source,
        source_locale=source_locale,
        target_locales=target_locales,
        manual_text=manual_text,
        extra_instruction=extra_instruction,
        config=config,
    ).drafts


def generate_imported_content(
    *,
    source: ImportedSource,
    source_locale: str,
    target_locales: list[str],
    manual_text: str | None = None,
    extra_instruction: str | None = None,
    available_category_slugs: list[str] | None = None,
    available_tag_slugs: list[str] | None = None,
    config: AiRuntimeConfig | None = None,
) -> GeneratedImportedContent:
    source_lang = normalize_locale(source_locale)
    targets = validate_locales(target_locales)
    image_urls = (
        ([media.url for media in source.media] or source.images[:3])
        if config and config.image_enabled
        else []
    )
    source_payload = {
        "url": source.url,
        "source_locale": source_lang,
        "title": source.title,
        "description": source.description,
        "text": source.text,
        "source_published_at": source.source_published_at,
        "is_video": source.is_video,
        "video_url": source.video_url,
        "manual_text": manual_text or "",
        "downloaded_image_urls": image_urls,
        "extra_instruction": extra_instruction or "",
        "available_category_slugs": available_category_slugs or [],
        "available_tag_slugs": available_tag_slugs or [],
        "target_locales": targets,
        "target_locale_names": {locale: LOCALE_NAMES[locale] for locale in targets},
        "required_json_shape": {
            "content_type": "news or performance",
            "suggested_category_slugs": ["only values from available_category_slugs"],
            "suggested_tag_slugs": ["only values from available_tag_slugs"],
            "drafts": [
                {
                    "locale": "zh",
                    "fields": {
                        "title": "title",
                        "summary": "news summary, news only",
                        "body": "markdown article body, news only",
                        "description": "performance description, performance only",
                        "venue": "performance venue, performance only",
                        "start_date": "ISO 8601 start datetime, performance only, only if source provides it",
                        "end_date": "ISO 8601 end datetime, performance only, only if source provides it",
                    },
                    "warnings": ["optional warning"],
                }
            ]
        },
    }
    system = (
        "You are a CMS assistant for a dance school. Classify each source as either "
        "'news' or 'performance'. Use 'performance' only when the source is mainly an "
        "event/show/performance listing and provides a specific start date or time. "
        "Otherwise use 'news'. Create concise drafts from provided source material. "
        "Return strict JSON only. Do not invent dates, prices, locations, awards, names, "
        "or contact details. If an image URL is provided, include it in news markdown only "
        "when it is relevant. If is_video is true, do not imply the video was downloaded; "
        "include a clear markdown link to video_url or the source URL for watching the video. "
        "Keep each locale natural and local. Suggested categories and "
        "tags must only use the provided available slugs."
    )
    parsed = chat_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(source_payload, ensure_ascii=False)},
        ],
        temperature=0.3,
        disable_thinking=True,
        config=config,
    )

    content_type = str(parsed.get("content_type") or "news").strip().lower()
    if content_type not in {"news", "performance"}:
        content_type = "news"

    suggested_category_slugs = [
        str(item)
        for item in parsed.get("suggested_category_slugs", [])
        if isinstance(item, str) and item in (available_category_slugs or [])
    ]
    suggested_tag_slugs = [
        str(item)
        for item in parsed.get("suggested_tag_slugs", [])
        if isinstance(item, str) and item in (available_tag_slugs or [])
    ]

    raw_drafts = parsed.get("drafts")
    if not isinstance(raw_drafts, list):
        raise RuntimeError("AI article JSON is missing drafts[]")

    drafts: list[AiDraft] = []
    allowed_fields = {
        "title",
        "summary",
        "body",
        "description",
        "venue",
        "start_date",
        "end_date",
    }
    for item in raw_drafts:
        if not isinstance(item, dict):
            continue
        locale = normalize_locale(str(item.get("locale", "")))
        if locale not in targets:
            continue
        raw_fields = item.get("fields")
        if not isinstance(raw_fields, dict):
            continue
        fields = {
            key: str(value)
            for key, value in raw_fields.items()
            if key in allowed_fields and isinstance(value, (str, int, float))
        }
        warnings = item.get("warnings") if isinstance(item.get("warnings"), list) else []
        drafts.append(AiDraft(locale=locale, fields=fields, warnings=[str(w) for w in warnings]))
    return GeneratedImportedContent(
        content_type=content_type,
        suggested_category_slugs=suggested_category_slugs,
        suggested_tag_slugs=suggested_tag_slugs,
        drafts=drafts,
    )
