'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { performanceApi, type PerformanceItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, Clock, MapPin } from 'lucide-react';

export default function PerformanceDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'en';
  const slug = params?.slug as string;
  const [performance, setPerformance] = useState<PerformanceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    performanceApi.getBySlug(slug)
      .then(setPerformance)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const start = performance ? new Date(performance.start_date) : null;
  const end = performance ? new Date(performance.end_date) : null;
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';
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
            onClick={() => router.push(`/${locale}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'zh' ? '返回首页' : 'Back to Home'}
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
            <h2 className="text-2xl font-bold mb-2">
              {locale === 'zh' ? '未找到演出' : 'Performance Not Found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {locale === 'zh'
                ? '这个演出不存在或已被移除。'
                : 'The performance you are looking for does not exist or has been removed.'}
            </p>
            <Button onClick={() => router.push(`/${locale}`)}>
              {locale === 'zh' ? '返回首页' : 'Back to Home'}
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
                {locale === 'zh' ? '更多内容即将更新。' : 'More details coming soon.'}
              </p>
            )}

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span>{locale === 'zh' ? '演出信息' : 'Performance details'}</span>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}`)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {locale === 'zh' ? '返回首页' : 'Back to Home'}
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
