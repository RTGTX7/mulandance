import { signIn } from '@logto/next/server-actions';
import { getAppBaseUrl, getLogtoConfig, isDevelopmentAuthEnabled, safeLocalPath } from '@/lib/logto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeLocalPath(url.searchParams.get('returnTo'), '/');
  if (isDevelopmentAuthEnabled()) return NextResponse.redirect(`${getAppBaseUrl()}${returnTo}`);
  const baseUrl = getAppBaseUrl();
  await signIn(getLogtoConfig(), {
    redirectUri: `${baseUrl}/callback`,
    postRedirectUri: `${baseUrl}/auth/complete?returnTo=${encodeURIComponent(returnTo)}`,
  });
}
