import json
import re
import socket
import urllib.error
import urllib.request
from calendar import monthrange
from dataclasses import dataclass
from datetime import date
from typing import Any

from fastapi import HTTPException, status

from app.core.ai_translation_rules import (
    LOCALE_NAMES,
    filter_translatable_fields,
    normalize_locale,
    validate_locales,
)
from app.core.config import settings
from app.schemas.ai import (
    AiDraft,
    AiExtractItem,
    AiExtractManyResponse,
    AiTranslateResponse,
    FixedCourseImportDraft,
    FixedCourseImportIssue,
    FixedCourseLocalizedContent,
    FixedCourseImportSlot,
    FixedCourseImportResponse,
)


class AiConfigurationError(RuntimeError):
    pass


@dataclass
class AiRuntimeConfig:
    enabled: bool
    api_base_url: str
    api_key: str
    model: str
    timeout_seconds: int
    thinking_enabled: bool = False
    image_enabled: bool = False


def default_ai_config() -> AiRuntimeConfig:
    return AiRuntimeConfig(
        enabled=settings.AI_ENABLED,
        api_base_url=settings.AI_API_BASE_URL,
        api_key=settings.AI_API_KEY,
        model=settings.AI_MODEL,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
        thinking_enabled=False,
        image_enabled=False,
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


def _decode_json_object(content: str) -> dict[str, Any]:
    """Read the first complete JSON object even when a local model adds reasoning."""
    text = _strip_json_fence(content)
    candidates = [text]
    if "</think>" in text:
        candidates.insert(0, text.rsplit("</think>", 1)[1].strip())

    decoder = json.JSONDecoder()
    for candidate in candidates:
        for match in re.finditer(r"\{", candidate):
            try:
                value, _ = decoder.raw_decode(candidate[match.start():])
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                return value
    raise RuntimeError("AI provider did not return a JSON object")


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
    max_tokens: int | None = None,
    disable_thinking: bool = False,
    json_schema: dict[str, Any] | None = None,
    json_schema_name: str = "response",
    json_mode: bool = True,
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
    }
    if json_schema is not None:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": json_schema_name,
                "schema": json_schema,
                "strict": True,
            },
        }
    elif json_mode:
        payload["response_format"] = {"type": "json_object"}
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    if disable_thinking or not resolved.thinking_enabled:
        # Qwen-family OpenAI-compatible servers otherwise spend the completion
        # budget on hidden reasoning and can return an empty content field.
        payload["chat_template_kwargs"] = {"enable_thinking": False}
        # Ollama-compatible Qwen servers use this OpenAI-compatible field.
        # They can otherwise spend the entire completion budget in
        # reasoning_content and return no usable content at all.
        payload["reasoning_effort"] = "none"

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
                if exc.code == 400 and "chat_template_kwargs" in payload:
                    payload.pop("chat_template_kwargs", None)
                    continue
                if exc.code == 400 and "reasoning_effort" in payload:
                    payload.pop("reasoning_effort", None)
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
    max_tokens: int | None = None,
    disable_thinking: bool = False,
    json_schema: dict[str, Any] | None = None,
    json_schema_name: str = "response",
    json_mode: bool = True,
    config: AiRuntimeConfig | None = None,
) -> dict[str, Any]:
    response = _call_chat_completion(
        messages,
        temperature=temperature,
        max_tokens=max_tokens,
        disable_thinking=disable_thinking,
        json_schema=json_schema,
        json_schema_name=json_schema_name,
        json_mode=json_mode,
        config=config,
    )
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("AI provider returned an invalid response shape") from exc

    return _decode_json_object(content)


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
        disable_thinking=True,
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
        "days_of_week",
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
        "when more than one weekday is present, days_of_week must contain every value as a comma-separated list; "
        "start_time and end_time must be 24-hour HH:MM. If an exact value is missing, omit that field. "
        "For multiline list fields like specialties and achievements, use newline-separated text."
    )
    if module == "schedules":
        system += (
            " This is a fixed class-plan extraction. Return one JSON object only, with no markdown, "
            "no explanation, and no text before or after JSON. Use exactly this top-level shape: "
            '{"drafts":[{"locale":"zh","fields":{"title":"...","days_of_week":"2,4",'
            '"start_time":"17:00","end_time":"20:00"},"warnings":["question when data is missing"]},'
            '{"locale":"en","fields":{},"warnings":[]},{"locale":"fr","fields":{},"warnings":[]}],'
            '"warnings":["optional question"]}. '
            "Only include facts explicitly stated. A season or term such as 秋季, fall, or automne is not a class title. "
            "Do not put teacher names, weekdays, times, or term names into title or description. "
            "When course name, room, exact term dates, or teacher-account mapping are missing, leave fields absent and ask a direct question in warnings."
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
        # A schedule draft is a small structured response in three languages;
        # do not let a local model use its much larger provider default.
        max_tokens=900 if module == "schedules" else None,
        disable_thinking=True,
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


def _schedule_fallback_items(raw_text: str, targets: list[str]) -> list[AiExtractItem]:
    """Provide usable drafts when a local reasoning model never emits JSON."""
    weekday_patterns = {
        0: ("周日", "星期日", "sunday", "dimanche"), 1: ("周一", "星期一", "monday", "lundi"),
        2: ("周二", "星期二", "tuesday", "mardi"), 3: ("周三", "星期三", "wednesday", "mercredi"),
        4: ("周四", "星期四", "thursday", "jeudi"), 5: ("周五", "星期五", "friday", "vendredi"),
        6: ("周六", "星期六", "saturday", "samedi"),
    }
    items: list[AiExtractItem] = []
    for raw_line in [line.strip() for line in raw_text.splitlines() if line.strip()]:
        lowered = raw_line.lower()
        selected_days = [str(day) for day, names in weekday_patterns.items() if any(name in lowered for name in names)]
        time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(下午|pm)?\s*(?:-|至|到|–|—)\s*(\d{1,2})(?::(\d{2}))?\s*(下午|pm)?", raw_line, flags=re.IGNORECASE)
        fields: dict[str, str] = {}
        title = re.split(r"[：:]", raw_line, maxsplit=1)[0].strip()
        if title and not re.fullmatch(r"(?:秋季|春季|夏季|冬季|fall|spring|summer|winter)", title, flags=re.IGNORECASE):
            fields["title"] = title
        if selected_days:
            fields["days_of_week"] = ",".join(selected_days)
        if time_match:
            start_hour, start_minute, start_marker, end_hour, end_minute, end_marker = time_match.groups()
            start, end = int(start_hour), int(end_hour)
            if start_marker and start < 12: start += 12
            if end_marker and end < 12: end += 12
            fields["start_time"] = f"{start:02d}:{start_minute or '00'}"
            fields["end_time"] = f"{end:02d}:{end_minute or '00'}"
        warnings = ["AI structured output was unavailable; verify this draft before saving."]
        if "title" not in fields: warnings.append("What is the course name?")
        if not selected_days or not time_match: warnings.append("What are the exact weekly days and times?")
        drafts = [AiDraft(locale=locale, fields=fields.copy(), warnings=warnings) for locale in targets]
        items.append(AiExtractItem(drafts=drafts, warnings=warnings))
    return items


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

    immediate_fallback = _schedule_fallback_items(text, targets)
    if immediate_fallback and all(item.drafts[0].fields.get("days_of_week") for item in immediate_fallback):
        return AiExtractManyResponse(
            module=module,
            source_locale=source,
            items=immediate_fallback,
            warnings=["Structured schedule draft created. Confirm course details before saving."],
        )

    system = (
        "You extract multiple class schedule records for a dance school admin panel. "
        "Return one strict JSON object only, with no markdown, thinking, or explanation. Use the provided raw text as the only source of facts. "
        "If the text says a range like Monday to Friday, create one item for each weekday in that range. "
        "If the text contains multiple lines or multiple classes, create one item per class occurrence. "
        "For every item and target locale, return natural localized field values. "
        "day_of_week must be 0 for Sunday, 1 for Monday, through 6 for Saturday. "
        "start_time and end_time must be 24-hour HH:MM. Omit fields that are not known. "
        "Do not create more items than max_items. Never invent a course title from a season/term. Put missing course name, room, teacher account, and dates into warnings."
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

    try:
        parsed = chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
            ],
            max_tokens=1800,
            disable_thinking=True,
            config=config,
        )
    except RuntimeError:
        fallback = _schedule_fallback_items(text, targets)
        if fallback:
            return AiExtractManyResponse(module=module, source_locale=source, items=fallback, warnings=["AI JSON was unavailable. Local schedule drafts need confirmation."])
        raise

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


