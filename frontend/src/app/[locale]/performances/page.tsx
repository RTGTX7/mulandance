'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { newsApi, performanceApi, type NewsArticle, type PerformanceItem } from '@/lib/api';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';
import { ArrowRight, CalendarDays, Clock, FileText, MapPin, Newspaper } from 'lucide-react';

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

function timelineStatus(item: PerformanceItem, now: number) {
  const start = new Date(item.start_date).getTime();
  const end = new Date(item.end_date).getTime();
  if (end < now) return 'past';
  if (start <= now && end >= now) return 'current';
  return 'future';
}

function timelineAccent(status: ReturnType<typeof timelineStatus>) {
  if (status === 'past') return 'hsl(0 0% 58%)';
  if (status === 'current') return 'hsl(145 50% 42%)';
  return 'hsl(32 82% 54%)';
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
      performanceApi.list({ current: true, locale }),
      newsApi.list({ category: 'performances', locale: articleLocaleFor(locale), limit: 6 }).catch(() => []),
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

  const futureOrCurrent = sorted.filter((item) => new Date(item.end_date).getTime() >= now);
  const past = [...sorted]
    .filter((item) => new Date(item.end_date).getTime() < now)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const timeline = [...futureOrCurrent, ...past];

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

  function dateParts(item: PerformanceItem) {
    const date = new Date(item.start_date);
    const isChinese = locale === 'zh' || locale === 'zh-Hant';
    return {
      month: date.toLocaleDateString(dateLocale, { month: 'short' }),
      day: isChinese
        ? String(date.getDate()).padStart(2, '0')
        : date.toLocaleDateString(dateLocale, { day: '2-digit' }),
      weekday: date.toLocaleDateString(dateLocale, { weekday: 'short' }),
      year: date.toLocaleDateString(dateLocale, { year: 'numeric' }),
    };
  }

  return (
    <div className="pt-16">
      <main className="section-padding bg-slate-100">
        <div className="container">
        <section className="mb-3 rounded-[14px] border border-white/70 bg-white/55 px-4 py-4 shadow-sm shadow-purple-950/5 backdrop-blur-xl md:mb-6 md:rounded-[18px] md:px-8 md:py-8">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <h1 className="font-accent text-[1.92rem] font-bold leading-none tracking-tight text-slate-950 md:text-6xl">
                {t('performanceTimeline.title')}
              </h1>
              <p className="mt-2.5 max-w-2xl text-[12px] leading-5 text-slate-600 md:mt-4 md:text-base md:leading-7">
                {t('performanceTimeline.subtitle')}
              </p>
            </div>
          </div>
        </section>

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
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section id="timeline" className="season-timeline-section scroll-mt-24">
              <div className="px-0 py-0 md:px-0 md:py-0">
                <div className="season-timeline-list relative">
                  <div className="season-timeline-scroll" role="region" tabIndex={0} aria-label={t('performanceTimeline.timeline')}>
                    <div className="season-timeline-rail" aria-hidden="true" />
                    <div className="space-y-2.5 pr-0 md:space-y-5 md:pr-2">
                      {timeline.map((item, index) => {
                        const type = getTimelineType(item);
                        const parts = dateParts(item);
                        const isArchive = new Date(item.end_date).getTime() < now;
                        const status = timelineStatus(item, now);
                        return (
                          <Link
                            key={item.id}
                            href={`/${locale}/performances/${item.slug}`}
                            className="season-timeline-item group relative grid snap-start grid-cols-[24px_1fr] gap-2 md:grid-cols-[46px_1fr] md:gap-4"
                            style={{ '--event-index': index, '--timeline-accent': timelineAccent(status) } as CSSProperties}
                          >
                            <div className="relative flex justify-center pt-5 md:pt-9">
                              <span className={`season-timeline-node season-timeline-node-${status}`} aria-hidden="true">
                                <span className="season-timeline-node-core" />
                              </span>
                            </div>

                            <article className="season-event-card grid min-h-[148px] overflow-hidden rounded-[14px] md:min-h-[190px] md:rounded-[18px] md:grid-cols-[132px_minmax(0,1fr)_220px] lg:grid-cols-[150px_minmax(0,1fr)_260px]">
                              <div className="season-event-date relative flex min-h-[82px] flex-row items-center justify-between gap-2.5 px-3.5 py-2.5 md:min-h-full md:flex-col md:items-start md:justify-between md:px-5 md:py-5">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/85">{parts.month}</p>
                                  <p className="mt-0.5 font-accent text-[2rem] leading-none text-primary md:text-6xl">{parts.day}</p>
                                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{parts.year}</p>
                                </div>
                                <div className="text-right md:text-left">
                                  <p className="text-[11px] font-semibold text-slate-500">{parts.weekday}</p>
                                  <Badge variant="outline" className={`mt-1 text-[10px] ${typeClass(type)}`}>
                                    {t(`performanceTimeline.type.${type}`)}
                                  </Badge>
                                </div>
                              </div>

                                <div className="flex min-w-0 flex-col justify-center px-3.5 py-3 md:px-6 md:py-6">
                                  <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-slate-500 md:mb-3 md:gap-x-4 md:gap-y-2 md:text-sm">
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarDays className="h-3 w-3 text-secondary md:h-4 md:w-4" />
                                      {dateText(item)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-secondary md:h-4 md:w-4" />
                                      {timeText(item)}
                                    </span>
                                    {item.venue && (
                                      <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <MapPin className="h-3 w-3 shrink-0 text-secondary md:h-4 md:w-4" />
                                        <span className="truncate">{item.venue}</span>
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-[1.08rem] font-bold leading-[1.1] text-slate-950 transition-colors group-hover:text-primary md:text-2xl">
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.45] text-slate-600 md:mt-3 md:line-clamp-3 md:text-[15px] md:leading-6">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-secondary md:mt-5 md:gap-2 md:text-sm">
                                    <span className="h-px w-5 bg-secondary/35 transition-all group-hover:w-8 md:w-8 md:group-hover:w-12" />
                                    <span>{isArchive ? t('performanceTimeline.archive') : t('performanceTimeline.upcoming')}</span>
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 md:h-4 md:w-4" />
                                  </div>
                                </div>

                                <div className="season-event-media relative hidden min-h-full overflow-hidden md:block">
                                  {item.cover_image ? (
                                    <img
                                      src={item.cover_image}
                                      alt={item.title}
                                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(216,168,79,0.28),transparent_30%),linear-gradient(135deg,rgba(71,28,104,0.34),rgba(255,255,255,0.18))]" />
                                  )}
                                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.78)_14%,rgba(255,255,255,0.42)_32%,rgba(255,255,255,0.10)_54%,rgba(35,13,56,0.16)_100%)]" />
                                  <div className="absolute bottom-4 right-4 rounded-full border border-white/55 bg-white/45 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-xl">
                                    {String(index + 1).padStart(2, '0')}
                                  </div>
                                </div>
                            </article>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div className="season-scroll-cue" aria-hidden="true">
                    <span />
                  </div>
                </div>
              </div>
            </section>

            {articles.length > 0 && (
            <aside id="articles" className="scroll-mt-24 space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-950">
                      {t('performanceTimeline.relatedArticles')}
                    </h2>
                  </div>
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
                </CardContent>
              </Card>
            </aside>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
