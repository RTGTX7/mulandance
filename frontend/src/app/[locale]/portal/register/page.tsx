'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage, setAuthToken, usersApi } from '@/lib/api';

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await usersApi.register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const tokens = await usersApi.login({ email: form.email.trim(), password: form.password });
      setAuthToken(tokens.access_token);
      if (form.phone.trim()) await usersApi.updatePortalMe({ phone: form.phone.trim() });
      router.replace(`/${locale}/portal/dashboard`);
    } catch (err) {
      setError(getErrorMessage(err).includes('400: Email already registered') ? t('portal.invalidCredentials') : t('portal.registrationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="heading-md">{t('portal.register')}</CardTitle>
            <CardDescription>
              {t('portal.studentParent')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t('portal.firstName')}
                  </label>
                  <Input required autoComplete="given-name" value={form.first_name} onChange={(event) => setField('first_name', event.target.value)} placeholder={t('portal.firstName')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t('portal.lastName')}
                  </label>
                  <Input required autoComplete="family-name" value={form.last_name} onChange={(event) => setField('last_name', event.target.value)} placeholder={t('portal.lastName')} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.email')}
                </label>
                <Input type="email" required autoComplete="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.password')}
                </label>
                <Input type="password" required autoComplete="new-password" value={form.password} onChange={(event) => setField('password', event.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.phone')}
                </label>
                <Input autoComplete="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? t('portal.creatingAccount') : t('portal.createAccount')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('portal.haveAccount')}{' '}
              <Link
                href={`/${locale}/portal/login`}
                className="font-medium text-purple-700 hover:text-purple-900 hover:underline"
              >
                {t('portal.login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
