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
    all_pass = True
    slug = f"debug-toggle-{int(time.time())}"

    print("\n=== TEST 1: Create temporary article ===")
    status, created = request_json(
        "/api/v1/news",
        method="POST",
        token=token,
        body={
            "title": "Debug Toggle Article",
            "slug": slug,
            "summary": "Temporary article for publish toggle diagnostics.",
            "body": "# Debug Toggle Article\n\nTemporary body.",
            "cover_image": "",
            "category_slugs": [],
            "tag_slugs": [],
            "locale": "zh",
            "is_published": True,
        },
    )
    print(f"Status: {status}, slug={slug}")
    if status != 200:
        print(f"FAIL: {created}")
        return False
    print("PASS")

    try:
        print("\n=== TEST 2: Admin list contains temporary article ===")
        status, data = request_json("/api/v1/news/admin/list", token=token)
        found = status == 200 and any(item.get("slug") == slug for item in data)
        print(f"Status: {status}, found={found}")
        if found:
            print("PASS")
        else:
            print("FAIL")
            all_pass = False

        print("\n=== TEST 3: Toggle published -> draft ===")
        status, result = request_json(
            f"/api/v1/news/{slug}/status",
            method="PUT",
            token=token,
            body={"is_published": False},
        )
        ok = status == 200 and result.get("is_published") is False
        print(f"Status: {status}, is_published={result.get('is_published')}")
        print("PASS" if ok else "FAIL")
        all_pass = all_pass and ok

        print("\n=== TEST 4: Public list excludes draft ===")
        status, data = request_json("/api/v1/news")
        visible = status == 200 and any(item.get("slug") == slug for item in data)
        print(f"Status: {status}, visible={visible}")
        ok = status == 200 and not visible
        print("PASS" if ok else "FAIL")
        all_pass = all_pass and ok

        print("\n=== TEST 5: Admin list still contains draft ===")
        status, data = request_json("/api/v1/news/admin/list", token=token)
        found_draft = status == 200 and any(item.get("slug") == slug and not item.get("is_published") for item in data)
        print(f"Status: {status}, found_draft={found_draft}")
        print("PASS" if found_draft else "FAIL")
        all_pass = all_pass and found_draft

        print("\n=== TEST 6: Toggle draft -> published ===")
        status, result = request_json(
            f"/api/v1/news/{slug}/status",
            method="PUT",
            token=token,
            body={"is_published": True},
        )
        ok = status == 200 and result.get("is_published") is True
        print(f"Status: {status}, is_published={result.get('is_published')}")
        print("PASS" if ok else "FAIL")
        all_pass = all_pass and ok
    finally:
        print("\n=== CLEANUP: Delete temporary article ===")
        status, payload = request_json(f"/api/v1/news/{slug}", method="DELETE", token=token)
        print(f"Status: {status}, payload={payload}")

    print("\n" + "=" * 50)
    print("ALL PASSED" if all_pass else "SOME FAILED")
    return all_pass


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
