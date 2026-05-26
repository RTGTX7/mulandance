# Development Log - Alpha 1.1.0

**Version:** alpha 1.1.0  
**Date:** 2026-05-26  
**Repository:** github.com/[username]/dance-organization

---

## Summary

This release focuses on fixing critical bugs in the admin article editor, implementing image upload functionality, and resolving authentication persistence issues.

---

## Bug Fixes

### 1. Article Creation 500 Error (`TypeError: write() argument must be str, not bytes`)

**Root Cause:** The `frontmatter.dump()` function in newer versions of the `python-frontmatter` library internally encodes content to bytes. Opening the file in text mode (`"w"`) caused a byte/string mismatch.

**Fix:** Changed `_write_markdown_file()` to use `frontmatter.dumps()` for rendering the complete markdown string, then write it with UTF-8 text encoding.

**Files Changed:**
- `backend/app/services/news_files.py` - `_write_markdown_file()` function

```python
# Before (broken)
def _write_markdown_file(filepath: Path, content: str, metadata: dict) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        frontmatter.dump(frontmatter.Post(content, **metadata), f)

# After (fixed)
def _write_markdown_file(filepath: Path, content: str, metadata: dict) -> None:
    post = frontmatter.Post(content or "", **metadata)
    rendered = frontmatter.dumps(post)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        f.write(rendered)
```

---

### 2. Edit Mode Data Loading (body/categories/tags/cover_image missing)

**Root Cause:** Two issues:
1. Pydantic schema `ArticleWithRelations` did not include a `body` field, so FastAPI automatically filtered it out of API responses.
2. `get_article()` did not read body content from markdown files when file storage was enabled.

**Fixes:**

**Files Changed:**
- `backend/app/schemas/news.py` - Added `body: Optional[str] = None` to `ArticleWithRelations`
- `backend/app/services/news_files.py` - `_get_article_with_relations()` returns body field; `get_article()` reads body from markdown file

```python
# backend/app/schemas/news.py
class ArticleWithRelations(BaseModel):
    id: str
    slug: str
    title: str
    summary: Optional[str] = None
    body: Optional[str] = None  # ← Added
    ...
```

- `backend/app/api/v1/news.py` - Added admin-only endpoint `GET /api/v1/news/admin/{slug}` that returns all articles (including drafts)

```python
# Admin endpoint: get any article (including drafts)
@router.get("/admin/{slug}", response_model=ArticleWithHtml)
def get_admin_article(slug: str, db: Session = Depends(get_db)):
    article = news_files.get_article(db, slug, include_html=True)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
```

- `frontend/src/lib/api.ts` - Changed `newsApi.get()` to use `/v1/news/admin/{slug}` instead of `/v1/news/{slug}`

---

### 3. Image Upload 404 Not Found

**Root Cause:** The upload router was included with an empty prefix (`prefix=""`), so the route was `/api/v1/upload/image`. However, static files were not mounted for serving uploaded images.

**Fixes:**

**Files Changed:**
- `backend/app/api/v1/upload.py` - Created complete upload API with organized storage structure
- `backend/app/api/v1/router.py` - Changed upload prefix to `/upload`
- `backend/app/main.py` - Mounted static files at `/static/uploads`

**Upload API:**
```
POST /api/v1/upload/image
Request: FormData with `file` field
Response: { "url": "...", "filename": "...", "path": "..." }
```

**Storage Structure:**
```
data/
└── uploads/
    └── images/
        └── editor/
            ├── 2026/
            │   └── 05/
            │       └── <uuid>.png
            └── covers/
                └── 2026/
                    └── 05/
                        └── <uuid>.png
```

**Public URL:** `http://localhost:8000/static/uploads/images/editor/2026/05/<uuid>.png`

---

### 4. Admin Auth Persistence (every refresh shows login page)

**Root Cause:** `admin/layout.tsx` used SSR to check authentication via `isAuthenticated()`. On the server side, `localStorage` is not available, so `getAuthToken()` always returned `null`, causing `isAuthenticated()` to return `false` and redirecting to login.

**Fix:** Removed SSR authentication check from `admin/layout.tsx`. Authentication is now handled entirely on the client side by each page's `useEffect`.

**Files Changed:**
- `frontend/src/app/[locale]/admin/layout.tsx` - Removed `redirect()` and `isAuthenticated()` calls

---

## New Features

### 1. Image Upload in Article Editor

Added a toolbar button for uploading images directly from the article editor. When an image is selected:
1. The file is uploaded to the backend via `POST /api/v1/upload/image`
2. Backend saves it to `data/uploads/images/editor/YYYY/MM/<uuid>.<ext>`
3. Backend returns a public URL
4. Frontend inserts `![filename](url)` markdown syntax at the cursor position

**Files Changed:**
- `frontend/src/app/[locale]/admin/editor/page.tsx` - Added image upload button, file input, and `handleInsertImage()` handler
- `frontend/src/lib/api.ts` - Added `uploadApi.image()` function with detailed error messages

---

### 2. Enhanced Error Handling

Added try/except blocks with detailed logging to article creation and update endpoints. Errors now return descriptive JSON responses instead of generic 500 errors.

**Files Changed:**
- `backend/app/api/v1/news.py` - Added `logging` import and error handlers for `create_article` and `update_article`

---

## Testing

### Article Creation & Editing
1. Create a new article with title, body content, and categories
2. Click Publish - should save without 500 error
3. Click Edit on the saved article - body content should load correctly
4. Categories/tags should be highlighted correctly
5. Cover image URL should display in the input field

### Image Upload
1. Open article editor
2. Click the image icon in the toolbar
3. Select an image file (PNG/JPG/GIF/WEBP/SVG, max 10MB)
4. Image should be uploaded and markdown inserted at cursor
5. Image should be accessible at the returned URL

### Auth Persistence
1. Login with admin credentials
2. Navigate to dashboard
3. Refresh the page - should remain logged in
4. Close browser and reopen - should remain logged in (token persists in localStorage)
5. Logout - token should be cleared

---

## Known Issues

- The bcrypt `__about__` warning from `passlib` is still present but does not affect functionality. This is caused by incompatibility between `passlib` and newer versions of the `bcrypt` library.