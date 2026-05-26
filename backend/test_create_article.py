import urllib.request
import json

API_URL = "http://localhost:8000"

# First login to get token
login_data = json.dumps({
    "email": "admin@mulandance.com",
    "password": "admin123"
}).encode()

print("Logging in...")
login_req = urllib.request.Request(
    f"{API_URL}/api/v1/users/login",
    data=login_data,
    method="POST"
)
login_req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(login_req) as response:
        login_resp = json.loads(response.read().decode())
        print(f"Login status: OK")
        token = login_resp["access_token"]
        print(f"Token: {token[:50]}...")
        
        # Try creating article
        article_data = {
            "title": "Test Article from API",
            "slug": "test-article-" + str(int(__import__('time').time()) % 100000),
            "summary": "This is a test article summary",
            "body": "# Hello World\n\nThis is the body content.",
            "cover_image": "",
            "category_slugs": ["announcements"],
            "tag_slugs": [],
            "locale": "en",
            "is_published": True
        }
        
        article_json = json.dumps(article_data).encode()
        
        print("\nCreating article...")
        article_req = urllib.request.Request(
            f"{API_URL}/api/v1/news",
            data=article_json,
            method="POST"
        )
        article_req.add_header("Authorization", f"Bearer {token}")
        article_req.add_header("Content-Type", "application/json")
        
        try:
            with urllib.request.urlopen(article_req) as resp:
                result = json.loads(resp.read().decode())
                print(f"Create status: OK")
                print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"Create failed with {e.code}: {error_body}")
            print("\nThis might be a file storage issue. Checking USE_FILE_STORAGE config...")
        
        # List articles
        print("\nListing articles...")
        list_req = urllib.request.Request(f"{API_URL}/api/v1/news")
        with urllib.request.urlopen(list_req) as list_resp:
            articles = json.loads(list_resp.read().decode())
            print(f"List status: OK")
            print(f"Articles count: {len(articles)}")
            for a in articles:
                print(f"  - {a.get('title')}, slug: {a.get('slug')}, published: {a.get('is_published')}")
                
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"Error {e.code}: {body}")
except Exception as e:
    print(f"Error: {e}")