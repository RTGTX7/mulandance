import { createHmac } from 'node:crypto';
import { getAccessToken, getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';
import { getApiResource, getAppBaseUrl, getLogtoConfig, safeLocalPath } from '@/lib/logto';

export const dynamic = 'force-dynamic';

function localeFromPath(path: string): string {
  const locale = path.split('/')[1];
  return ['en', 'zh', 'zh-Hant', 'fr'].includes(locale) ? locale : 'en';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = safeLocalPath(requestUrl.searchParams.get('returnTo'), '/');
  const locale = localeFromPath(returnTo);
  const config = getLogtoConfig();
  const context = await getLogtoContext(config, { fetchUserInfo: true });
  if (!context.isAuthenticated || !context.claims?.sub) {
    return NextResponse.redirect(`${getAppBaseUrl()}/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const email = context.userInfo?.email || context.claims.email;
  const emailVerified = context.userInfo?.email_verified ?? context.claims.email_verified;
  const identity = {
    sub: context.claims.sub,
    email: email || '',
    email_verified: emailVerified === true,
    iat: Math.floor(Date.now() / 1000),
  };
  const payload = Buffer.from(JSON.stringify(identity)).toString('base64url');
  const secret = process.env.LOGTO_SESSION_ASSERTION_SECRET || '';
  if (secret.length < 32) throw new Error('LOGTO_SESSION_ASSERTION_SECRET must contain at least 32 characters');
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  const token = await getAccessToken(config, getApiResource());
  const backend = (process.env.API_PROXY_TARGET || 'http://localhost:8000').replace(/\/$/, '');
  const response = await fetch(`${backend}/api/v1/users/auth/logto-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ payload, signature }),
    cache: 'no-store',
  });
  if (!response.ok) {
    let code = 'logto_session_failed';
    try {
      const errorBody = await response.json() as { detail?: { code?: unknown } };
      const candidate = errorBody.detail?.code;
      if (typeof candidate === 'string' && /^[a-z0-9_]{1,64}$/.test(candidate)) {
        code = candidate;
      }
    } catch {
      // The status code still identifies failures that do not return JSON.
    }
    const query = new URLSearchParams({
      status: 'error',
      code,
      http: String(response.status),
    });
    return NextResponse.redirect(`${getAppBaseUrl()}/${locale}/auth/result?${query.toString()}`);
  }
  const result = await response.json() as { status: string; redirect_path?: string };
  if (result.status === 'active') {
    const destination = result.redirect_path || returnTo || '/';
    const localized = /^\/(en|zh|zh-Hant|fr)(\/|$)/.test(destination)
      ? destination
      : `/${locale}${destination}`;
    return NextResponse.redirect(`${getAppBaseUrl()}${localized}`);
  }
  return NextResponse.redirect(`${getAppBaseUrl()}/${locale}/auth/result?status=${encodeURIComponent(result.status)}`);
}