def _fixed_course_issue(
    issue_id: str,
    field: str,
    message: str,
    *,
    blocking: bool = True,
) -> FixedCourseImportIssue:
    return FixedCourseImportIssue(id=issue_id, field=field, message=message, blocking=blocking)


def _normalize_fixed_course_dates(draft: FixedCourseImportDraft, raw_text: str) -> list[FixedCourseImportIssue]:
    """Apply the documented nearest-future term rule when the source omits a year."""
    assumptions: list[FixedCourseImportIssue] = []
    today = date.today()
    # A word boundary does not match after a year followed by Chinese text
    # (for example, "2026年9月"). Treat any standalone four-digit year as explicit.
    explicit_year = bool(re.search(r"(?<!\d)20\d{2}(?!\d)", raw_text))
    month_range = re.search(
        r"(\d{1,2})\s*(?:月|/|-)\s*(?:到|至|to|through|[-~])\s*(\d{1,2})\s*(?:月)?",
        raw_text,
        re.IGNORECASE,
    )
    start_value = draft.offering.start_date.strip()
    end_value = draft.offering.end_date.strip()
    try:
        start = date.fromisoformat(start_value)
        end = date.fromisoformat(end_value)
    except ValueError:
        start = end = None

    if start is None or end is None:
        if month_range:
            start_month, end_month = int(month_range.group(1)), int(month_range.group(2))
            if 1 <= start_month <= 12 and 1 <= end_month <= 12:
                year = today.year + (1 if start_month < today.month else 0)
                end_year = year + (1 if end_month < start_month else 0)
                start = date(year, start_month, 1)
                end = date(end_year, end_month, monthrange(end_year, end_month)[1])
        if start is None or end is None:
            draft.questions.append(_fixed_course_issue("offering-dates", "date_range", "Course date range is missing or invalid."))
            return assumptions

    if explicit_year:
        # Providers occasionally add a stale "no year" assumption despite an
        # explicit year in the source. Do not make an administrator confirm a
        # question that the source has already answered.
        draft.assumptions = [
            issue
            for issue in draft.assumptions
            if not (issue.field == "date_range" and "no year" in issue.message.casefold())
        ]
    else:
        if month_range:
            start_month, end_month = int(month_range.group(1)), int(month_range.group(2))
            year = today.year + (1 if start_month < today.month else 0)
            end_year = year + (1 if end_month < start_month else 0)
            start = date(year, start_month, 1)
            end = date(end_year, end_month, monthrange(end_year, end_month)[1])
        else:
            year = today.year + (1 if start.month < today.month else 0)
            end_year = year + (1 if end.month < start.month else 0)
            start = date(year, start.month, start.day)
            end = date(end_year, end.month, end.day)
        date_assumptions = [
            issue for issue in draft.assumptions
            if issue.field == "date_range" and issue.blocking and not issue.resolved
        ]
        # The provider may describe an inferred range with dates that differ
        # from the normalized fields. Keep human-facing text authoritative.
        for issue in date_assumptions:
            issue.message = (
                f"No year was written; the nearest future term was set to "
                f"{start.isoformat()} through {end.isoformat()}."
            )
        has_year_assumption = bool(date_assumptions)
        if not has_year_assumption:
            assumptions.append(_fixed_course_issue(
                "term-year",
                "date_range",
                f"No year was written; the nearest future term uses {start.year}.",
            ))

    if end < start:
        draft.questions.append(_fixed_course_issue("offering-dates", "date_range", "Course end date must not be before its start date."))
        return assumptions
    draft.offering.start_date = start.isoformat()
    draft.offering.end_date = end.isoformat()
    if not draft.offering.name.strip():
        season = "Fall" if start.month in (8, 9, 10, 11) else "Spring" if start.month in (1, 2, 3, 4, 5) else "Summer" if start.month in (6, 7) else "Winter"
        draft.offering.name = f"{start.year} {season}"
        assumptions.append(_fixed_course_issue("offering-name", "offering.name", "The term name was inferred from the course dates.", blocking=False))
    return assumptions


