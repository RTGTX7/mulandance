import { handleSignIn } from '@logto/next/server-actions';
import { getAppBaseUrl, getLogtoConfig } from '@/lib/logto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const callback = new URL('/callback', `${getAppBaseUrl()}/`);
  callback.search = incoming.search;
  await handleSignIn(getLogtoConfig(), callback);
}
