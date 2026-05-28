# Development Log - Alpha 1.1.0

**Version:** alpha 1.1.2  
**Date:** 2026-05-28  
**Repository:** github.com/RTGTX7/mulandance  

---

## Summary

This release adds new admin sections for managing performances and registrations, introduces `AdminSectionTabs` component for unified admin navigation, improves the article editor with a new `EditorContent` component, and updates all major site content pages (programs, classes, events, performances, portal, support, about) with fresh i18n translations and layout improvements.

---

## New Features

### 1. Admin Section Navigation (`AdminSectionTabs`)

New `AdminSectionTabs` component provides consistent sidebar navigation across all admin pages with sections for Dashboard, Articles, Categories, Tags, Performances, and Registrations.

**Files Added:**
- `frontend/src/components/layout/AdminSectionTabs.tsx`
- `frontend/src/app/[locale]/admin/performances/page.tsx`
- `frontend/src/app/[locale]/admin/registrations/page.tsx`

### 2. Article Editor Refactoring

Extracted editor content area into a separate `EditorContent` component for better code organization and reusability.

**Files Added:**
- `frontend/src/app/[locale]/admin/editor/EditorContent.tsx`

---

## Changes

### Frontend - Content Page Updates
All major site pages received i18n translation updates and layout improvements:

**Programs:** ballet, chinese-dance, contemporary, hip-hop, jazz, summer-camps
**Classes:** schedule, pricing, register, absence-policy, faqs
**Events:** calendar, gala, workshops
**Performances:** current-season, archive, tickets
**Portal:** login, register, forgot-password, dashboard
**Support:** donate, membership, sponsorship, volunteer
**About:** mission-values, history, equity-diversity-inclusion, careers
**Other:** accessibility, privacy, terms, resources, alumni

**Backend:**
- `backend/app/api/v1/events.py` - Event API updates
- `backend/app/schemas/event.py` - Event schema improvements
- `backend/app/core/config.py` - Config refinements
- `frontend/src/lib/api.ts` - API layer updates
- `frontend/src/lib/locales/en.json` and `zh.json` - Translation updates
- `frontend/middleware.ts` and `frontend/src/app/[locale]/layout.tsx` - Middleware/layout improvements

---

## Previous Releases

### Alpha 1.1.1 (2026-05-27)

Fixed critical database path bug that caused the backend to use the wrong SQLite database file when started from the wrong working directory. The fix uses an absolute path computed from the config file's location.

**Files Changed:**
- `backend/app/core/config.py` - Absolute database path resolution

### Alpha 1.1.0 (2026-05-26)

Initial release with article editor fixes, image upload, and auth persistence improvements.

**Files Changed:**
- `backend/app/services/news_files.py` - Article file writing fix
- `backend/app/schemas/news.py` - Added body field to ArticleWithRelations
- `backend/app/api/v1/news.py` - Admin article endpoints
- `backend/app/api/v1/upload.py` - Image upload API
- `backend/app/api/v1/router.py` - Upload route configuration
- `backend/app/main.py` - Static file mounting
- `frontend/src/app/[locale]/admin/layout.tsx` - Removed SSR auth check
- `frontend/src/app/[locale]/admin/editor/page.tsx` - Image upload button
- `frontend/src/lib/api.ts` - Upload API and admin article fetch