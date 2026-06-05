import json
import re
import socket
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status

from app.core.ai_translation_rules import (
    LOCALE_NAMES,
    filter_translatable_fields,
    normalize_locale,
    validate_locales,
)
from app.core.config import settings
from app.schemas.ai import AiDraft, AiExtractItem, AiExtractManyResponse, AiTranslateResponse


class AiConfigurationError(RuntimeError):
    pass


@dataclass
class AiRuntimeConfig:
    enabled: bool
    api_base_url: str
    api_key: str
    model: str
    timeout_seconds: int


def default_ai_config() -> AiRuntimeConfig:
    return AiRuntimeConfig(
        enabled=settings.AI_ENABLED,
        api_base_url=settings.AI_API_BASE_URL,
        api_key=settings.AI_API_KEY,
        model=settings.AI_MODEL,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
    )


def ensure_ai_configured(config: AiRuntimeConfig | None = None) -> AiRuntimeConfig:
    resolved = config or default_ai_config()
    if not resolved.enabled:
        raise AiConfigurationError("AI is disabled. Enable it in System Settings > AI API.")
    if not resolved.api_key:
        raise AiConfigurationError("AI API key is missing in System Settings > AI API.")
    if not resolved.model:
        raise AiConfigurationError("AI model is missing in System Settings > AI API.")
    return resolved


def ai_unavailable_exception(error: Exception) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=str(error),
    )


def _strip_json_fence(content: str) -> str:
    text = content.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, flags=re.DOTALL)
    return match.group(1).strip() if match else text


def _provider_error_message(status_code: int, body: str) -> str:
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        parsed = None

    message = ""
    if isinstance(parsed, dict):
        error = parsed.get("error")
        if isinstance(error, dict):
            message = str(error.get("message") or error.get("detail") or "")
        elif isinstance(error, str):
            message = error
        elif isinstance(parsed.get("detail"), str):
            message = str(parsed["detail"])
        elif isinstance(parsed.get("message"), str):
            message = str(parsed["message"])

    if not message:
        message = body[:500]

    if "Operation canceled" in message:
        message = (
            f"{message} The local LLM server canceled model loading/generation before the app timeout. "
            "Keep the model warm or choose a loaded model, then retry."
        )
    return f"AI provider error {status_code}: {message}"


def _call_chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
    config: AiRuntimeConfig | None = None,
) -> dict[str, Any]:
    resolved = ensure_ai_configured(config)
    base_url = resolved.api_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    payload: dict[str, Any] = {
        "model": resolved.model,
        "messages": messages,
        "temperature": temperature,
        "stream": True,
        "response_format": {"type": "json_object"},
    }

    def send(body: dict[str, Any]) -> dict[str, Any]:
        data = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {resolved.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=resolved.timeout_seconds) as response:
            if body.get("stream"):
                content_parts: list[str] = []
                for raw_line in response:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line or not line.startswith("data:"):
                        continue
                    event = line.removeprefix("data:").strip()
                    if event == "[DONE]":
                        break
                    try:
                        chunk = json.loads(event)
                    except json.JSONDecodeError:
                        continue
                    choices = chunk.get("choices")
                    if not isinstance(choices, list) or not choices:
                        continue
                    choice = choices[0]
                    if not isinstance(choice, dict):
                        continue
                    delta = choice.get("delta")
                    if isinstance(delta, dict) and isinstance(delta.get("content"), str):
                        content_parts.append(delta["content"])
                    elif isinstance(choice.get("text"), str):
                        content_parts.append(choice["text"])
                    message = choice.get("message")
                    if isinstance(message, dict) and isinstance(message.get("content"), str):
                        content_parts.append(message["content"])
                return {"choices": [{"message": {"content": "".join(content_parts)}}]}

            raw = response.read().decode("utf-8")
        return json.loads(raw)

    try:
        while True:
            try:
                return send(payload)
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8", errors="replace")
                if exc.code == 400 and "response_format" in body and "response_format" in payload:
                    payload.pop("response_format", None)
                    continue
                if exc.code == 400 and "stream" in body and payload.get("stream"):
                    payload["stream"] = False
                    continue
                raise RuntimeError(_provider_error_message(exc.code, body)) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"AI provider network error: {exc.reason}") from exc
    except (TimeoutError, socket.timeout) as exc:
        raise RuntimeError(f"AI provider request timed out after {resolved.timeout_seconds} seconds") from exc
    except OSError as exc:
        raise RuntimeError(f"AI provider connection error: {exc}") from exc


def chat_json(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
    config: AiRuntimeConfig | None = None,
) -> dict[str, Any]:
    response = _call_chat_completion(messages, temperature=temperature, config=config)
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("AI provider returned an invalid response shape") from exc

    try:
        parsed = json.loads(_strip_json_fence(content))
    except json.JSONDecodeError as exc:
        raise RuntimeError("AI provider did not return valid JSON") from exc
    if not isinstance(parsed, dict):
        raise RuntimeError("AI provider JSON root must be an object")
    return parsed