def _resource_lookup(value: str | None, resources: list[dict[str, str]]) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    lowered = raw.casefold()
    direct = [item["id"] for item in resources if item["id"] == raw]
    if direct:
        return direct[0]
    matches = [
        item["id"]
        for item in resources
        if lowered in {item.get("name", "").casefold(), item.get("label", "").casefold()}
    ]
    return matches[0] if len(matches) == 1 else None


def _staff_lookup(value: str | None, staff: list[dict[str, str]]) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None
    lowered = raw.casefold()
    direct = [item["id"] for item in staff if item["id"] == raw]
    if direct:
        return direct[0]
    matches = [
        item["id"]
        for item in staff
        if lowered
        in {
            item.get("nickname", "").casefold(),
            item.get("nickname_en", "").casefold(),
            item.get("nickname_fr", "").casefold(),
        }
    ]
    return matches[0] if len(matches) == 1 else None


def _provider_issue_field(issue: dict[str, Any]) -> str:
    field = str(issue.get("field") or "").strip()
    if field:
        return field
    marker = " ".join(str(issue.get(key) or "") for key in ("id", "type", "code")).casefold()
    if "staff" in marker or "teacher" in marker:
        return "teacher_id"
    if "room" in marker or "classroom" in marker:
        return "room_id"
    if "day" in marker or "weekday" in marker:
        return "days_of_week"
    if "time" in marker:
        return "time"
    if "date" in marker or "term" in marker or "year" in marker:
        return "date_range"
    return ""


