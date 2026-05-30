# Development Log - Alpha 2.1.0

**Version:** alpha 2.1.0  
**Date:** 2026-05-31  
**Repository:** github.com/RTGTX7/mulandance  

---

## Summary

This release introduces a comprehensive classroom rental management system, including user-side classroom request functionality, admin-side approval workflow, and internal classroom management. It also includes homepage content management, admin classroom interface optimizations with categorized browsing, updated multi-language support (Chinese, English, French), and improvements to homepage components (Hero carousel, Stats section, CTA banner).

---

## New Features

### 1. Classroom Rental Request System

New user-facing page for requesting classroom rentals.

**Files Added:**
- `frontend/src/app/[locale]/classrooms/request/page.tsx`

### 2. Classroom Approval Workflow

Admin pages for managing classroom rental approvals with categorized views.

**Files Added:**
- `frontend/src/app/[locale]/admin/classrooms/approved/page.tsx`
- `frontend/src/app/[locale]/admin/classrooms/requests/page.tsx`
- `frontend/src/app/[locale]/admin/classrooms/internal/page.tsx`

### 3. Homepage Content Management

New admin page for managing homepage content.

**Files Added:**
- `frontend/src/app/[locale]/admin/homepage/page.tsx`

---

## Changes

### Frontend - Classroom Management
- `frontend/src/app/[locale]/admin/classrooms/page.tsx` - Updated admin classroom listing
- `frontend/src/app/[locale]/classrooms/page.tsx` - Classroom page improvements
- `frontend/src/components/layout/AdminSectionTabs.tsx` - Added classroom management sections
- `frontend/src/components/layout/Header.tsx` - Header navigation updates
- `frontend/src/components/sections/CTABanner.tsx` - CTA banner improvements
- `frontend/src/components/sections/HeroCarousel.tsx` - Hero carousel updates
- `frontend/src/components/sections/StatsSection.tsx` - Stats section enhancements
- `frontend/src/lib/api.ts` - Classroom API updates

### Backend - Classroom & Settings API
- `backend/app/api/v1/classrooms.py` - Classroom rental API endpoints
- `backend/app/api/v1/settings.py` - Settings API updates
- `backend/app/api/v1/upload.py` - Upload API improvements
- `backend/app/main.py` - Main application configuration
- `backend/app/models/__init__.py` - Model updates
- `backend/app/schemas/classroom.py` - Classroom schema definitions
- `backend/app/schemas/settings.py` - Settings schema updates

### Internationalization
- `frontend/src/lib/locales/zh.json` - Chinese translation updates
- `frontend/src/lib/locales/en.json` - English translation updates
- `frontend/src/lib/locales/fr.json` - French translation updates

---

## Previous Releases

### Alpha 1.1.2 (2026-05-28)

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