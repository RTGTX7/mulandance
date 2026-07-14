import { getAccessToken, getLogtoContext } from '@logto/next/server-actions';
import { getApiResource, getDevelopmentAccessToken, getLogtoConfig, isDevelopmentAuthEnabled } from '@/lib/logto';

export const dynamic = 'force-dynamic';

async function proxy(request: Request, context: { params: { path: string[] } }) {
  const incoming = new URL(request.url);
  const backend = (process.env.API_PROXY_TARGET || 'http://localhost:8000').replace(/\/$/, '');
  const target = `${backend}/api/${context.params.path.map(encodeURIComponent).join('/')}${incoming.search}`;
  const headers = new Headers(request.headers);
  for (const name of ['host', 'cookie', 'authorization', 'content-length', 'connection']) headers.delete(name);

  try {
    const config = getLogtoConfig();
    const session = await getLogtoContext(config);
    if (session.isAuthenticated) {
      headers.set('authorization', `Bearer ${await getAccessToken(config, getApiResource())}`);
    }
  } catch {
    if (isDevelopmentAuthEnabled()) {
      headers.set('authorization', `Bearer ${getDevelopmentAccessToken()}`);
    }
  }
  if (!headers.has('authorization') && isDevelopmentAuthEnabled()) {
    headers.set('authorization', `Bearer ${getDevelopmentAccessToken()}`);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: 'no-store',
    redirect: 'manual',
  });
  const responseHeaders = new Headers(response.headers);
  for (const name of ['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding']) responseHeaders.delete(name);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
