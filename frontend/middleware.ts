import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const nextIntlMiddleware = createMiddleware({
  locales: ['en', 'zh', 'zh-Hant', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export default function middleware(request: NextRequest) {
  const response = (nextIntlMiddleware(request) || NextResponse.next()) as Response | NextResponse;
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\.(png|jpg|jpeg|gif|webp|svg)|favicon.ico).*)'],
};
