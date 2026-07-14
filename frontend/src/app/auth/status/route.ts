import { getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';
import { getLogtoConfig, isDevelopmentAuthEnabled } from '@/lib/logto';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isDevelopmentAuthEnabled()) return NextResponse.json({ authenticated: true, development: true });
  try {
    const context = await getLogtoContext(getLogtoConfig());
    return NextResponse.json({ authenticated: context.isAuthenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