def translate_fields(
    *,
    module: str,
    source_locale: str,
    target_locales: list[str],
    fields: dict[str, str],
    tone: str | None = None,
    config: AiRuntimeConfig | None = None,
) -> AiTranslateResponse:
    source = normalize_locale(source_locale)
    targets = validate_locales(target_locales)
    clean_fields = filter_translatable_fields(module, fields)
    if not clean_fields:
        raise ValueError("No translatable fields were provided for this module.")

    system = (
        "You translate and localize dance school website CMS content. "
        "Return strict JSON only. Preserve markdown structure, links, dates, names, prices, "
        "phone numbers, URLs, and image markdown. Do not invent facts. "
        "Only return fields that were provided by the user. If a target locale is the same "
        "as the source locale, rewrite and organize the original text in that same language "
        "so it is clear, polished, and ready for publication."
    )
    user = {
        "module": module,
        "source_locale": source,
        "target_locales": targets,
        "target_locale_names": {locale: LOCALE_NAMES[locale] for locale in targets},
        "tone": tone or "clear, professional, parent-friendly dance school copy",
        "fields": clean_fields,
        "required_json_shape": {
            "drafts": [
                {
                    "locale": "en",
                    "fields": {"title": "translated title"},
                    "warnings": ["optional warning"],
                }
            ],
            "warnings": ["optional global warning"],
        },
    }

    parsed = chat_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        config=config,
    )

    drafts: list[AiDraft] = []
    global_warnings = parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else []
    raw_drafts = parsed.get("drafts")
    if not isinstance(raw_drafts, list):
        raise RuntimeError("AI translation JSON is missing drafts[]")

    allowed_keys = set(clean_fields.keys())
    for item in raw_drafts:
        if not isinstance(item, dict):
            continue
        locale = normalize_locale(str(item.get("locale", "")))
        if locale not in targets:
            continue
        raw_fields = item.get("fields")
        if not isinstance(raw_fields, dict):
            continue
        translated = {
            key: str(value)
            for key, value in raw_fields.items()
            if key in allowed_keys and isinstance(value, (str, int, float))
        }
        warnings = item.get("warnings") if isinstance(item.get("warnings"), list) else []
        drafts.append(AiDraft(locale=locale, fields=translated, warnings=[str(w) for w in warnings]))

    missing = [locale for locale in targets if locale not in {draft.locale for draft in drafts}]
    if missing:
        global_warnings.append(f"AI did not return drafts for: {', '.join(missing)}")

    return AiTranslateResponse(
        module=module,
        source_locale=source,
        drafts=drafts,
        warnings=[str(w) for w in global_warnings],
    )


EXTRACT_FIELD_ALLOWLIST = {
    "schedules": {
        "title",
        "description",
        "location",
        "day_of_week",
        "start_time",
        "end_time",
        "order_index",
    },
    "faculty": {
        "name",
        "role",
        "bio",
        "specialties",
        "achievements",
        "photo_url",
        "order_index",
    },
}


def _extract_allowed_fields(module: str, target_fields: list[str]) -> list[str]:
    allowed = EXTRACT_FIELD_ALLOWLIST.get(module)
    if not allowed:
        raise ValueError(f"Unsupported AI extract module: {module}")
    requested = [field for field in target_fields if field in allowed]
    return requested or sorted(allowed)


def extract_fields_from_text(
    *,
    module: str,
    source_locale: str,
    target_locales: list[str],
    raw_text: str,
    target_fields: list[str],
    instruction: str | None = None,
    config: AiRuntimeConfig | None = None,
) -> AiTranslateResponse:
    source = normalize_locale(source_locale)
    targets = validate_locales(target_locales)
    fields = _extract_allowed_fields(module, target_fields)
    text = raw_text.strip()
    if not text:
        raise ValueError("Paste some text before asking AI to fill the form.")

    system = (
        "You extract structured CMS form fields for a dance school admin panel. "
        "Return strict JSON only. Use the provided raw text as the only source of facts. "
        "Do not invent names, dates, prices, phone numbers, URLs, locations, or credentials. "
        "For each target locale, return natural localized field values. "
        "For schedules, day_of_week must be 0 for Sunday, 1 for Monday, through 6 for Saturday; "
        "start_time and end_time must be 24-hour HH:MM. If an exact value is missing, omit that field. "
        "For multiline list fields like specialties and achievements, use newline-separated text."
    )
    user = {
        "module": module,
        "source_locale": source,
        "target_locales": targets,
        "target_locale_names": {locale: LOCALE_NAMES[locale] for locale in targets},
        "target_fields": fields,
        "raw_text": text,
        "instruction": instruction or "",
        "required_json_shape": {
            "drafts": [
                {
                    "locale": "zh",
                    "fields": {field: "extracted or localized value" for field in fields},
                    "warnings": ["optional warning"],
                }
            ],
            "warnings": ["optional global warning"],
        },
    }

    parsed = chat_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        config=config,
    )

    drafts: list[AiDraft] = []
    global_warnings = parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else []
    raw_drafts = parsed.get("drafts")
    if not isinstance(raw_drafts, list):
        raise RuntimeError("AI extraction JSON is missing drafts[]")

    allowed_keys = set(fields)
    for item in raw_drafts:
        if not isinstance(item, dict):
            continue
        locale = normalize_locale(str(item.get("locale", "")))
        if locale not in targets:
            continue
        raw_fields = item.get("fields")
        if not isinstance(raw_fields, dict):
            continue
        extracted = {
            key: str(value).strip()
            for key, value in raw_fields.items()
            if key in allowed_keys and isinstance(value, (str, int, float)) and str(value).strip()
        }
        warnings = item.get("warnings") if isinstance(item.get("warnings"), list) else []
        drafts.append(AiDraft(locale=locale, fields=extracted, warnings=[str(w) for w in warnings]))

    missing = [locale for locale in targets if locale not in {draft.locale for draft in drafts}]
    if missing:
        global_warnings.append(f"AI did not return drafts for: {', '.join(missing)}")

    return AiTranslateResponse(
        module=module,
        source_locale=source,
        drafts=drafts,
        warnings=[str(w) for w in global_warnings],
    )


