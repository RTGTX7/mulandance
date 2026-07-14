'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { newsApi, performanceApi, type NewsArticle, type PerformanceItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { ArrowLeft, CalendarDays, Clock, FileText, MapPin, Newspaper } from 'lucide-react';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';

const detailText = {
  zh: {
    relatedTitle: '\u76f8\u5173\u62a5\u9053\u4e0e\u56de\u987e',
    relatedDescription: '\u8fd9\u91cc\u6536\u5f55\u4e0e\u672c\u573a\u6f14\u51fa\u76f8\u5173\u7684\u901a\u77e5\u3001\u62a5\u9053\u3001\u56de\u987e\u548c\u5a92\u4f53\u5185\u5bb9\u3002',
    readMore: '\u9605\u8bfb\u6587\u7ae0',
  },
  en: {
    relatedTitle: 'Related Reports and Recaps',
    relatedDescription: 'Notices, reports, recaps, and media connected to this performance.',
    readMore: 'Read article',
  },
  fr: {
    relatedTitle: 'Reportages et retours lies',
    relatedDescription: 'Annonces, reportages, retours et medias lies a ce spectacle.',
    readMore: 'Lire l article',
  },
} as const;

function pageLocale(locale: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

export default function PerformanceDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'en';
  const text = detailText[pageLocale(locale)];
  const backLabel = locale === 'zh' || locale === 'zh-Hant'
    ? '返回演出与活动'
    : locale === 'fr'
      ? 'Retour aux événements'
      : 'Back to events';
  const slug = params?.slug as string;
  const [performance, setPerformance] = useState<PerformanceItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    performanceApi.getBySlug(slug, locale)
      .then((item) => {
        setPerformance(item);
        if (item.related_article_ids?.length) {
          return newsApi.publicByIds(item.related_article_ids, articleLocaleFor(locale))
            .then(setRelatedArticles)
            .catch(() => setRelatedArticles([]));
        }
        setRelatedArticles([]);
        return undefined;
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [locale, slug]);

  const start = performance ? new Date(performance.start_date) : null;
  const end = performance ? new Date(performance.end_date) : null;
  const dateLocale = dateLocaleFor(locale);
  const dateText = start?.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeText = start
    ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
      end ? ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
    }`
    : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/performances`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-3">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            </div>
          </div>
        ) : error || !performance ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">{t('performanceDetail.notFoundTitle')}</h2>
            <p className="text-muted-foreground mb-4">{t('performanceDetail.notFoundText')}</p>
            <Button onClick={() => router.push(`/${locale}/performances`)}>
              {backLabel}
            </Button>
          </div>
        ) : (
          <article>
            {performance.cover_image && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={performance.cover_image}
                  alt={performance.title}
                  className="w-full h-auto max-h-[420px] object-cover"
                />
              </div>
            )}

            <h1 className="heading-lg mb-4">{performance.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground">
              {dateText && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {dateText}
                </span>
              )}
              {timeText && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {timeText}
                </span>
              )}
              {performance.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {performance.venue}
                </span>
              )}
            </div>

            {performance.description ? (
              <div className="prose prose-lg max-w-none mb-12">
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {performance.description}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic mb-12">
                {t('performanceDetail.moreSoon')}
              </p>
            )}

            {relatedArticles.length > 0 && (
              <section className="mb-12 border-t pt-8">
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-purple-700" />
                    <h2 className="text-xl font-semibold text-slate-950">{text.relatedTitle}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.relatedDescription}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/${locale}/news/${article.slug}`}
                      className="group overflow-hidden rounded-lg border bg-card transition hover:border-purple-300 hover:shadow-sm"
                    >
                      {article.cover_image && (
                        <img src={article.cover_image} alt={article.title} className="h-36 w-full object-cover" />
                      )}
                      <div className="p-4">
                        <div className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700">
                          <FileText className="h-3.5 w-3.5" />
                          {text.readMore}
                        </div>
                        <h3 className="line-clamp-2 font-semibold text-slate-950 group-hover:text-purple-800">{article.title}</h3>
                        {article.summary && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.summary}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span>{t('performanceDetail.details')}</span>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/performances`)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {backLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </article>
        )}
      </main>
    </div>
  );
}
