from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging
from typing import Optional
import json
import base64
import hashlib
import hmac
import time
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    decode_token,
    logto_token_error_code,
    validate_logto_token,
)
from app.core.config import settings
from app.schemas.user import (
    AdminAccountCreate,
    AdminAccountListResponse,
    AdminAccountUpdate,
    AccountPermissionsResponse,
    AccountPermissionsUpdate,
    PermissionCatalogItem,
    PermissionGrant,
    PermissionPresetBody,
    PermissionPresetResponse,
    UserCreate,
    UserResponse,
    Token,
    LoginRequest,
    UserUpdate,
    LogtoBindingRequestResponse,
    LogtoBindingReview,
    LogtoSessionIdentity,
    LogtoSessionResponse,
    AccountTypeDefaultResponse,
    AccountTypeDefaultUpdate,
    AccountTypePermissionSync,
    AccountTypePermissionSyncResponse,
)

logger = logging.getLogger(__name__)
from app.models import AccountTypePermissionDefault, LogtoBindingRequest, PermissionAuditLog, PermissionPreset, User, UserPermission, UserProfile
from app.core.permissions import (
    PERMISSION_DEFINITIONS,
    PERMISSION_MAP,
    LEGACY_ADMIN_DEFAULTS,
    TEACHER_DEFAULTS,
    effective_permissions,
    grant_defaults,
    has_permission,
    permission_denied,
)

router = APIRouter()

SUPER_ADMIN_ROLE = "super_admin"
TEACHER_ADMIN_ROLE = "admin"
ADMIN_ROLES = {SUPER_ADMIN_ROLE, TEACHER_ADMIN_ROLE}
ACCOUNT_TYPES = ("teacher", "staff_admin", "parent", "student", "alumni")
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    payload = decode_token(authorization[7:])
    if not payload:
        return None
    return payload.get("sub")


def _get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> User:
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return user


def _require_super_admin(user: User = Depends(_get_current_user)) -> User:
    if user.role != SUPER_ADMIN_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return user


def _require_accounts_view(
    user: User = Depends(_get_current_user), db: Session = Depends(get_db)
) -> User:
    if not has_permission(db, user, "system.accounts", "view"):
        raise permission_denied("system.accounts", "view")
    return user


def _require_accounts_manage(
    user: User = Depends(_get_current_user), db: Session = Depends(get_db)
) -> User:
    if not has_permission(db, user, "system.accounts", "manage"):
        raise permission_denied("system.accounts", "manage")
    return user


def _response_for_user(user: User, db: Session) -> UserResponse:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        first_name=profile.first_name or "" if profile else "",
        last_name=profile.last_name or "" if profile else "",
        nickname_zh=(profile.nickname_zh or profile.first_name or "") if profile else "",
        nickname_en=(profile.nickname_en or "") if profile else "",
        nickname_fr=(profile.nickname_fr or "") if profile else "",
        avatar_url=profile.avatar_url if profile else None,
        phone=profile.phone if profile else None,
        is_active=user.is_active,
        account_type=user.account_type,
        provisioning_status=user.provisioning_status or "active",
        logto_linked=bool(user.logto_subject),
        created_at=user.created_at,
        permissions=effective_permissions(db, user) if user.role in ADMIN_ROLES else {},
    )


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    raise HTTPException(status_code=410, detail={"code": "local_auth_removed"})


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    raise HTTPException(status_code=410, detail={"code": "local_auth_removed"})


