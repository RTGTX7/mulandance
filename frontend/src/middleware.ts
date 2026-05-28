import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const nextIntlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh', 'zh-Hant', 'fr'],

  // Used when no locale matches
  defaultLocale: 'en',
});

export default function middleware(request: NextRequest) {
  const response = nextIntlMiddleware(request);

  // Extract the pathname without locale prefix and set it as header
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(en|zh|zh-Hant|fr)(\/.*)?$/);
  const originalPathname = localeMatch ? localeMatch[2] || '/' : pathname;

  if (response) {
    response.headers.set('x-pathname', originalPathname);
  }

  return response;
}

export const config = {
  // Matcher will skip:
  // - Files with any of these extensions (static assets)
  // - Path segments that start with an underscore (private files)
  // - The root `/` route — middleware redirects it to /en via defaultLocale
  // - The `/api` routes (backend API)
  // - The `/docs` and `/redoc` routes (Swagger)
  // - The `/_next` prefix (Next.js internals)
  // - The `/favicon.ico` and other root-level static files
  matcher: ['/((?!api|docs|redoc|_next|_static|favicon.ico|.*\\..*|api).*)'],
};
