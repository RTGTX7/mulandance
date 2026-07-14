'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage, setAuthToken, usersApi } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tokens = await usersApi.login({ email: email.trim(), password });
      setAuthToken(tokens.access_token);
      router.replace(`/${locale}/portal/dashboard`);
    } catch (err) {
      const message = getErrorMessage(err).toLowerCase();
      setError(message.includes('401') || message.includes('422') || message.includes('invalid credentials') ? t('portal.invalidCredentials') : getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="heading-md">{t('portal.login')}</CardTitle>
            <CardDescription>{t('portal.welcome')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.email')}
                </label>
                <Input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.password')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <Link
                  href={`/${locale}/portal/forgot-password`}
                  className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline"
                >
                  {t('portal.forgotPassword')}
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? t('portal.signingIn') : t('portal.login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('portal.noAccount')}{' '}
              <Link
                href={`/${locale}/portal/register`}
                className="font-medium text-purple-700 hover:text-purple-900 hover:underline"
              >
                {t('portal.register')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
