import threading
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import User
from app.core.config import settings as app_settings
from app.api.v1.settings import _get_or_create_system_settings
from app.schemas.ai import (
    AiArticleImportItem,
    AiArticleImportJobCreateResponse,
    AiArticleImportJobStatusResponse,
    AiArticleImportRequest,
    AiArticleImportResponse,
    AiTranslateRequest,
    AiTranslateResponse,
    ImportedSource,
)
from app.services.ai_article_generator import generate_imported_content
from app.services.ai_translation import (
    AiConfigurationError,
    AiRuntimeConfig,
    ai_unavailable_exception,
    ensure_ai_configured,
    translate_fields,
)
from app.services.url_importer import import_urls

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/users/login")

_ai_import_jobs: dict[str, dict] = {}
_ai_import_jobs_lock = threading.Lock()


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


def _runtime_ai_config(db: Session) -> AiRuntimeConfig:
    settings = _get_or_create_system_settings(db)
    return AiRuntimeConfig(
        enabled=bool(settings.ai_enabled),
        api_base_url=settings.ai_api_base_url or app_settings.AI_API_BASE_URL,
        api_key=settings.ai_api_key or app_settings.AI_API_KEY,
        model=settings.ai_model or app_settings.AI_MODEL,
        timeout_seconds=settings.ai_timeout_seconds or app_settings.AI_TIMEOUT_SECONDS or 600,
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


def _set_import_job(job_id: str, **updates) -> None:
    with _ai_import_jobs_lock:
        job = _ai_import_jobs.get(job_id, {})
        job.update(updates)
        _ai_import_jobs[job_id] = job


def _run_import_job(job_id: str, payload: AiArticleImportRequest, config: AiRuntimeConfig) -> None:
    _set_import_job(job_id, status="running")
    try:
        result = _generate_imported_article_response(payload, config)
        _set_import_job(job_id, status="succeeded", result=result, error="")
    except HTTPException as exc:
        _set_import_job(job_id, status="failed", error=str(exc.detail))
    except Exception as exc:
        _set_import_job(job_id, status="failed", error=str(exc))


@router.post("/translate", response_model=AiTranslateResponse)
def translate_content(
    payload: AiTranslateRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
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
