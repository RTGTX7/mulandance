'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, CreditCard, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { clearAuthToken, isAuthenticated, type PortalUser, usersApi } from '@/lib/api';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/${locale}/portal/login`);
      return;
    }
    usersApi.portalMe()
      .then(setUser)
      .catch(() => {
        clearAuthToken();
        router.replace(`/${locale}/portal/login`);
      });
  }, [locale, router]);

  const logout = () => {
    clearAuthToken();
    router.replace(`/${locale}/portal/login`);
  };

  if (!user) {
    return <div className="section-padding"><div className="container text-muted-foreground">{t('portal.loading')}</div></div>;
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;

  return (
    <div className="section-padding">
      <div className="container space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="heading-xl">{t('portal.dashboard')}</h1>
            <p className="text-lead">{t('portal.welcome')}</p>
          </div>
          <Button type="button" variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('portal.logout')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-secondary/10 p-3 text-secondary"><UserRound className="h-6 w-6" /></div>
              <div><p className="font-semibold">{displayName}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-secondary/10 p-3 text-secondary"><Calendar className="h-6 w-6" /></div>
              <div><p className="font-semibold">{t('portal.noClasses')}</p><p className="text-sm text-muted-foreground">{t('portal.accountReady')}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-secondary/10 p-3 text-secondary"><CreditCard className="h-6 w-6" /></div>
              <div><p className="font-semibold">{t('portal.noPayments')}</p><p className="text-sm text-muted-foreground">{t('portal.accountReady')}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>{t('portal.account')}</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>{t('portal.email')}: {user.email}</p>
            {user.phone && <p>{t('portal.phone')}: {user.phone}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
