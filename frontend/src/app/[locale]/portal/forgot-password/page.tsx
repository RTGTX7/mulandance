'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(t('portal.resetSubject'));
    const body = encodeURIComponent(`Please help reset the password for: ${email.trim()}`);
    window.location.href = `mailto:info@mulandance.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Breadcrumbs items={[{ label: t('portal.title'), href: '/portal/login' }]} />
        <h1 className="heading-xl mb-4">{t('portal.forgotPassword')}</h1>
        <p className="text-lead mb-12">{t('portal.forgotPasswordHelp')}</p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.email')}
                </label>
                <Input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" />
              </div>
              <Button type="submit" className="w-full">
                {t('portal.requestReset')}
              </Button>

              {submitted && (
                <p className="text-sm text-green-600 text-center">
                  {t('portal.resetEmailOpened')}
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <Link
                href={`/${locale}/portal/login`}
                className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline"
              >
                {t('common.buttons.back')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