def _normalize_fixed_course_provider_payload(payload: dict[str, Any], source_locale: str) -> dict[str, Any]:
    """Normalize stable compact aliases returned by local Qwen.

    The public contract remains the Pydantic object shape. This conversion only
    expands equivalent representations before strict Pydantic validation.
    """
    source_language = normalize_locale(source_locale)
    warnings = payload.get("warnings")
    if isinstance(warnings, list):
        payload["warnings"] = [
            str(
                warning.get(f"text_{source_language}")
                or warning.get("text_zh")
                or warning.get("text_en")
                or warning.get("text_fr")
                or warning.get("message")
                or warning.get("key")
                or ""
            )
            if isinstance(warning, dict)
            else str(warning)
            for warning in warnings
        ]
    drafts = payload.get("drafts")
    if not isinstance(drafts, list):
        return payload
    for draft in drafts:
        if not isinstance(draft, dict):
            continue
        template = draft.get("template")
        if not isinstance(template, dict):
            continue
        translations = template.get("translations")
        if isinstance(translations, dict):
            for translation_locale, content in list(translations.items()):
                if isinstance(content, str):
                    translations[translation_locale] = {"title": content, "description": ""}
        slots = draft.get("slots")
        if isinstance(slots, list):
            for slot in slots:
                if not isinstance(slot, dict):
                    continue
                if "days_of_week" not in slot:
                    value = slot.get("day_of_week", slot.get("days", []))
                    slot["days_of_week"] = [value] if isinstance(value, int) else value
                if "teacher_id" not in slot:
                    slot["teacher_id"] = slot.get("staff_id", slot.get("teacher", None))
                if "room_id" not in slot:
                    slot["room_id"] = slot.get("room", None)
                if "start_time" not in slot:
                    slot["start_time"] = slot.get("start", "")
                if "end_time" not in slot:
                    slot["end_time"] = slot.get("end", "")
        for key in ("questions", "assumptions"):
            issues = draft.get(key)
            if not isinstance(issues, list):
                continue
            for issue in issues:
                if not isinstance(issue, dict):
                    continue
                if not issue.get("message"):
                    issue["message"] = str(
                        issue.get(f"text_{source_language}")
                        or issue.get("text_zh")
                        or issue.get("text_en")
                        or issue.get("text_fr")
                        or ""
                    )
                if not issue.get("field"):
                    issue["field"] = _provider_issue_field(issue)
    return payload


