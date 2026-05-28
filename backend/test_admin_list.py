import urllib.request
import urllib.error
import json
import time

API_URL = "http://localhost:8000"

def get_token():
    login_data = json.dumps({
        "email": "admin@mulandance.com",
        "password": "admin123"
    }).encode()
    login_req = urllib.request.Request(
        f"{API_URL}/api/v1/users/login",
        data=login_data,
        method="POST"
    )
    login_req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(login_req) as response:
        resp = json.loads(response.read().decode())
        return resp["access_token"]

def api_get_admin(path, token):
    req = urllib.request.Request(f"{API_URL}{path}")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def api_get_public(path):
    req = urllib.request.Request(f"{API_URL}{path}")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def api_put_status(path, token, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{API_URL}{path}", data=data, method="PUT")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

token = get_token()
print(f"Token: {token[:50]}...")
all_pass = True

# TEST 1: Admin list
print("\n=== TEST 1: Admin list (GET /api/v1/news/admin/list) ===")
status, data = api_get_admin("/api/v1/news/admin/list", token)
print(f"Status: {status}")
if status == 200:
    print(f"Count: {len(data)}")
    for a in data:
        pub = a.get('is_published', 'MISSING')
        print(f"  - {a['title'][:35]:35s} slug={a['slug']} is_published={pub}")
    print("PASS")
else:
    print(f"FAIL: {str(data)[:300]}")
    all_pass = False

# TEST 2: Public list
print("\n=== TEST 2: Public list (GET /api/v1/news) ===")
status, data = api_get_public("/api/v1/news")
print(f"Status: {status}")
if status == 200:
    print(f"Count: {len(data)}")
    for a in data:
        pub = a.get('is_published', 'MISSING')
        print(f"  - {a['title'][:35]:35s} is_published={pub}")
    print("PASS")
else:
    print(f"FAIL: {str(data)[:300]}")
    all_pass = False

# TEST 3: Toggle published -> draft
print("\n=== TEST 3: Toggle published -> draft ===")
slug = 'test-article-57537'
status, result = api_put_status(f"/api/v1/news/{slug}/status", token, {"is_published": False})
print(f"Status: {status} is_published={result.get('is_published')}")
if status == 200 and result.get('is_published') == False:
    print("PASS")
else:
    print("FAIL")
    all_pass = False
time.sleep(0.5)

# TEST 4: Admin list after toggle (draft should be visible)
print("\n=== TEST 4: Admin list after toggle (draft visible) ===")
status, data = api_get_admin("/api/v1/news/admin/list", token)
if status == 200:
    draft_found = any(not a.get('is_published') for a in data)
    print(f"Count: {len(data)}, Drafts found: {draft_found}")
    for a in data:
        pub = a.get('is_published')
        marker = ' [DRAFT]' if not pub else ''
        print(f"  - {a['title'][:35]:35s} is_published={pub}{marker}")
    if draft_found:
        print("PASS: Draft found in admin list")
    else:
        print("FAIL: No drafts in admin list")
        all_pass = False
else:
    print(f"FAIL: {str(data)[:300]}")
    all_pass = False

# TEST 5: Public list after toggle (draft should NOT be visible)
print("\n=== TEST 5: Public list after toggle (draft NOT visible) ===")
status, data = api_get_public("/api/v1/news")
if status == 200:
    draft_in_public = any(not a.get('is_published') for a in data)
    print(f"Count: {len(data)}")
    for a in data:
        print(f"  - {a['title'][:35]:35s} is_published={a.get('is_published')}")
    if not draft_in_public:
        print("PASS: Draft NOT in public list")
    else:
        print("FAIL: Draft visible in public list")
        all_pass = False
else:
    print(f"FAIL: {str(data)[:300]}")
    all_pass = False

# TEST 6: Toggle draft -> published
print("\n=== TEST 6: Toggle draft -> published ===")
status, result = api_put_status(f"/api/v1/news/{slug}/status", token, {"is_published": True})
print(f"Status: {status} is_published={result.get('is_published')}")
if status == 200 and result.get('is_published') == True:
    print("PASS")
else:
    print("FAIL")
    all_pass = False

print("\n" + "=" * 50)
print("ALL PASSED" if all_pass else "SOME FAILED")