'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { setAuthToken } from '@/lib/api';
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
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
      
      setTimeout(() => {
        router.push(`/${locale}/admin/dashboard`);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
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
                <label htmlFor="password" className="block text-sm font-medium mb-1">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('admin.login.signIn')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
