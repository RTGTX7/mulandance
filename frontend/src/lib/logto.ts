import type { LogtoNextConfig } from '@logto/next';
import { UserScope } from '@logto/next';
import { createHmac } from 'node:crypto';

export function isDevelopmentAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === 'true';
}

export function getDevelopmentAccessToken(): string {
  if (!isDevelopmentAuthEnabled()) throw new Error('Development authentication is disabled');
  const email = (process.env.DEV_AUTH_EMAIL || '').trim().toLowerCase();
  const secret = process.env.DEV_AUTH_SECRET || '';
  if (!email || secret.length < 32) throw new Error('Development authentication is incomplete');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ email, iat: now, exp: now + 300 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `dev.${payload}.${signature}`;
}

export function getLogtoConfig(): LogtoNextConfig {
  const endpoint = process.env.LOGTO_ENDPOINT || process.env.NEXT_PUBLIC_LOGTO_ENDPOINT;
  const appId = process.env.LOGTO_APP_ID;
  const appSecret = process.env.LOGTO_APP_SECRET;
  const cookieSecret = process.env.LOGTO_COOKIE_SECRET;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resource = process.env.LOGTO_API_RESOURCE;

  if (!endpoint || !appId || !appSecret || !cookieSecret || !resource) {
    throw new Error('Logto is not fully configured');
  }
  if (cookieSecret.length < 32) {
    throw new Error('LOGTO_COOKIE_SECRET must contain at least 32 characters');
  }

  return {
    endpoint: endpoint.replace(/\/$/, ''),
    appId,
    appSecret,
    baseUrl,
    cookieSecret,
    cookieSecure: process.env.NODE_ENV === 'production',
    scopes: [UserScope.Email],
    resources: [resource],
  };
}

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getApiResource(): string {
  const resource = process.env.LOGTO_API_RESOURCE;
  if (!resource) throw new Error('LOGTO_API_RESOURCE is not configured');
  return resource;
}

export function safeLocalPath(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
