'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';

export default function PerformancesPage() {
  const t = useTranslations();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[300px] bg-gradient-to-r from-amber-600 to-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.performances'), href: '/performances' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('performance.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('performance.seasonSubtle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container">
          {/* Event Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CalendarDays className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center">{t('performance.showcase.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm mb-4">{t('performance.showcase.desc')}</p>
                <p className="text-sm font-semibold text-primary">{t('performance.showcase.date')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Ticket className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center">{t('performance.xiaohe.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm mb-4">{t('performance.xiaohe.desc')}</p>
                <p className="text-sm font-semibold text-primary">{t('performance.xiaohe.date')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center">{t('performance.summer.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm mb-4">{t('performance.summer.desc')}</p>
                <p className="text-sm font-semibold text-primary">{t('performance.summer.date')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-accent/30 rounded-2xl p-12 text-center">
            <h2 className="heading-lg mb-4">Coming Soon</h2>
            <p className="text-lead text-muted-foreground mb-6">
              More performance content is under development.
            </p>
            <p className="text-body text-muted-foreground">
              We are adding ticket purchasing, event archives, and photo galleries.
            </p>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Link href="/classes/register">
              <Button size="lg">{t('common.buttons.register')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}