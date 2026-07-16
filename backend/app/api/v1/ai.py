import json
import logging
import threading
import uuid
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.permissions import require_user_permission
from app.core.security import decode_token, oauth2_scheme
from app.models import User, UserProfile, ArticleGroup, Studio, StudioRoom
from app.core.config import settings as app_settings
from app.api.v1.settings import _get_or_create_system_settings
from app.schemas.ai import (
    AiArticleImportAppendRequest,
    AiArticleImportItem,
    AiArticleImportJobEntry,
    AiArticleImportJobCreateResponse,
    AiArticleImportJobStatusResponse,
    AiArticleImportRequest,
    AiArticleImportResponse,
    AiExtractRequest,
    AiExtractResponse,
    AiExtractJobCreateResponse,
    AiExtractJobStatusResponse,
    AiExtractManyRequest,
    AiExtractManyResponse,
    AiExtractManyJobCreateResponse,
    AiExtractManyJobStatusResponse,
    AiTranslateRequest,
    AiTranslateResponse,
    AiTranslateJobCreateResponse,
    AiTranslateJobStatusResponse,
    FixedCourseImportJobCreateResponse,
    FixedCourseImportJobStatusResponse,
    FixedCourseImportRequest,
    FixedCourseImportResponse,
    ImportedSource,
)

from app.schemas.news import NewsArticleCreate
from app.services.ai_article_generator import generate_imported_content
from app.services.ai_translation import (
    AiConfigurationError,
    AiRuntimeConfig,
    ai_unavailable_exception,
    ensure_ai_configured,
    extract_fields_from_text,
    extract_many_fields_from_text,
    fixed_course_import_from_text,
    translate_fields,
)
from app.services import news_files
from app.services.url_importer import import_url, import_urls

logger = logging.getLogger(__name__)
router = APIRouter()

_ai_import_jobs: dict[str, dict] = {}
_ai_import_jobs_lock = threading.Lock()
_ai_extract_many_jobs: dict[str, dict] = {}
_ai_extract_many_jobs_lock = threading.Lock()
_ai_extract_jobs: dict[str, dict] = {}
_ai_extract_jobs_lock = threading.Lock()
_ai_translate_jobs: dict[str, dict] = {}
_ai_translate_jobs_lock = threading.Lock()
_fixed_course_import_jobs: dict[str, dict] = {}
_fixed_course_import_jobs_lock = threading.Lock()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if payload is None or payload.get("sub") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return user


