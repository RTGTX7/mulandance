import { signOut } from '@logto/next/server-actions';
import { getAppBaseUrl, getLogtoConfig, isDevelopmentAuthEnabled } from '@/lib/logto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isDevelopmentAuthEnabled()) return NextResponse.redirect(`${getAppBaseUrl()}/`);
  await signOut(getLogtoConfig(), `${getAppBaseUrl()}/`);
}
