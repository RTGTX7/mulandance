import base64
import hashlib
import hmac
import json
import time
import unittest

import jwt
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1 import users
from app.core import security
from app.core.config import settings
from app.models import Base, LogtoBindingRequest, User, UserProfile
from app.schemas.user import LogtoSessionIdentity


class _Key:
    def __init__(self, key):
        self.key = key


class _JwksClient:
    def __init__(self, keys):
        self.keys = keys

    def get_signing_key_from_jwt(self, token):
        kid = jwt.get_unverified_header(token)["kid"]
        return _Key(self.keys[kid].public_key())


class LogtoJwtTests(unittest.TestCase):
    def test_safe_diagnostic_codes(self):
        cases = (
            (jwt.ExpiredSignatureError(), "logto_token_expired"),
            (jwt.InvalidAudienceError(), "logto_token_wrong_audience"),
            (jwt.InvalidIssuerError(), "logto_token_wrong_issuer"),
            (jwt.InvalidAlgorithmError(), "logto_token_algorithm_rejected"),
            (jwt.PyJWKClientError("unavailable"), "logto_jwks_error"),
            (jwt.DecodeError(), "invalid_logto_token"),
        )
        for error, expected in cases:
            with self.subTest(error=type(error).__name__):
                self.assertEqual(security.logto_token_error_code(error), expected)

    def test_signature_issuer_audience_expiry_and_rotation(self):
        keys = {"one": rsa.generate_private_key(public_exponent=65537, key_size=2048), "two": rsa.generate_private_key(public_exponent=65537, key_size=2048)}
        old_config = security.get_logto_oidc_configuration
        old_client = security.get_logto_jwks_client
        old_resource = settings.LOGTO_API_RESOURCE
        security.get_logto_oidc_configuration = lambda: {"issuer": "https://login.example/oidc", "jwks_uri": "unused"}
        security.get_logto_jwks_client = lambda: _JwksClient(keys)
        settings.LOGTO_API_RESOURCE = "https://api.example"
        now = int(time.time())

        def make(kid="one", **updates):
            payload = {"sub": "user", "iss": "https://login.example/oidc", "aud": "https://api.example", "iat": now, "exp": now + 300}
            payload.update(updates)
            return jwt.encode(payload, keys[kid], algorithm="RS256", headers={"kid": kid})

        try:
            self.assertEqual(security.validate_logto_token(make())["sub"], "user")
            self.assertEqual(security.validate_logto_token(make("two"))["sub"], "user")
            for invalid in (make(aud="wrong"), make(iss="wrong"), make(exp=now - 120)):
                with self.assertRaises(jwt.PyJWTError):
                    security.validate_logto_token(invalid)
        finally:
            security.get_logto_oidc_configuration = old_config
            security.get_logto_jwks_client = old_client
            settings.LOGTO_API_RESOURCE = old_resource

    def test_es384_from_oidc_discovery(self):
        key = ec.generate_private_key(ec.SECP384R1())
        old_config = security.get_logto_oidc_configuration
        old_client = security.get_logto_jwks_client
        old_resource = settings.LOGTO_API_RESOURCE
        security.get_logto_oidc_configuration = lambda: {
            "issuer": "https://login.example/oidc",
            "jwks_uri": "unused",
            "id_token_signing_alg_values_supported": ["ES384"],
        }
        security.get_logto_jwks_client = lambda: _JwksClient({"ec-one": key})
        settings.LOGTO_API_RESOURCE = "https://api.example"
        now = int(time.time())
        token = jwt.encode(
            {"sub": "user", "iss": "https://login.example/oidc", "aud": "https://api.example", "iat": now, "exp": now + 300},
            key,
            algorithm="ES384",
            headers={"kid": "ec-one"},
        )
        try:
            self.assertEqual(security.validate_logto_token(token)["sub"], "user")
        finally:
            security.get_logto_oidc_configuration = old_config
            security.get_logto_jwks_client = old_client
            settings.LOGTO_API_RESOURCE = old_resource


class LogtoBindingTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.old_validator = users.validate_logto_token
        self.old_secret = settings.LOGTO_SESSION_ASSERTION_SECRET
        users.validate_logto_token = lambda token: {"sub": token}
        settings.LOGTO_SESSION_ASSERTION_SECRET = "test-secret-" * 4

    def tearDown(self):
        users.validate_logto_token = self.old_validator
        settings.LOGTO_SESSION_ASSERTION_SECRET = self.old_secret
        self.db.close()

    def identity(self, subject, email):
        data = {"sub": subject, "email": email, "email_verified": True, "iat": int(time.time())}
        payload = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
        signature = hmac.new(settings.LOGTO_SESSION_ASSERTION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return LogtoSessionIdentity(payload=payload, signature=signature)

    def add_user(self, email, account_type=None):
        user = User(email=email, password_hash="legacy", role="admin", is_active=True, account_type=account_type, provisioning_status="active")
        self.db.add(user)
        self.db.flush()
        self.db.add(UserProfile(user_id=user.id, first_name="Test", last_name="User"))
        self.db.commit()
        return user

    def test_teacher_auto_binds_but_untyped_admin_waits(self):
        teacher = self.add_user("teacher@example.com", "teacher")
        admin = self.add_user("admin@example.com")
        teacher_result = users.complete_logto_session(self.identity("teacher-sub", teacher.email), HTTPAuthorizationCredentials(scheme="Bearer", credentials="teacher-sub"), self.db)
        admin_result = users.complete_logto_session(self.identity("admin-sub", admin.email), HTTPAuthorizationCredentials(scheme="Bearer", credentials="admin-sub"), self.db)
        self.assertEqual(teacher_result.status, "active")
        self.assertEqual(admin_result.status, "pending_binding")
        self.assertEqual(self.db.query(LogtoBindingRequest).count(), 1)


if __name__ == "__main__":
    unittest.main()
