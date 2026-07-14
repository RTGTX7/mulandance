import { handleSignIn } from '@logto/next/server-actions';
import { getLogtoConfig } from '@/lib/logto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await handleSignIn(getLogtoConfig(), new URL(request.url));
}
