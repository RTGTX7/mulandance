from functools import lru_cache
from typing import Any, Optional
import base64
import hashlib
import hmac
import json
import time
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
import jwt as pyjwt
from jwt import PyJWKClient
from app.core.config import settings

def decode_token(token: str) -> Optional[dict]:
    """Validate a Logto access token and expose the linked local user id.

    Several existing API modules still consume ``payload['sub']`` as the local
    user UUID. Keeping that contract here lets authentication migrate without
    changing business authorization or foreign-key ownership semantics.
    """
    try:
        if token.startswith("dev."):
            return _decode_development_token(token)
        payload = validate_logto_token(token)
        logto_subject = payload.get("sub")
        if not logto_subject:
            return None
        from app.core.database import SessionLocal
        from app.models import User

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.logto_subject == logto_subject).first()
            if not user or not user.is_active or user.provisioning_status != "active":
                return None
            payload = dict(payload)
            payload["logto_sub"] = logto_subject
            payload["sub"] = user.id
        finally:
            db.close()
        return payload
    except Exception:
        return None


def _decode_development_token(token: str) -> dict[str, Any]:
    if settings.ENVIRONMENT.strip().lower() not in {"development", "dev", "local", "test"} or not settings.DEV_AUTH_BYPASS:
        raise ValueError("Development authentication is disabled")
    secret = settings.DEV_AUTH_SECRET.encode("utf-8")
    if len(secret) < 32:
        raise ValueError("DEV_AUTH_SECRET must contain at least 32 characters")
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid development token")
    _, encoded, signature = parts
    expected = hmac.new(secret, encoded.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValueError("Invalid development token signature")
    padded = encoded + "=" * (-len(encoded) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Development token expired")
    email = str(payload.get("email") or "").strip().lower()
    if not email or email != settings.DEV_AUTH_EMAIL.strip().lower():
        raise ValueError("Development account mismatch")
    from app.core.database import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            raise ValueError("Development account is unavailable")
        return {"sub": user.id, "email": email, "dev_auth": True, "exp": payload["exp"]}
    finally:
        db.close()


def _normalized_endpoint() -> str:
    endpoint = settings.LOGTO_ENDPOINT.strip().rstrip("/")
    if not endpoint:
        raise RuntimeError("LOGTO_ENDPOINT is not configured")
    return endpoint


@lru_cache(maxsize=1)
def get_logto_oidc_configuration() -> dict[str, Any]:
    url = f"{_normalized_endpoint()}/oidc/.well-known/openid-configuration"
    response = httpx.get(url, timeout=10.0, follow_redirects=True)
    response.raise_for_status()
    data = response.json()
    if not data.get("issuer") or not data.get("jwks_uri"):
        raise RuntimeError("Logto OIDC discovery response is incomplete")
    return data


@lru_cache(maxsize=1)
def get_logto_jwks_client() -> PyJWKClient:
    return PyJWKClient(get_logto_oidc_configuration()["jwks_uri"], cache_keys=True)


def validate_logto_token(token: str) -> dict[str, Any]:
    if not settings.LOGTO_API_RESOURCE.strip():
        raise RuntimeError("LOGTO_API_RESOURCE is not configured")
    config = get_logto_oidc_configuration()
    algorithm = str(pyjwt.get_unverified_header(token).get("alg") or "")
    supported = config.get("id_token_signing_alg_values_supported") or ["RS256"]
    allowed = {
        value
        for value in supported
        if value in {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}
    }
    if algorithm not in allowed:
        raise pyjwt.InvalidAlgorithmError(f"Unsupported Logto signing algorithm: {algorithm}")
    signing_key = get_logto_jwks_client().get_signing_key_from_jwt(token)
    return pyjwt.decode(
        token,
        signing_key.key,
        algorithms=[algorithm],
        issuer=config["issuer"],
        audience=settings.LOGTO_API_RESOURCE,
        leeway=30,
        options={"require": ["exp", "iat", "sub"]},
    )


http_bearer = HTTPBearer(auto_error=False)


def oauth2_scheme(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_user_id(
    token: str = Depends(oauth2_scheme),
) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    return user_id