@router.get("/me", response_model=UserResponse)
def get_me(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _response_for_user(user, db)


@router.put("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id, first_name="", last_name="")
        db.add(profile)
    if user_update.first_name is not None:
        profile.first_name = user_update.first_name
        if user_update.nickname_zh is None:
            profile.nickname_zh = user_update.first_name
    if user_update.last_name is not None:
        profile.last_name = user_update.last_name
    if user_update.nickname_zh is not None:
        profile.nickname_zh = user_update.nickname_zh
        profile.first_name = user_update.nickname_zh
    if user_update.nickname_en is not None:
        profile.nickname_en = user_update.nickname_en
    if user_update.nickname_fr is not None:
        profile.nickname_fr = user_update.nickname_fr
    if user_update.phone is not None:
        profile.phone = user_update.phone
    if user_update.avatar_url is not None:
        profile.avatar_url = user_update.avatar_url

    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)


@router.get("/admin/accounts", response_model=AdminAccountListResponse)
def list_teacher_admin_accounts(
    search: str = "",
    status_filter: str = Query("all", alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    actor: User = Depends(_require_accounts_view),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == TEACHER_ADMIN_ROLE)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(User.email.ilike(term))
    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    elif status_filter == "disabled":
        query = query.filter(User.is_active.is_(False))
    elif status_filter != "all":
        raise HTTPException(status_code=400, detail="Invalid status filter")

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return AdminAccountListResponse(
        items=[_response_for_user(user, db) for user in users],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/admin/accounts", response_model=UserResponse)
def create_teacher_admin_account(
    account: AdminAccountCreate,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    if account.account_type == "staff_admin" and actor.role != SUPER_ADMIN_ROLE:
        raise HTTPException(status_code=403, detail={"code": "staff_admin_creation_forbidden"})
    existing = db.query(User).filter(User.email == account.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=account.email,
        password_hash="logto-managed",
        role=TEACHER_ADMIN_ROLE,
        is_active=False,
        account_type=account.account_type,
        provisioning_status="pending",
    )
    db.add(user)
    db.flush()

    db.add(UserProfile(
        user_id=user.id,
        first_name=account.nickname_zh or account.first_name,
        last_name=account.last_name,
        nickname_zh=account.nickname_zh or account.first_name,
        nickname_en=account.nickname_en or "",
        nickname_fr=account.nickname_fr or "",
        phone=account.phone,
    ))
    type_default = db.query(AccountTypePermissionDefault).filter(
        AccountTypePermissionDefault.account_type == account.account_type
    ).first() if account.account_type else None
    preset = db.query(PermissionPreset).filter(PermissionPreset.id == type_default.preset_id).first() if type_default and type_default.preset_id else None
    if preset:
        grants = _preset_grants(preset)
        _assert_grants_within_actor(actor, db, grants)
        _replace_permissions(db, user, grants, actor)
    else:
        defaults = TEACHER_DEFAULTS
        if actor.role != SUPER_ADMIN_ROLE:
            actor_permissions = effective_permissions(db, actor)
            defaults = {
                key: (can_view and bool(actor_permissions.get(key, {}).get("view")),
                      can_manage and bool(actor_permissions.get(key, {}).get("manage")))
                for key, (can_view, can_manage) in TEACHER_DEFAULTS.items()
            }
        grant_defaults(db, user, defaults)
    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)


@router.put("/admin/accounts/{user_id}", response_model=UserResponse)
def update_teacher_admin_account(
    user_id: str,
    account: AdminAccountUpdate,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.role == TEACHER_ADMIN_ROLE).first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher admin account not found")
    if user.id == actor.id:
        raise HTTPException(status_code=403, detail={"code": "self_account_change_forbidden"})

    if account.account_type == "staff_admin" and actor.role != SUPER_ADMIN_ROLE:
        raise HTTPException(status_code=403, detail={"code": "staff_admin_assignment_forbidden"})
    if account.is_active is not None:
        user.is_active = account.is_active
        if account.is_active and user.provisioning_status == "pending":
            user.provisioning_status = "active"
    if account.account_type is not None:
        user.account_type = account.account_type
    if account.provisioning_status is not None:
        user.provisioning_status = account.provisioning_status

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id, first_name="", last_name="")
        db.add(profile)
    if account.first_name is not None:
        profile.first_name = account.first_name
        if account.nickname_zh is None:
            profile.nickname_zh = account.first_name
    if account.last_name is not None:
        profile.last_name = account.last_name
    if account.nickname_zh is not None:
        profile.nickname_zh = account.nickname_zh
        profile.first_name = account.nickname_zh
    if account.nickname_en is not None:
        profile.nickname_en = account.nickname_en
    if account.nickname_fr is not None:
        profile.nickname_fr = account.nickname_fr
    if account.phone is not None:
        profile.phone = account.phone

    db.commit()
    db.refresh(user)
    return _response_for_user(user, db)


def _decode_identity_assertion(identity: LogtoSessionIdentity) -> dict:
    secret = settings.LOGTO_SESSION_ASSERTION_SECRET.encode("utf-8")
    if len(secret) < 32:
        raise HTTPException(status_code=503, detail={"code": "logto_assertion_not_configured"})
    expected = hmac.new(secret, identity.payload.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, identity.signature):
        raise HTTPException(status_code=401, detail={"code": "invalid_identity_assertion"})
    try:
        padded = identity.payload + "=" * (-len(identity.payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    except (ValueError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail={"code": "invalid_identity_assertion"})
    if abs(int(time.time()) - int(data.get("iat", 0))) > 120:
        raise HTTPException(status_code=401, detail={"code": "expired_identity_assertion"})
    return data


def _binding_response(item: LogtoBindingRequest) -> LogtoBindingRequestResponse:
    return LogtoBindingRequestResponse(
        id=item.id,
        user_id=item.user_id,
        email=item.verified_email,
        logto_subject=item.logto_subject,
        requested_account_type=item.requested_account_type,
        status=item.status,
        review_note=item.review_note or "",
        created_at=item.created_at,
        reviewed_at=item.reviewed_at,
    )


def _preset_grants(preset: PermissionPreset) -> list[PermissionGrant]:
    try:
        raw = json.loads(preset.permissions_json or "[]")
        return _normalize_permission_grants([PermissionGrant(**item) for item in raw])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail={"code": "invalid_permission_preset"})


def _replace_permissions(db: Session, target: User, grants: list[PermissionGrant], actor: User) -> None:
    before = effective_permissions(db, target)
    db.query(UserPermission).filter(UserPermission.user_id == target.id).delete(synchronize_session=False)
    for grant in grants:
        if grant.can_view or grant.can_manage:
            db.add(UserPermission(
                user_id=target.id,
                permission_key=grant.key,
                can_view=grant.can_view or grant.can_manage,
                can_manage=grant.can_manage,
                updated_by=actor.id,
            ))
    db.flush()
    db.add(PermissionAuditLog(
        actor_id=actor.id,
        target_user_id=target.id,
        before_json=json.dumps(before),
        after_json=json.dumps(effective_permissions(db, target)),
    ))


@router.post("/auth/logto-session", response_model=LogtoSessionResponse)
def complete_logto_session(
    identity: LogtoSessionIdentity,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail={"code": "missing_bearer_token"})
    try:
        claims = validate_logto_token(credentials.credentials)
    except Exception as error:
        error_code = logto_token_error_code(error)
        logger.warning(
            "Logto session token validation failed: code=%s exception=%s",
            error_code,
            type(error).__name__,
        )
        raise HTTPException(status_code=401, detail={"code": error_code})

    asserted = _decode_identity_assertion(identity)
    subject = str(claims.get("sub") or "")
    if not subject or asserted.get("sub") != subject:
        raise HTTPException(status_code=401, detail={"code": "identity_subject_mismatch"})
    email = str(asserted.get("email") or "").strip().lower()
    if not email or asserted.get("email_verified") is not True:
        return LogtoSessionResponse(status="rejected")

    linked = db.query(User).filter(User.logto_subject == subject).first()
    if linked:
        if linked.provisioning_status == "rejected":
            return LogtoSessionResponse(status="rejected")
        if not linked.is_active or linked.provisioning_status != "active":
            return LogtoSessionResponse(status="pending_activation")
        redirect_path = "/admin/dashboard" if linked.role in ADMIN_ROLES else "/portal/dashboard"
        return LogtoSessionResponse(status="active", redirect_path=redirect_path, user=_response_for_user(linked, db))

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        return LogtoSessionResponse(status="not_provisioned")
    occupied = db.query(User).filter(User.logto_subject == subject, User.id != user.id).first()
    if occupied:
        raise HTTPException(status_code=409, detail={"code": "logto_subject_already_bound"})

    auto_bind = user.account_type == "teacher" or user.role not in ADMIN_ROLES
    if auto_bind:
        user.logto_subject = subject
        db.commit()
        if not user.is_active or user.provisioning_status != "active":
            return LogtoSessionResponse(status="pending_activation")
        redirect_path = "/admin/dashboard" if user.role in ADMIN_ROLES else "/portal/dashboard"
        return LogtoSessionResponse(status="active", redirect_path=redirect_path, user=_response_for_user(user, db))

    request = db.query(LogtoBindingRequest).filter(
        LogtoBindingRequest.user_id == user.id,
        LogtoBindingRequest.logto_subject == subject,
    ).first()
    if not request:
        request = LogtoBindingRequest(
            user_id=user.id,
            logto_subject=subject,
            verified_email=email,
            requested_account_type=user.account_type,
            status="pending",
        )
        db.add(request)
        db.commit()
    elif request.status == "rejected":
        return LogtoSessionResponse(status="rejected")
    return LogtoSessionResponse(status="pending_binding")


@router.get("/admin/logto-binding-requests", response_model=list[LogtoBindingRequestResponse])
def list_logto_binding_requests(
    status_filter: str = Query("pending", alias="status"),
    _: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    query = db.query(LogtoBindingRequest)
    if status_filter != "all":
        query = query.filter(LogtoBindingRequest.status == status_filter)
    return [_binding_response(item) for item in query.order_by(LogtoBindingRequest.created_at.desc()).all()]


@router.post("/admin/logto-binding-requests/{request_id}/approve", response_model=LogtoBindingRequestResponse)
def approve_logto_binding_request(
    request_id: str,
    review: LogtoBindingReview,
    actor: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    item = db.query(LogtoBindingRequest).filter(LogtoBindingRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Binding request not found")
    target = db.query(User).filter(User.id == item.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    account_type = review.account_type or target.account_type or item.requested_account_type
    if target.role in ADMIN_ROLES and account_type not in {"teacher", "staff_admin"}:
        raise HTTPException(status_code=422, detail={"code": "account_type_required"})
    duplicate = db.query(User).filter(User.logto_subject == item.logto_subject, User.id != target.id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail={"code": "logto_subject_already_bound"})
    target.logto_subject = item.logto_subject
    target.account_type = account_type
    target.provisioning_status = "active"
    target.is_active = True
    item.requested_account_type = account_type
    item.status = "approved"
    item.reviewed_by = actor.id
    item.review_note = review.note
    item.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _binding_response(item)


@router.post("/admin/logto-binding-requests/{request_id}/reject", response_model=LogtoBindingRequestResponse)
def reject_logto_binding_request(
    request_id: str,
    review: LogtoBindingReview,
    actor: User = Depends(_require_super_admin),
    db: Session = Depends(get_db),
):
    item = db.query(LogtoBindingRequest).filter(LogtoBindingRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Binding request not found")
    item.status = "rejected"
    item.reviewed_by = actor.id
    item.review_note = review.note
    item.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _binding_response(item)


@router.get("/admin/account-type-defaults", response_model=list[AccountTypeDefaultResponse])
def list_account_type_defaults(
    _: User = Depends(_require_accounts_view),
    db: Session = Depends(get_db),
):
    rows = {item.account_type: item for item in db.query(AccountTypePermissionDefault).all()}
    return [AccountTypeDefaultResponse(account_type=kind, preset_id=rows.get(kind).preset_id if rows.get(kind) else None) for kind in ACCOUNT_TYPES]


@router.put("/admin/account-type-defaults/{account_type}", response_model=AccountTypeDefaultResponse)
def update_account_type_default(
    account_type: str,
    body: AccountTypeDefaultUpdate,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    if account_type not in ACCOUNT_TYPES:
        raise HTTPException(status_code=404, detail="Unknown account type")
    if body.preset_id:
        preset = db.query(PermissionPreset).filter(PermissionPreset.id == body.preset_id).first()
        if not preset:
            raise HTTPException(status_code=404, detail="Permission preset not found")
        _assert_grants_within_actor(actor, db, _preset_grants(preset))
    row = db.query(AccountTypePermissionDefault).filter(AccountTypePermissionDefault.account_type == account_type).first()
    if not row:
        row = AccountTypePermissionDefault(account_type=account_type)
        db.add(row)
    row.preset_id = body.preset_id
    row.updated_by = actor.id
    db.commit()
    return AccountTypeDefaultResponse(account_type=account_type, preset_id=row.preset_id)


@router.post("/admin/account-type-defaults/{account_type}/sync", response_model=AccountTypePermissionSyncResponse)
def sync_account_type_permissions(
    account_type: str,
    body: AccountTypePermissionSync,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    if not body.confirm:
        raise HTTPException(status_code=422, detail={"code": "confirmation_required"})
    row = db.query(AccountTypePermissionDefault).filter(AccountTypePermissionDefault.account_type == account_type).first()
    preset = db.query(PermissionPreset).filter(PermissionPreset.id == row.preset_id).first() if row and row.preset_id else None
    if not preset:
        raise HTTPException(status_code=422, detail={"code": "account_type_preset_missing"})
    grants = _preset_grants(preset)
    _assert_grants_within_actor(actor, db, grants)
    query = db.query(User).filter(User.account_type == account_type, User.role != SUPER_ADMIN_ROLE)
    if body.user_ids:
        query = query.filter(User.id.in_(body.user_ids))
    targets = query.all()
    for target in targets:
        if target.id == actor.id:
            continue
        _replace_permissions(db, target, grants, actor)
    db.commit()
    return AccountTypePermissionSyncResponse(updated=sum(1 for target in targets if target.id != actor.id))


@router.get("/permissions/catalog", response_model=list[PermissionCatalogItem])
def permission_catalog(user: User = Depends(_get_current_user)):
    if user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")
    return [PermissionCatalogItem(key=item.key, group=item.group, parent=item.parent, label_key=item.label_key) for item in PERMISSION_DEFINITIONS]


def _account_permissions_response(db: Session, target: User) -> AccountPermissionsResponse:
    rows = {row.permission_key: row for row in db.query(UserPermission).filter(UserPermission.user_id == target.id).all()}
    fallback = LEGACY_ADMIN_DEFAULTS if not rows else {}
    grants = [PermissionGrant(key=item.key, can_view=bool(rows[item.key].can_view) if item.key in rows else bool(fallback.get(item.key, (False, False))[0]), can_manage=bool(rows[item.key].can_manage) if item.key in rows else bool(fallback.get(item.key, (False, False))[1])) for item in PERMISSION_DEFINITIONS]
    return AccountPermissionsResponse(user_id=target.id, permissions=grants, effective_permissions=effective_permissions(db, target))


def _normalize_permission_grants(grants: list[PermissionGrant]) -> list[PermissionGrant]:
    submitted = {item.key: item for item in grants}
    unknown = sorted(set(submitted) - set(PERMISSION_MAP))
    if unknown:
        raise HTTPException(status_code=422, detail={"code": "unknown_permissions", "permissions": unknown})
    return [
        PermissionGrant(
            key=definition.key,
            can_view=bool(submitted.get(definition.key) and (submitted[definition.key].can_view or submitted[definition.key].can_manage)),
            can_manage=bool(submitted.get(definition.key) and submitted[definition.key].can_manage),
        )
        for definition in PERMISSION_DEFINITIONS
    ]


def _assert_grants_within_actor(actor: User, db: Session, grants: list[PermissionGrant]) -> None:
    if actor.role == SUPER_ADMIN_ROLE:
        return
    allowed = effective_permissions(db, actor)
    for grant in grants:
        actor_grant = allowed.get(grant.key, {"view": False, "manage": False})
        if grant.can_view and not actor_grant["view"]:
            raise HTTPException(status_code=403, detail={"code": "permission_escalation_forbidden", "permission": grant.key, "action": "view"})
        if grant.can_manage and not actor_grant["manage"]:
            raise HTTPException(status_code=403, detail={"code": "permission_escalation_forbidden", "permission": grant.key, "action": "manage"})


def _preset_response(preset: PermissionPreset) -> PermissionPresetResponse:
    try:
        raw = json.loads(preset.permissions_json or "[]")
        permissions = [PermissionGrant.model_validate(item) for item in raw]
    except (TypeError, ValueError):
        permissions = []
    return PermissionPresetResponse(
        id=preset.id,
        name=preset.name,
        description=preset.description or "",
        permissions=permissions,
        created_by=preset.created_by,
        updated_by=preset.updated_by,
        created_at=preset.created_at,
        updated_at=preset.updated_at,
    )


@router.get("/admin/permission-presets", response_model=list[PermissionPresetResponse])
def list_permission_presets(
    actor: User = Depends(_require_accounts_view),
    db: Session = Depends(get_db),
):
    return [_preset_response(item) for item in db.query(PermissionPreset).order_by(PermissionPreset.name.asc()).all()]


@router.post("/admin/permission-presets", response_model=PermissionPresetResponse)
def create_permission_preset(
    payload: PermissionPresetBody,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail={"code": "preset_name_required"})
    if db.query(PermissionPreset).filter(func.lower(PermissionPreset.name) == name.lower()).first():
        raise HTTPException(status_code=409, detail={"code": "preset_name_exists"})
    grants = _normalize_permission_grants(payload.permissions)
    _assert_grants_within_actor(actor, db, grants)
    preset = PermissionPreset(
        name=name,
        description=payload.description.strip(),
        permissions_json=json.dumps([item.model_dump() for item in grants]),
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return _preset_response(preset)


@router.put("/admin/permission-presets/{preset_id}", response_model=PermissionPresetResponse)
def update_permission_preset(
    preset_id: str,
    payload: PermissionPresetBody,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    preset = db.query(PermissionPreset).filter(PermissionPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Permission preset not found")
    name = payload.name.strip()
    duplicate = db.query(PermissionPreset).filter(func.lower(PermissionPreset.name) == name.lower(), PermissionPreset.id != preset.id).first()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail={"code": "preset_name_required"})
    if duplicate:
        raise HTTPException(status_code=409, detail={"code": "preset_name_exists"})
    grants = _normalize_permission_grants(payload.permissions)
    _assert_grants_within_actor(actor, db, grants)
    preset.name = name
    preset.description = payload.description.strip()
    preset.permissions_json = json.dumps([item.model_dump() for item in grants])
    preset.updated_by = actor.id
    db.commit()
    db.refresh(preset)
    return _preset_response(preset)


@router.delete("/admin/permission-presets/{preset_id}")
def delete_permission_preset(
    preset_id: str,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    preset = db.query(PermissionPreset).filter(PermissionPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Permission preset not found")
    db.delete(preset)
    db.commit()
    return {"detail": "Permission preset deleted"}


@router.get("/admin/accounts/{user_id}/permissions", response_model=AccountPermissionsResponse)
def get_account_permissions(
    user_id: str,
    actor: User = Depends(_require_accounts_view),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id, User.role == TEACHER_ADMIN_ROLE).first()
    if not target:
        raise HTTPException(status_code=404, detail="Teacher admin account not found")
    return _account_permissions_response(db, target)


@router.put("/admin/accounts/{user_id}/permissions", response_model=AccountPermissionsResponse)
def update_account_permissions(
    user_id: str,
    payload: AccountPermissionsUpdate,
    actor: User = Depends(_require_accounts_manage),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id, User.role == TEACHER_ADMIN_ROLE).first()
    if not target:
        raise HTTPException(status_code=404, detail="Teacher admin account not found")
    if target.id == actor.id:
        raise HTTPException(status_code=403, detail={"code": "self_permission_change_forbidden"})

    submitted = {item.key: item for item in payload.permissions}
    unknown = sorted(set(submitted) - set(PERMISSION_MAP))
    if unknown:
        raise HTTPException(status_code=422, detail={"code": "unknown_permissions", "permissions": unknown})

    before_rows = db.query(UserPermission).filter(UserPermission.user_id == target.id).all()
    before = {row.permission_key: {"view": bool(row.can_view), "manage": bool(row.can_manage)} for row in before_rows}
    # An untouched legacy admin has implicit defaults until their first explicit
    # permission save. Compare against those effective stored defaults so a
    # delegated account manager cannot silently revoke dimensions they lack.
    comparison_before = before or {
        key: {"view": bool(value[0] or value[1]), "manage": bool(value[1])}
        for key, value in LEGACY_ADMIN_DEFAULTS.items()
    }
    actor_permissions = effective_permissions(db, actor)
    if actor.role != SUPER_ADMIN_ROLE:
        for definition in PERMISSION_DEFINITIONS:
            key = definition.key
            grant = submitted.get(key)
            old = comparison_before.get(key, {"view": False, "manage": False})
            requested = {
                "view": bool(grant and (grant.can_view or grant.can_manage)),
                "manage": bool(grant and grant.can_manage),
            }
            allowed = actor_permissions.get(key, {"view": False, "manage": False})
            if ((requested["view"] != old["view"] and not allowed["view"]) or
                    (requested["manage"] != old["manage"] and not allowed["manage"])):
                raise HTTPException(status_code=403, detail={"code": "permission_escalation_forbidden", "permission": key})

    db.query(UserPermission).filter(UserPermission.user_id == target.id).delete(synchronize_session=False)
    after = {}
    for definition in PERMISSION_DEFINITIONS:
        grant = submitted.get(definition.key)
        if not grant:
            continue
        can_manage = bool(grant.can_manage)
        can_view = bool(grant.can_view or can_manage)
        if can_view or can_manage:
            db.add(UserPermission(user_id=target.id, permission_key=definition.key, can_view=can_view, can_manage=can_manage, updated_by=actor.id))
            after[definition.key] = {"view": can_view, "manage": can_manage}
    db.add(PermissionAuditLog(actor_id=actor.id, target_user_id=target.id, before_json=json.dumps(comparison_before, sort_keys=True), after_json=json.dumps(after, sort_keys=True)))
    db.commit()
    return _account_permissions_response(db, target)
