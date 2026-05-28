'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { performanceApi, type PerformanceItem } from '@/lib/api';
import { useTranslations } from '@/components/ui/i18n-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';

export default function PerformancesPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    performanceApi.list()
      .then(setPerformances)
      .catch(() => setPerformances([]))
      .finally(() => setLoading(false));
  }, []);

  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="heading-lg mb-3">{t('performance.allTitle')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('performance.allSubtitle')}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-48 bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-5 bg-muted animate-pulse rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : performances.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">{t('performance.noPerformances')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performances.map((performance) => {
              const start = new Date(performance.start_date);
              const end = new Date(performance.end_date);
              const date = start.toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const time = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <Card
                  key={performance.id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  onClick={() => router.push(`/${locale}/performances/${performance.slug}`)}
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-purple-400/10">
                    {performance.cover_image && (
                      <img
                        src={performance.cover_image}
                        alt={performance.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Badge variant="secondary" className="absolute bottom-3 left-3 bg-white/90 text-primary">
                      {t('performance.badge')}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {performance.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {performance.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {performance.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{time}</span>
                      </div>
                      {performance.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{performance.venue}</span>
                        </div>
                      )}
                    </div>
                    <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t('performance.readMore')}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