def _parse_extract_drafts(raw_drafts: Any, targets: list[str], allowed_keys: set[str]) -> list[AiDraft]:
    drafts: list[AiDraft] = []
    if not isinstance(raw_drafts, list):
        return drafts
    for draft in raw_drafts:
        if not isinstance(draft, dict):
            continue
        locale = normalize_locale(str(draft.get("locale", "")))
        if locale not in targets:
            continue
        raw_fields = draft.get("fields")
        if not isinstance(raw_fields, dict):
            continue
        extracted = {
            key: str(value).strip()
            for key, value in raw_fields.items()
            if key in allowed_keys and isinstance(value, (str, int, float)) and str(value).strip()
        }
        warnings = draft.get("warnings") if isinstance(draft.get("warnings"), list) else []
        drafts.append(AiDraft(locale=locale, fields=extracted, warnings=[str(w) for w in warnings]))
    return drafts


def extract_many_fields_from_text(
    *,
    module: str,
    source_locale: str,
    target_locales: list[str],
    raw_text: str,
    target_fields: list[str],
    instruction: str | None = None,
    max_items: int = 20,
    config: AiRuntimeConfig | None = None,
) -> AiExtractManyResponse:
    source = normalize_locale(source_locale)
    targets = validate_locales(target_locales)
    fields = _extract_allowed_fields(module, target_fields)
    text = raw_text.strip()
    if not text:
        raise ValueError("Paste some text before asking AI to create schedule items.")
    if module != "schedules":
        raise ValueError("Bulk AI extraction is currently supported for schedules only.")

    system = (
        "You extract multiple class schedule records for a dance school admin panel. "
        "Return strict JSON only. Use the provided raw text as the only source of facts. "
        "If the text says a range like Monday to Friday, create one item for each weekday in that range. "
        "If the text contains multiple lines or multiple classes, create one item per class occurrence. "
        "For every item and target locale, return natural localized field values. "
        "day_of_week must be 0 for Sunday, 1 for Monday, through 6 for Saturday. "
        "start_time and end_time must be 24-hour HH:MM. Omit fields that are not known. "
        "Do not create more items than max_items."
    )
    user = {
        "module": module,
        "source_locale": source,
        "target_locales": targets,
        "target_locale_names": {locale: LOCALE_NAMES[locale] for locale in targets},
        "target_fields": fields,
        "max_items": max_items,
        "raw_text": text,
        "instruction": instruction or "",
        "required_json_shape": {
            "items": [
                {
                    "drafts": [
                        {
                            "locale": "zh",
                            "fields": {field: "extracted or localized value" for field in fields},
                            "warnings": ["optional warning"],
                        }
                    ],
                    "warnings": ["optional warning for this item"],
                }
            ],
            "warnings": ["optional global warning"],
        },
    }

    parsed = chat_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        config=config,
    )

    allowed_keys = set(fields)
    raw_items = parsed.get("items")
    if not isinstance(raw_items, list):
        raise RuntimeError("AI extraction JSON is missing items[]")

    items: list[AiExtractItem] = []
    for raw_item in raw_items[:max_items]:
        if not isinstance(raw_item, dict):
            continue
        drafts = _parse_extract_drafts(raw_item.get("drafts"), targets, allowed_keys)
        if not drafts:
            continue
        warnings = raw_item.get("warnings") if isinstance(raw_item.get("warnings"), list) else []
        items.append(AiExtractItem(drafts=drafts, warnings=[str(w) for w in warnings]))

    global_warnings = parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else []
    if not items:
        raise RuntimeError("AI did not extract any schedule items.")

    return AiExtractManyResponse(
        module=module,
        source_locale=source,
        items=items,
        warnings=[str(w) for w in global_warnings],
    )
