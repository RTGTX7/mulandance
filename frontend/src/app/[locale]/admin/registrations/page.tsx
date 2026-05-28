'use client';

import { useEffect } from 'react';
import { isAuthenticated } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { ClipboardList, Hammer } from 'lucide-react';

export default function AdminRegistrationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
    }
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {t('admin.registrations.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-5 text-muted-foreground">
              <Hammer className="h-5 w-5" />
              <p>{t('admin.registrations.underConstruction')}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