def require_fixed_course_ai(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    return require_user_permission(user, db, "teaching.schedules.ai", "manage")


AI_MODULE_PERMISSIONS = {
    "homepage": "content.homepage",
    "articles": "content.news.articles",
    "performances": "content.performances",
    "programs": "teaching.programs",
    "schedules": "teaching.schedules.ai",
    "pricing": "teaching.pricing",
    "faculty": "teaching.faculty",
    "settings": "system",
    "school_policy": "system.policy",
    "pages": "content.pages",
}


def require_ai_module(user: User, db: Session, module: str) -> None:
    permission = AI_MODULE_PERMISSIONS.get(module)
    if not permission:
        raise HTTPException(status_code=400, detail="Unknown AI module")
    require_user_permission(user, db, permission, "manage")


def require_job_owner(job: dict, user: User) -> None:
    if user.role != "super_admin" and job.get("user_id") != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI job not found")


def _runtime_ai_config(db: Session, feature: str | None = None) -> AiRuntimeConfig:
    settings = _get_or_create_system_settings(db)
    feature_model = ""
    if feature:
        try:
            feature_models = json.loads(settings.ai_feature_models_json or "{}")
        except (TypeError, ValueError):
            feature_models = {}
        if isinstance(feature_models, dict):
            feature_model = str(feature_models.get(feature) or "").strip()
    return AiRuntimeConfig(
        enabled=bool(settings.ai_enabled),
        api_base_url=settings.ai_api_base_url or app_settings.AI_API_BASE_URL,
        api_key=settings.ai_api_key or app_settings.AI_API_KEY,
        model=feature_model or settings.ai_model or app_settings.AI_MODEL,
        timeout_seconds=settings.ai_timeout_seconds or app_settings.AI_TIMEOUT_SECONDS or 600,
        thinking_enabled=bool(settings.ai_thinking_enabled),
        image_enabled=bool(settings.ai_image_enabled),
    )


def _source_has_readable_content(source: ImportedSource) -> bool:
    return bool(
        (source.title or "").strip()
        or (source.description or "").strip()
        or (source.text or "").strip()
        or source.media
        or source.images
    )


def _source_with_manual_text(source: ImportedSource, manual_text: str | None) -> ImportedSource:
    if _source_has_readable_content(source) or not (manual_text or "").strip():
        return source
    return source.model_copy(update={"text": manual_text.strip()})


def _generate_imported_article_response(
    payload: AiArticleImportRequest,
    config: AiRuntimeConfig,
) -> AiArticleImportResponse:
    try:
        sources = import_urls(payload.urls)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read source URL. If this is a Rednote/Xiaohongshu video post, paste the post text manually. ({exc})",
        ) from exc

    if not sources and payload.manual_text:
        sources = [ImportedSource(url="manual-input", text=payload.manual_text)]
    if not sources:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one URL or manual text.")

    items: list[AiArticleImportItem] = []
    warnings: list[str] = []
    for source in sources:
        source = _source_with_manual_text(source, payload.manual_text)
        if not _source_has_readable_content(source):
            reason = "; ".join(source.warnings or []) or "No readable text, image, or metadata was found."
            warnings.append(
                f"{source.url}: {reason} For Rednote/Xiaohongshu video posts, paste the caption or event details into the manual text box."
            )
            continue
        try:
            generated = generate_imported_content(
                source=source,
                source_locale=payload.source_locale,
                target_locales=payload.target_locales,
                manual_text=payload.manual_text,
                extra_instruction=payload.extra_instruction,
                available_category_slugs=payload.available_category_slugs,
                available_tag_slugs=payload.available_tag_slugs,
                config=config,
            )
            category_slugs = payload.category_slugs or generated.suggested_category_slugs
            tag_slugs = payload.tag_slugs or generated.suggested_tag_slugs
            items.append(
                AiArticleImportItem(
                    source=source,
                    content_type=generated.content_type,
                    suggested_category_slugs=category_slugs,
                    suggested_tag_slugs=tag_slugs,
                    drafts=generated.drafts,
                    warnings=source.warnings,
                )
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        except Exception as exc:
            warnings.append(f"{source.url}: {exc}")

    if not items:
        detail = "AI could not generate a draft from the provided source."
        if warnings:
            detail = f"{detail} {' '.join(warnings)}"
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

    return AiArticleImportResponse(items=items, warnings=warnings)


def _generate_imported_article_item(
    source: ImportedSource,
    payload: AiArticleImportRequest,
    config: AiRuntimeConfig,
) -> AiArticleImportItem:
    source = _source_with_manual_text(source, payload.manual_text)
    if not _source_has_readable_content(source):
        reason = "; ".join(source.warnings or []) or "No readable text, image, or metadata was found."
        raise ValueError(
            f"{source.url}: {reason} For Rednote/Xiaohongshu video posts, paste the caption or event details into the manual text box."
        )

    generated = generate_imported_content(
        source=source,
        source_locale=payload.source_locale,
        target_locales=payload.target_locales,
        manual_text=payload.manual_text,
        extra_instruction=payload.extra_instruction,
        available_category_slugs=payload.available_category_slugs,
        available_tag_slugs=payload.available_tag_slugs,
        config=config,
    )
    category_slugs = payload.category_slugs or generated.suggested_category_slugs
    tag_slugs = payload.tag_slugs or generated.suggested_tag_slugs
    return AiArticleImportItem(
        source=source,
        content_type=generated.content_type,
        suggested_category_slugs=category_slugs,
        suggested_tag_slugs=tag_slugs,
        drafts=generated.drafts,
        warnings=source.warnings,
    )


def _slugify_imported_title(title: str) -> str:
    slug = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", (title or "").lower()).strip("-")
    if re.search(r"[a-z0-9]", slug):
        return slug
    return f"article-{uuid.uuid4().hex[:8]}"


def _imported_media_urls(item: AiArticleImportItem) -> list[str]:
    return [media.url for media in item.source.media if media.url]


def _is_video_url(url: str) -> bool:
    lowered = (url or "").lower()
    return any(lowered.endswith(ext) for ext in (".mp4", ".webm", ".ogg", ".mov", ".m4v", ".m3u8"))


def _first_draft_title(item: AiArticleImportItem, index: int) -> str:
    zh = next((draft for draft in item.drafts if draft.locale == "zh"), None)
    return (
        (zh.fields.get("title") if zh else "")
        or (item.drafts[0].fields.get("title") if item.drafts else "")
        or item.source.title
        or f"imported-{index + 1}"
    )


def _video_link_label(locale: str) -> str:
    if locale == "zh":
        return "观看视频"
    if locale == "fr":
        return "Voir la vidéo"
    return "Watch video"


def _body_with_imported_media(body: str, item: AiArticleImportItem, title: str, locale: str) -> str:
    urls = _imported_media_urls(item)
    body_media_urls = urls[1:] if len(urls) > 1 else []
    missing = [url for url in body_media_urls if url not in (body or "")]
    next_body = body or ""
    if missing:
        alt = title or item.source.title or "Imported image"
        if len(missing) > 1:
            image_markdown = "\n".join([":::carousel", *[f"![{alt} {idx + 1}]({url})" for idx, url in enumerate(missing)], ":::"])
        else:
            image_markdown = f"![{alt}]({missing[0]})"
        next_body = f"{next_body.strip()}\n\n{image_markdown}" if next_body.strip() else image_markdown

    video_url = item.source.video_url or (item.source.url if item.source.is_video else "")
    if video_url and video_url not in next_body and not _is_video_url(next_body):
        video_markdown = f"[{_video_link_label(locale)}]({video_url})"
        next_body = f"{next_body.strip()}\n\n{video_markdown}" if next_body.strip() else video_markdown

    return next_body


def _unique_imported_slug(item: AiArticleImportItem, index: int) -> str:
    base = _slugify_imported_title(_first_draft_title(item, index))
    suffix = uuid.uuid4().hex[:8]
    if item.source.source_published_at:
        try:
            suffix = datetime.fromisoformat(item.source.source_published_at.replace("Z", "+00:00")).date().isoformat()
        except ValueError:
            pass
    return re.sub(r"-+", "-", f"{base}-{suffix}-{index + 1}").strip("-")


def _save_imported_article(item: AiArticleImportItem, index: int, publish: bool = False) -> str:
    source_url = news_files.normalize_source_url(item.source.url)
    slug = _unique_imported_slug(item, index)
    cover = _imported_media_urls(item)[0] if _imported_media_urls(item) else None
    published_at = None
    if item.source.source_published_at:
        try:
            published_at = datetime.fromisoformat(item.source.source_published_at.replace("Z", "+00:00"))
        except ValueError:
            published_at = None

    db = SessionLocal()
    try:
        existing_group = news_files.find_article_group_by_source_url(db, source_url) if source_url and item.source.url != "manual-input" else None
        if existing_group:
            return existing_group.shared_slug

        for draft in item.drafts:
            title = draft.fields.get("title") or _first_draft_title(item, index)
            article = NewsArticleCreate(
                title=title,
                slug=slug,
                summary=draft.fields.get("summary") or None,
                body=_body_with_imported_media(draft.fields.get("body") or "", item, title, draft.locale),
                cover_image=cover,
                category_slugs=item.suggested_category_slugs,
                tag_slugs=item.suggested_tag_slugs,
                locale=draft.locale,
                is_published=publish,
                published_at=published_at,
            )
            created = news_files.create_article(db, article)
            if source_url and item.source.url != "manual-input" and created.get("group_id"):
                group = db.query(ArticleGroup).filter(ArticleGroup.id == created["group_id"]).first()
                if group and not group.source_url:
                    group.source_url = source_url
                    db.commit()
        return slug
    finally:
        db.close()


def _set_import_job(job_id: str, **updates) -> None:
    with _ai_import_jobs_lock:
        job = _ai_import_jobs.get(job_id, {})
        job.update(updates)
        _ai_import_jobs[job_id] = job


def _set_extract_many_job(job_id: str, **updates) -> None:
    with _ai_extract_many_jobs_lock:
        job = _ai_extract_many_jobs.get(job_id, {})
        job.update(updates)
        _ai_extract_many_jobs[job_id] = job


def _set_extract_job(job_id: str, **updates) -> None:
    with _ai_extract_jobs_lock:
        job = _ai_extract_jobs.get(job_id, {})
        job.update(updates)
        _ai_extract_jobs[job_id] = job


def _set_translate_job(job_id: str, **updates) -> None:
    with _ai_translate_jobs_lock:
        job = _ai_translate_jobs.get(job_id, {})
        job.update(updates)
        _ai_translate_jobs[job_id] = job


def _set_fixed_course_import_job(job_id: str, **updates) -> None:
    with _fixed_course_import_jobs_lock:
        job = _fixed_course_import_jobs.get(job_id, {})
        job.update(updates)
        _fixed_course_import_jobs[job_id] = job


def _fixed_course_import_context(db: Session) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    rooms = db.query(StudioRoom, Studio).join(Studio, Studio.id == StudioRoom.studio_id).filter(
        StudioRoom.is_active.is_(True), Studio.is_active.is_(True)
    ).order_by(Studio.name, StudioRoom.sort_order, StudioRoom.name).all()
    resources = [
        {"id": room.id, "name": room.name, "label": f"{studio.name} / {room.name}"}
        for room, studio in rooms
    ]
    staff_rows = db.query(User, UserProfile).outerjoin(
        UserProfile, UserProfile.user_id == User.id
    ).filter(User.is_active.is_(True), User.role.in_(("super_admin", "admin"))).order_by(User.role, User.id).all()
    staff = [
        {
            "id": user.id,
            "nickname": (
                profile.nickname_zh or profile.first_name or ""
            ).strip() if profile else "",
            "nickname_en": (profile.nickname_en or "").strip() if profile else "",
            "nickname_fr": (profile.nickname_fr or "").strip() if profile else "",
            "role": user.role,
        }
        for user, profile in staff_rows
    ]
    return resources, staff


def _run_import_job(job_id: str, payload: AiArticleImportRequest, config: AiRuntimeConfig) -> None:
    result = AiArticleImportResponse(items=[], warnings=[])
    errors: list[str] = []
    saved_slugs: list[str] = []
    entries: list[dict] = []
    initial_queue = list(payload.urls) if payload.urls else (["manual-input"] if payload.manual_text else [])
    _set_import_job(
        job_id,
        status="running",
        queue=initial_queue,
        result=result,
        error="",
        total=len(initial_queue),
        completed=0,
        failed=0,
        current_url="",
        errors=[],
        saved=0,
        saved_slugs=[],
        entries=[],
    )

    if not initial_queue:
        _set_import_job(job_id, status="failed", error="Provide at least one URL or manual text.")
        return

    index = 0
    while True:
        with _ai_import_jobs_lock:
            job = _ai_import_jobs.get(job_id, {})
            queue = list(job.get("queue", []))
        if index >= len(queue):
            break

        url = queue[index]
        _set_import_job(job_id, current_url=url, total=len(queue))
        try:
            source = ImportedSource(url="manual-input", text=payload.manual_text or "") if url == "manual-input" else import_url(url)
            normalized_source_url = news_files.normalize_source_url(source.url)
            existing_group = None
            if normalized_source_url and source.url != "manual-input":
                lookup_db = SessionLocal()
                try:
                    existing_group = news_files.find_article_group_by_source_url(lookup_db, normalized_source_url)
                finally:
                    lookup_db.close()
            if existing_group:
                entries.append({
                    "url": url,
                    "status": "duplicate",
                    "message": f"Already imported as {existing_group.shared_slug}",
                    "saved_slug": existing_group.shared_slug,
                })
                _set_import_job(
                    job_id,
                    result=result,
                    completed=len(result.items),
                    failed=len(errors),
                    error="",
                    errors=errors,
                    saved=len(saved_slugs),
                    saved_slugs=saved_slugs,
                    entries=entries,
                )
                index += 1
                continue

            if source.url != "manual-input" and not (
                (source.title or "").strip()
                or (source.description or "").strip()
                or (source.text or "").strip()
                or source.media
                or source.images
                or source.is_video
            ):
                invalid_message = "; ".join(source.warnings or []) or "No readable content found."
                errors.append(f"{url}: {invalid_message}")
                entries.append({
                    "url": url,
                    "status": "invalid",
                    "message": invalid_message,
                    "saved_slug": "",
                })
                _set_import_job(
                    job_id,
                    result=result,
                    completed=len(result.items),
                    failed=len(errors),
                    error=invalid_message,
                    errors=errors,
                    saved=len(saved_slugs),
                    saved_slugs=saved_slugs,
                    entries=entries,
                )
                index += 1
                continue

            item = _generate_imported_article_item(source, payload, config)
            result.items.append(item)
            saved_slug = ""
            if payload.auto_save_to_drafts:
                saved_slug = _save_imported_article(item, index, publish=True)
                saved_slugs.append(saved_slug)
            entries.append({
                "url": url,
                "status": "saved" if saved_slug else "generated",
                "message": "Imported successfully" if saved_slug else "Draft generated",
                "saved_slug": saved_slug,
            })
            _set_import_job(
                job_id,
                result=result,
                completed=len(result.items),
                failed=len(errors),
                error="",
                errors=errors,
                saved=len(saved_slugs),
                saved_slugs=saved_slugs,
                entries=entries,
            )
        except Exception as exc:
            errors.append(f"{url}: {exc}")
            entries.append({
                "url": url,
                "status": "failed",
                "message": str(exc),
                "saved_slug": "",
            })
            _set_import_job(
                job_id,
                result=result,
                completed=len(result.items),
                failed=len(errors),
                error=str(exc),
                errors=errors,
                saved=len(saved_slugs),
                saved_slugs=saved_slugs,
                entries=entries,
            )
        index += 1

    final_status = "succeeded" if result.items or saved_slugs else "failed"
    final_error = "" if result.items else "AI could not generate any article drafts."
    _set_import_job(
        job_id,
        status=final_status,
        result=result,
        error=final_error,
        current_url="",
        completed=len(result.items),
        failed=len(errors),
        errors=errors,
        saved=len(saved_slugs),
        saved_slugs=saved_slugs,
        entries=entries,
    )


def _run_extract_many_job(job_id: str, payload: AiExtractManyRequest, config: AiRuntimeConfig) -> None:
    _set_extract_many_job(job_id, status="running")
    try:
        result = extract_many_fields_from_text(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            raw_text=payload.raw_text,
            target_fields=payload.target_fields,
            instruction=payload.instruction,
            max_items=payload.max_items,
            config=config,
        )
        _set_extract_many_job(job_id, status="succeeded", result=result, error="")
    except HTTPException as exc:
        _set_extract_many_job(job_id, status="failed", error=str(exc.detail))
    except Exception as exc:
        _set_extract_many_job(job_id, status="failed", error=str(exc))


def _run_fixed_course_import_job(
    job_id: str,
    payload: FixedCourseImportRequest,
    config: AiRuntimeConfig,
    resources: list[dict[str, str]],
    staff: list[dict[str, str]],
) -> None:
    _set_fixed_course_import_job(job_id, status="running")
    try:
        result = fixed_course_import_from_text(
            raw_text=payload.raw_text,
            source_locale=payload.source_locale,
            ui_locale=payload.ui_locale,
            resources=resources,
            staff=staff,
            max_items=payload.max_items,
            config=config,
        )
        _set_fixed_course_import_job(job_id, status="succeeded", result=result, error="")
    except HTTPException as exc:
        _set_fixed_course_import_job(job_id, status="failed", error=str(exc.detail))
    except Exception as exc:
        logger.exception("Fixed-course AI import failed: %s", exc)
        locale = payload.ui_locale if payload.ui_locale in {"zh", "en", "fr"} else "en"
        message = {
            "zh": "AI 返回的课程结构不完整，系统没有创建草稿。请重新解析；如果仍然失败，请检查每门课程是否写明星期和时间。",
            "en": "The AI returned an incomplete course structure, so no draft was created. Try parsing again and check that each course includes its days and times.",
            "fr": "L’IA a renvoyé une structure de cours incomplète; aucun brouillon n’a été créé. Réessayez et vérifiez que chaque cours contient les jours et les heures.",
        }[locale]
        _set_fixed_course_import_job(job_id, status="failed", error=message)


def _to_extract_response(result) -> AiExtractResponse:
    """Normalize the shared extraction service result for the extract API."""
    return AiExtractResponse(
        module=result.module,
        source_locale=result.source_locale,
        drafts=result.drafts,
        warnings=result.warnings,
    )


def _run_extract_job(job_id: str, payload: AiExtractRequest, config: AiRuntimeConfig) -> None:
    _set_extract_job(job_id, status="running")
    try:
        generated = extract_fields_from_text(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            raw_text=payload.raw_text,
            target_fields=payload.target_fields,
            instruction=payload.instruction,
            config=config,
        )
        _set_extract_job(job_id, status="succeeded", result=_to_extract_response(generated), error="")
    except HTTPException as exc:
        _set_extract_job(job_id, status="failed", error=str(exc.detail))
    except Exception as exc:
        _set_extract_job(job_id, status="failed", error=str(exc))


def _run_translate_job(job_id: str, payload: AiTranslateRequest, config: AiRuntimeConfig) -> None:
    _set_translate_job(job_id, status="running")
    try:
        result = translate_fields(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            fields=payload.fields,
            tone=payload.tone,
            config=config,
        )
        _set_translate_job(job_id, status="succeeded", result=result, error="")
    except HTTPException as exc:
        _set_translate_job(job_id, status="failed", error=str(exc.detail))
    except Exception as exc:
        _set_translate_job(job_id, status="failed", error=str(exc))


@router.post("/translate", response_model=AiTranslateResponse)
def translate_content(
    payload: AiTranslateRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    try:
        config = _runtime_ai_config(db)
        return translate_fields(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            fields=payload.fields,
            tone=payload.tone,
            config=config,
        )
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/translate/jobs", response_model=AiTranslateJobCreateResponse)
def create_translate_job(
    payload: AiTranslateRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    try:
        config = _runtime_ai_config(db)
        ensure_ai_configured(config)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc

    job_id = uuid.uuid4().hex
    _set_translate_job(job_id, status="pending", result=None, error="", user_id=user.id)
    thread = threading.Thread(target=_run_translate_job, args=(job_id, payload, config), daemon=True)
    thread.start()
    return AiTranslateJobCreateResponse(job_id=job_id, status="pending")


@router.get("/translate/jobs/{job_id}", response_model=AiTranslateJobStatusResponse)
def get_translate_job(
    job_id: str,
    user: User = Depends(require_admin),
):
    with _ai_translate_jobs_lock:
        job = _ai_translate_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI translate job not found")
    require_job_owner(job, user)
    return AiTranslateJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
    )


@router.post("/extract", response_model=AiExtractResponse)
def extract_content(
    payload: AiExtractRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    try:
        config = _runtime_ai_config(db)
        return _to_extract_response(extract_fields_from_text(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            raw_text=payload.raw_text,
            target_fields=payload.target_fields,
            instruction=payload.instruction,
            config=config,
        ))
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/extract/jobs", response_model=AiExtractJobCreateResponse)
def create_extract_job(
    payload: AiExtractRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    """Run a single AI form-fill request in the background.

    Local models can take minutes to warm up or generate, which must not hold an
    HTTP request open long enough for a browser or reverse proxy to time out.
    """
    try:
        config = _runtime_ai_config(db)
        ensure_ai_configured(config)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc

    job_id = uuid.uuid4().hex
    _set_extract_job(job_id, status="pending", result=None, error="", user_id=user.id)
    thread = threading.Thread(target=_run_extract_job, args=(job_id, payload, config), daemon=True)
    thread.start()
    return AiExtractJobCreateResponse(job_id=job_id, status="pending")


@router.get("/extract/jobs/{job_id}", response_model=AiExtractJobStatusResponse)
def get_extract_job(job_id: str, user: User = Depends(require_admin)):
    with _ai_extract_jobs_lock:
        job = _ai_extract_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI extract job not found")
    require_job_owner(job, user)
    return AiExtractJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
    )


@router.post("/extract-many", response_model=AiExtractManyResponse)
def extract_many_content(
    payload: AiExtractManyRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    try:
        config = _runtime_ai_config(db)
        return extract_many_fields_from_text(
            module=payload.module,
            source_locale=payload.source_locale,
            target_locales=payload.target_locales,
            raw_text=payload.raw_text,
            target_fields=payload.target_fields,
            instruction=payload.instruction,
            max_items=payload.max_items,
            config=config,
        )
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/extract-many/jobs", response_model=AiExtractManyJobCreateResponse)
def create_extract_many_job(
    payload: AiExtractManyRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    require_ai_module(user, db, payload.module)
    try:
        config = _runtime_ai_config(db)
        ensure_ai_configured(config)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc

    job_id = uuid.uuid4().hex
    _set_extract_many_job(job_id, status="pending", result=None, error="", user_id=user.id)
    thread = threading.Thread(target=_run_extract_many_job, args=(job_id, payload, config), daemon=True)
    thread.start()
    return AiExtractManyJobCreateResponse(job_id=job_id, status="pending")


@router.get("/extract-many/jobs/{job_id}", response_model=AiExtractManyJobStatusResponse)
def get_extract_many_job(
    job_id: str,
    user: User = Depends(require_admin),
):
    with _ai_extract_many_jobs_lock:
        job = _ai_extract_many_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI extract job not found")
    require_job_owner(job, user)
    return AiExtractManyJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
    )


@router.post("/fixed-course-import/jobs", response_model=FixedCourseImportJobCreateResponse)
def create_fixed_course_import_job(
    payload: FixedCourseImportRequest,
    user: User = Depends(require_fixed_course_ai),
    db: Session = Depends(get_db),
):
    try:
        config = _runtime_ai_config(db, feature="fixed_course_import")
        ensure_ai_configured(config)
        resources, staff = _fixed_course_import_context(db)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc
    if not resources:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create an active studio room before importing fixed courses")

    job_id = uuid.uuid4().hex
    _set_fixed_course_import_job(job_id, status="pending", result=None, error="")
    thread = threading.Thread(
        target=_run_fixed_course_import_job,
        args=(job_id, payload, config, resources, staff),
        daemon=True,
    )
    thread.start()
    return FixedCourseImportJobCreateResponse(job_id=job_id, status="pending")


@router.get("/fixed-course-import/jobs/{job_id}", response_model=FixedCourseImportJobStatusResponse)
def get_fixed_course_import_job(job_id: str, user: User = Depends(require_fixed_course_ai)):
    with _fixed_course_import_jobs_lock:
        job = _fixed_course_import_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixed-course import job not found")
    return FixedCourseImportJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
    )


@router.post("/import-article-urls/jobs", response_model=AiArticleImportJobCreateResponse)
def create_import_article_urls_job(
    payload: AiArticleImportRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        config = _runtime_ai_config(db)
        ensure_ai_configured(config)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc

    job_id = uuid.uuid4().hex
    _set_import_job(job_id, status="pending", result=None, error="")
    thread = threading.Thread(target=_run_import_job, args=(job_id, payload, config), daemon=True)
    thread.start()
    return AiArticleImportJobCreateResponse(job_id=job_id, status="pending")


@router.post("/import-article-urls/jobs/{job_id}/append", response_model=AiArticleImportJobStatusResponse)
def append_import_article_urls_job(
    job_id: str,
    payload: AiArticleImportAppendRequest,
    user: User = Depends(require_admin),
):
    if not payload.urls:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one URL.")

    with _ai_import_jobs_lock:
        job = _ai_import_jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI import job not found")
        if job.get("status") not in {"pending", "running"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only running jobs can accept more URLs.")
        queue = list(job.get("queue", []))
        existing = set(queue)
        added = [url for url in payload.urls if url not in existing]
        queue.extend(added)
        job["queue"] = queue
        job["total"] = len(queue)
        _ai_import_jobs[job_id] = job

    return AiArticleImportJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
        total=job.get("total", 0),
        completed=job.get("completed", 0),
        failed=job.get("failed", 0),
        current_url=job.get("current_url", ""),
        errors=job.get("errors", []),
        saved=job.get("saved", 0),
        saved_slugs=job.get("saved_slugs", []),
    )


@router.get("/import-article-urls/jobs/{job_id}", response_model=AiArticleImportJobStatusResponse)
def get_import_article_urls_job(
    job_id: str,
    user: User = Depends(require_admin),
):
    with _ai_import_jobs_lock:
        job = _ai_import_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI import job not found")
    return AiArticleImportJobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        result=job.get("result"),
        error=job.get("error", ""),
        total=job.get("total", 0),
        completed=job.get("completed", 0),
        failed=job.get("failed", 0),
        current_url=job.get("current_url", ""),
        errors=job.get("errors", []),
        saved=job.get("saved", 0),
        saved_slugs=job.get("saved_slugs", []),
    )


@router.post("/import-article-urls", response_model=AiArticleImportResponse)
def import_article_urls(
    payload: AiArticleImportRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        config = _runtime_ai_config(db)
        ensure_ai_configured(config)
        return _generate_imported_article_response(payload, config)
    except AiConfigurationError as exc:
        raise ai_unavailable_exception(exc) from exc
