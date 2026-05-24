'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="heading-md">{t('portal.login')}</CardTitle>
            <CardDescription>{t('portal.welcome')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.email')}
                </label>
                <Input type="email" required placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('portal.password')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
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
                  href="/portal/forgot-password"
                  className="text-sm text-secondary hover:underline"
                >
                  {t('portal.forgotPassword')}
                </Link>
              </div>
              <Button type="submit" className="w-full">
                {t('portal.login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('portal.noAccount')}{' '}
              <Link
                href="/portal/register"
                className="text-secondary hover:underline font-medium"
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
