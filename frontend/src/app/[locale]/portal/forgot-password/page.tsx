'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Breadcrumbs items={[{ label: t('common.nav.portal'), href: 'portal/login' }]} />
        <h1 className="heading-xl mb-4">{t('portal.forgotPassword')}</h1>
        <p className="text-lead mb-12">
          Enter your email address and we will send you a link to reset your password.
        </p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.email')}
                </label>
                <Input type="email" required placeholder="your@email.com" />
              </div>
              <Button type="submit" className="w-full">
                {t('common.buttons.submit')}
              </Button>

              {submitted && (
                <p className="text-sm text-green-600 text-center">
                  If an account exists with that email, you will receive a password reset link shortly.
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/portal/login"
                className="text-sm text-secondary hover:underline"
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
