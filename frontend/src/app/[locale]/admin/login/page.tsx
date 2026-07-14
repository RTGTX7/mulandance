'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { getApiBaseUrl, setAuthToken, usersApi } from '@/lib/api';
import { firstAllowedAdminRoute } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const pathLocale = new URL(window.location.href).pathname.split('/')[1] || 'en';
    setLocale(pathLocale);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const API_URL = getApiBaseUrl();
      const res = await fetch(`${API_URL}/api/v1/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      setAuthToken(data.access_token);
      setSuccess(true);
      const account = await usersApi.me();
      router.push(`/${locale}${firstAllowedAdminRoute(account)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-3rem)] items-start justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-3 pb-6 pt-24 md:min-h-screen md:items-center md:py-6">
      <Card className="w-full max-w-sm border-white/70 bg-white/75">
        <CardHeader className="px-4 text-center md:px-5">
          <CardTitle className="heading-md">{t('admin.login.title')}</CardTitle>
          <CardDescription>
            {t('admin.login.noAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium">{t('common.accessibility.formSubmitted')}</p>
              <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  {t('admin.login.email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@mulandance.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">
                  {t('admin.login.password')}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? t('common.loading') : t('admin.login.signIn')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
