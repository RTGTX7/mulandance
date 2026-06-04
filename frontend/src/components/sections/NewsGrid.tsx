'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, truncate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { newsApi } from '@/lib/api';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { AnimatedLineHeading, RevealOnScroll } from '@/components/motion/ScrollEffects';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  slug: string;
  published_at: string;
  cover_image?: string;
  categories: Array<{ name: string; slug: string; color?: string }>;
}

export function NewsGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    newsApi
      .list({ limit: 6, locale: articleLocaleFor(locale) })
      .then((data) => {
        setArticles(data as NewsArticle[]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [locale]);

  return (
    <section className="section-padding bg-white/30">
      <div className="container">
        <div className="mb-5 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <AnimatedLineHeading text={t('home.news.title')} align="left" className="mb-2" />
            <p className="text-lead">{t('home.news.subtitle')}</p>
          </div>
          <Link href={`/${locale}/news`}>
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.news.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="space-y-2.5 md:hidden">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="grid grid-cols-[84px_1fr] gap-3 rounded-lg border border-white/70 bg-white/75 p-2.5 shadow-sm shadow-purple-950/5">
                    <Skeleton className="h-[78px] rounded-lg" />
                    <div className="min-w-0 pt-0.5">
                      <Skeleton className="mb-2 h-3 w-24" />
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))
            : articles.slice(0, 4).map((article, index) => {
                const category = article.categories?.[0];
                return (
                  <RevealOnScroll key={article.id} delay={(index % 2) * 70}>
                    <Link
                      href={`/${locale}/news/${article.slug}`}
                      className="group grid grid-cols-[84px_1fr] gap-3 rounded-lg border border-white/70 bg-white/75 p-2.5 shadow-sm shadow-purple-950/5 backdrop-blur-xl transition-all hover:bg-white/90"
                    >
                      {article.cover_image ? (
                        <div className="h-[78px] rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${article.cover_image})` }} />
                      ) : (
                        <div className="h-[78px] rounded-lg bg-gradient-to-br from-primary/10 via-purple-300/10 to-secondary/10" />
                      )}
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] leading-none">
                          {category && (
                            <span className="truncate font-semibold text-secondary">
                              {category.name}
                            </span>
                          )}
                          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {article.published_at
                              ? formatDate(article.published_at.split('T')[0], dateLocaleFor(locale))
                              : ''}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-secondary">
                          {article.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                          {truncate(article.summary || '', 78)}
                        </p>
                      </div>
                    </Link>
                  </RevealOnScroll>
                );
              })}
        </div>

        <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="h-full">
                    <Skeleton className="aspect-[16/10] rounded-t-lg" />
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
            : articles.map((article, index) => {
                const category = article.categories?.[0];
                return (
                  <RevealOnScroll key={article.id} delay={(index % 3) * 90}>
                    <Link href={`/${locale}/news/${article.slug}`} className="block h-full">
                      <Card className="card-hover h-full group cursor-pointer flex flex-col">
                        {article.cover_image ? (
                          <div className="aspect-[16/9] rounded-t-lg bg-cover bg-center md:aspect-[16/10]" style={{ backgroundImage: `url(${article.cover_image})` }} />
                        ) : (
                          <div className="aspect-[16/9] rounded-t-lg bg-gradient-to-br from-primary/10 to-purple-400/5 md:aspect-[16/10]" />
                        )}
                        <CardHeader className="pb-1.5">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            {category && (
                              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                                {category.name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {article.published_at
                                ? formatDate(article.published_at.split('T')[0], dateLocaleFor(locale))
                                : ''}
                            </span>
                          </div>
                          <CardTitle className="line-clamp-2 text-base transition-colors group-hover:text-secondary md:text-lg">
                            {article.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                            {truncate(article.summary || '', 120)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </RevealOnScroll>
                );
              })}
        </div>
      </div>
    </section>
  );
}
