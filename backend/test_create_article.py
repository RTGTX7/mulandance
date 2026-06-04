import json
import time
import urllib.error
import urllib.request

API_URL = "http://localhost:8000"


def request_json(path, method="GET", token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API_URL}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read().decode())


def get_token():
    status, payload = request_json(
        "/api/v1/users/login",
        method="POST",
        body={"email": "admin@mulandance.com", "password": "admin123"},
    )
    if status != 200:
        raise RuntimeError(f"Login failed: {status} {payload}")
    return payload["access_token"]


def main():
    token = get_token()
    print(f"Token: {token[:50]}...")
    slug = f"debug-create-{int(time.time())}"

    print("\n=== TEST 1: Create article ===")
    status, result = request_json(
        "/api/v1/news",
        method="POST",
        token=token,
        body={
            "title": "Debug Create Article",
            "slug": slug,
            "summary": "Temporary article for create diagnostics.",
            "body": "# Debug Create Article\n\nTemporary body.",
            "cover_image": "",
            "category_slugs": ["announcements"],
            "tag_slugs": [],
            "locale": "en",
            "is_published": True,
        },
    )
    print(f"Status: {status}, slug={slug}")
    if status != 200:
        print(f"FAIL: {result}")
        return False
    print("PASS")

    try:
        print("\n=== TEST 2: Public list contains created article ===")
        status, articles = request_json("/api/v1/news")
        found = status == 200 and any(item.get("slug") == slug for item in articles)
        print(f"Status: {status}, found={found}")
        print("PASS" if found else "FAIL")
        return found
    finally:
        print("\n=== CLEANUP: Delete temporary article ===")
        status, payload = request_json(f"/api/v1/news/{slug}", method="DELETE", token=token)
        print(f"Status: {status}, payload={payload}")


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
