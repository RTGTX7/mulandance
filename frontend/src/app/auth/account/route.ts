import { NextResponse } from 'next/server';
import { getAppBaseUrl } from '@/lib/logto';

const allowed = new Set(['profile', 'security', 'email', 'phone', 'password']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const section = allowed.has(url.searchParams.get('section') || '') ? url.searchParams.get('section')! : 'profile';
  const locale = url.searchParams.get('locale') || 'en';
  const endpoint = (process.env.LOGTO_ENDPOINT || process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || '').replace(/\/$/, '');
  if (!endpoint) return NextResponse.json({ detail: 'Logto is not configured' }, { status: 503 });
  const target = new URL(`${endpoint}/account/${section}`);
  target.searchParams.set('redirect', `${getAppBaseUrl()}/${locale}/admin/profile`);
  target.searchParams.set('ui_locales', locale === 'zh-Hant' ? 'zh-Hant zh' : locale);
  target.searchParams.set('show_success', 'true');
  return NextResponse.redirect(target);
}
