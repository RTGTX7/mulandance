'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const t = useTranslations();
  const [isStudent, setIsStudent] = useState(true);

  return (
    <div className="section-padding">
      <div className="container max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="heading-md">{t('portal.register')}</CardTitle>
            <CardDescription>
              {isStudent ? 'Create a student/parent account' : 'Create an account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={isStudent ? 'default' : 'outline'}
                onClick={() => setIsStudent(true)}
                className="flex-1"
              >
                Student / Parent
              </Button>
              <Button
                type="button"
                variant={!isStudent ? 'default' : 'outline'}
                onClick={() => setIsStudent(false)}
                className="flex-1"
              >
                Faculty
              </Button>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    First Name
                  </label>
                  <Input required placeholder="First name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Last Name
                  </label>
                  <Input required placeholder="Last name" />
                </div>
              </div>
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
                <Input type="password" required placeholder="Min. 8 characters" />
              </div>
              {isStudent && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Phone Number
                  </label>
                  <Input placeholder="+1 (555) 000-0000" />
                </div>
              )}
              <Button type="submit" className="w-full">
                {t('portal.register')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('portal.haveAccount')}{' '}
              <Link
                href="/portal/login"
                className="text-secondary hover:underline font-medium"
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