def _has_blocking_issue(draft: FixedCourseImportDraft, field: str) -> bool:
    return any(
        issue.field == field and issue.blocking and not issue.resolved
        for issue in draft.questions
    )


def _merge_fixed_course_slots(slots: list[FixedCourseImportSlot]) -> list[FixedCourseImportSlot]:
    merged: dict[tuple[str | None, str | None, str, str], FixedCourseImportSlot] = {}
    for slot in slots:
        key = (slot.room_id, slot.teacher_id, slot.start_time, slot.end_time)
        existing = merged.get(key)
        if existing is None:
            merged[key] = slot
        else:
            existing.days_of_week = sorted(set(existing.days_of_week) | set(slot.days_of_week))
    return list(merged.values())


def fixed_course_import_from_text(
    *,
    raw_text: str,
    source_locale: str,
    ui_locale: str,
    resources: list[dict[str, str]],
    staff: list[dict[str, str]],
    max_items: int = 30,
    config: AiRuntimeConfig | None = None,
) -> FixedCourseImportResponse:
    """Create fixed_course_import.v1 drafts without a regex or old-schedule fallback."""
    text = raw_text.strip()
    if not text:
        raise ValueError("Paste one or more fixed course descriptions before importing.")

    # The Pydantic model is the contract authority. Some Ollama-compatible
    # servers accept json_schema but emit an empty stream for large schemas, so
    # give them a compact example generated by those same Pydantic models and
    # keep the strict model validation after generation.
    schema = FixedCourseImportResponse.model_json_schema()
    output_shape = FixedCourseImportResponse(
        drafts=[FixedCourseImportDraft()]
    ).model_dump()
    warning_locale = normalize_locale(ui_locale)
    if warning_locale not in {"zh", "en", "fr"}:
        warning_locale = "en"
    warning_language = {
        "zh": "Simplified Chinese",
        "en": "English",
        "fr": "French",
    }[warning_locale]
    system = (
        "You extract fixed-course planning drafts for a dance school. Return JSON only, matching the supplied "
        "fixed_course_import.v1 schema exactly. Do not add markdown, explanations, or thinking. Treat each distinct "
        "course in the input as one draft. Use only supplied rooms and staff; output their exact IDs when a unique "
        "match exists. Never invent a room ID, staff ID, course name, dates, or times. Use Sunday=0 through Saturday=6, "
        "and HH:MM 24-hour times. Include Chinese, English, and French course content. Put absent or ambiguous facts "
        "in questions with blocking=true. No year means infer the nearest future term from the supplied reference date "
        "and record that inference in assumptions with blocking=true. Never return an empty drafts array when raw_text "
        "contains a course description: return one draft for each input line, using blocking questions for any fields "
        "you cannot determine. All human-facing questions, assumptions, and global warnings must be written in "
        f"{warning_language}, regardless of the source text language."
    )
    prompt = {
        "contract": "fixed_course_import.v1",
        "reference_date": date.today().isoformat(),
        "source_locale": source_locale,
        "ui_locale": warning_locale,
        "warning_language": warning_language,
        "max_items": max_items,
        "available_rooms": resources,
        "available_staff": staff,
        "raw_text": text,
        "output_shape_example": output_shape,
        "schema_name": schema.get("title", "FixedCourseImportResponse"),
    }
    parsed = chat_json(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
        ],
        temperature=0.1,
        max_tokens=min(3000, 360 + max_items * 190),
        disable_thinking=True,
        json_mode=False,
        config=config,
    )
    try:
        result = FixedCourseImportResponse.model_validate(
            _normalize_fixed_course_provider_payload(parsed, warning_locale)
        )
    except Exception as exc:
        raise RuntimeError(f"AI fixed-course output did not match fixed_course_import.v1: {exc}") from exc
    if not result.drafts:
        raise RuntimeError("AI did not return any fixed-course drafts.")

    normalized: list[FixedCourseImportDraft] = []
    for index, draft in enumerate(result.drafts[:max_items]):
        draft.template.title = draft.template.title.strip()
        draft.template.description = draft.template.description.strip()
        if not draft.template.title:
            draft.questions.append(_fixed_course_issue("course-title", "template.title", "Course name is missing."))
        for locale in ("zh", "en", "fr"):
            translated = draft.template.translations.setdefault(locale, FixedCourseLocalizedContent())
            if not translated.title:
                translated.title = draft.template.title
            if not translated.description:
                translated.description = draft.template.description
        draft.assumptions.extend(_normalize_fixed_course_dates(draft, text))

        for slot_index, slot in enumerate(draft.slots):
            slot.days_of_week = sorted({day for day in slot.days_of_week if 0 <= day <= 6})
            if not slot.days_of_week and not _has_blocking_issue(draft, "days_of_week"):
                draft.questions.append(_fixed_course_issue(f"slot-{slot_index}-days", "days_of_week", "Weekly course days are missing."))
            if (not re.fullmatch(r"\d{2}:\d{2}", slot.start_time or "") or not re.fullmatch(r"\d{2}:\d{2}", slot.end_time or "") or slot.end_time <= slot.start_time) and not _has_blocking_issue(draft, "time"):
                draft.questions.append(_fixed_course_issue(f"slot-{slot_index}-time", "time", "Valid start and end times are required."))
            resolved_room = _resource_lookup(slot.room_id, resources)
            if resolved_room:
                slot.room_id = resolved_room
            else:
                slot.room_id = None
                if not _has_blocking_issue(draft, "room_id"):
                    draft.questions.append(_fixed_course_issue(f"slot-{slot_index}-room", "room_id", "Room is missing or does not uniquely match an active room."))
            resolved_teacher = _staff_lookup(slot.teacher_id, staff)
            if resolved_teacher:
                slot.teacher_id = resolved_teacher
            else:
                slot.teacher_id = None
                if not _has_blocking_issue(draft, "teacher_id"):
                    draft.questions.append(_fixed_course_issue(f"slot-{slot_index}-teacher", "teacher_id", "Responsible teacher is missing or does not uniquely match a staff nickname."))
        draft.slots = _merge_fixed_course_slots(draft.slots)
        if not draft.slots:
            draft.questions.append(_fixed_course_issue("course-slots", "slots", "At least one weekly course time is required."))
        # Ensure stable IDs even when a provider omits them.
        for issue_index, issue in enumerate([*draft.questions, *draft.assumptions]):
            if not issue.id:
                issue.id = f"draft-{index}-issue-{issue_index}"
        normalized.append(draft)

    result.drafts = normalized
    return result
