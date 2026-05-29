'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { newsApi, performanceApi, type NewsArticle, type PerformanceItem } from '@/lib/api';
import { dateLocaleFor } from '@/lib/i18n';
import { CalendarDays, Clock, FileText, MapPin, Newspaper } from 'lucide-react';

type TimelineType = 'performance' | 'competition' | 'camp' | 'event' | 'other';

function includesAny(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function getTimelineType(item: PerformanceItem): TimelineType {
  const source = `${item.title} ${item.description || ''}`.toLowerCase();
  if (includesAny(source, ['competition', '\u6bd4\u8d5b', '\u5927\u8d5b'])) return 'competition';
  if (includesAny(source, ['camp', '\u590f\u4ee4\u8425', '\u8425'])) return 'camp';
  if (includesAny(source, ['event', '\u6d3b\u52a8', 'open house'])) return 'event';
  if (includesAny(source, ['performance', 'showcase', '\u6f14\u51fa', '\u5c55\u793a'])) return 'performance';
  return 'performance';
}

function typeClass(type: TimelineType) {
  return {
    performance: 'border-purple-200 bg-purple-50 text-purple-700',
    competition: 'border-amber-200 bg-amber-50 text-amber-700',
    camp: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    event: 'border-blue-200 bg-blue-50 text-blue-700',
    other: 'border-slate-200 bg-slate-50 text-slate-700',
  }[type];
}

export default function PerformancesPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = dateLocaleFor(locale);
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      performanceApi.list({ current: true }),
      newsApi.list({ category: 'performances', locale, limit: 6 }).catch(() => []),
    ])
      .then(([performanceItems, newsItems]) => {
        setPerformances(performanceItems);
        setArticles(newsItems);
      })
      .catch(() => {
        setPerformances([]);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  const now = Date.now();
  const sorted = useMemo(() => {
    return [...performances].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [performances]);

  const upcoming = sorted.filter((item) => new Date(item.end_date).getTime() >= now);
  const archive = [...sorted]
    .filter((item) => new Date(item.end_date).getTime() < now)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const timeline = [...upcoming, ...archive];

  const archiveByYear = useMemo(() => {
    return archive.reduce<Record<string, PerformanceItem[]>>((acc, item) => {
      const year = String(new Date(item.start_date).getFullYear());
      acc[year] = acc[year] || [];
      acc[year].push(item);
      return acc;
    }, {});
  }, [archive]);

  function dateText(item: PerformanceItem) {
    return new Date(item.start_date).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function timeText(item: PerformanceItem) {
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div className="pt-16">
      <PageHero
        breadcrumbLabel={t('common.nav.performances')}
        breadcrumbHref="/performances"
        title={t('performanceTimeline.title')}
        subtitle={t('performanceTimeline.subtitle')}
      />

      <main className="section-padding bg-slate-100">
        <div className="container">
        <div className="mb-6 flex flex-wrap gap-2">
          <a href="#upcoming">
            <Button variant="outline" size="sm">{t('performanceTimeline.upcoming')}</Button>
          </a>
          <a href="#timeline">
            <Button variant="outline" size="sm">{t('performanceTimeline.timeline')}</Button>
          </a>
          <a href="#archive">
            <Button variant="outline" size="sm">{t('performanceTimeline.archive')}</Button>
          </a>
          <a href="#articles">
            <Button variant="outline" size="sm">{t('performanceTimeline.relatedArticles')}</Button>
          </a>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">
              {t('common.ui.loading')}
            </CardContent>
          </Card>
        ) : timeline.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">
              {t('performanceTimeline.noItems')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            <section id="timeline" className="space-y-8">
              <div id="upcoming" className="scroll-mt-24">
                <h2 className="mb-4 text-2xl font-semibold text-slate-950">
                  {t('performanceTimeline.upcoming')}
                </h2>
                {upcoming.length === 0 ? (
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-500">
                      {t('performanceTimeline.noUpcoming')}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map((item) => {
                      const type = getTimelineType(item);
                      return (
                        <Link key={item.id} href={`/${locale}/performances/${item.slug}`} className="block">
                          <Card className="overflow-hidden transition hover:border-purple-300 hover:shadow-md">
                            <CardContent className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                              <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
                                {item.cover_image ? (
                                  <img src={item.cover_image} alt={item.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-400">
                                    <CalendarDays className="h-8 w-8" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <Badge variant="outline" className={typeClass(type)}>
                                  {t(`performanceTimeline.type.${type}`)}
                                </Badge>
                                <h3 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h3>
                                {item.description && (
                                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
                                )}
                                <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                                  <span className="flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                    {dateText(item)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {timeText(item)}
                                  </span>
                                  {item.venue && (
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="h-4 w-4" />
                                      {item.venue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div id="archive" className="scroll-mt-24">
                <h2 className="mb-4 text-2xl font-semibold text-slate-950">
                  {t('performanceTimeline.archive')}
                </h2>
                {Object.keys(archiveByYear).length === 0 ? (
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-500">
                      {t('performanceTimeline.noArchive')}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(archiveByYear).map(([year, items]) => (
                      <div key={year} className="relative border-l border-slate-200 pl-5">
                        <div className="absolute -left-2 top-1 h-4 w-4 rounded-full border-4 border-white bg-purple-500" />
                        <h3 className="mb-3 text-lg font-semibold text-slate-950">{year}</h3>
                        <div className="space-y-3">
                          {items.map((item) => {
                            const type = getTimelineType(item);
                            return (
                              <Link key={item.id} href={`/${locale}/performances/${item.slug}`} className="block">
                                <div className="rounded-md border bg-white p-4 transition hover:border-purple-300">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <h4 className="font-semibold text-slate-950">{item.title}</h4>
                                      <p className="mt-1 text-sm text-slate-500">{dateText(item)}</p>
                                    </div>
                                    <Badge variant="outline" className={typeClass(type)}>
                                      {t(`performanceTimeline.type.${type}`)}
                                    </Badge>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside id="articles" className="scroll-mt-24 space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-950">
                      {t('performanceTimeline.relatedArticles')}
                    </h2>
                  </div>
                  {articles.length === 0 ? (
                    <p className="text-sm leading-6 text-slate-500">
                      {t('performanceTimeline.articleEmpty')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/${locale}/news/${article.slug}`}
                          className="block rounded-md border bg-white p-3 transition hover:border-purple-300"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                            <div>
                              <h3 className="line-clamp-2 text-sm font-semibold text-slate-950">{article.title}</h3>
                              {article.summary && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{article.summary}</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
