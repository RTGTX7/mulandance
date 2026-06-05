'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
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
    <section className="homepage-glass-section section-padding">
      <div className="container relative z-10">
        <div className="homepage-glass-heading mb-5 flex flex-col gap-2 rounded-2xl px-4 py-4 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4 md:px-5">
          <div>
            <AnimatedLineHeading text={t('home.news.title')} align="left" className="mb-2" />
            <p className="text-lead">{t('home.news.subtitle')}</p>
          </div>
          <Link href={`/${locale}/news`}>
            <span className="inline-flex rounded-full border border-white/60 bg-white/50 px-3 py-1.5 text-sm font-medium text-secondary shadow-sm backdrop-blur-xl transition-colors hover:bg-white/70">
              {t('home.news.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="space-y-2.5 md:hidden">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="homepage-glass-card grid grid-cols-[84px_1fr] gap-3 rounded-xl p-2.5">
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
                      className="homepage-glass-card group grid grid-cols-[84px_1fr] gap-3 rounded-xl p-2.5 transition-all hover:-translate-y-0.5 hover:bg-white/70"
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
                  <div key={i} className="homepage-glass-card h-full rounded-xl">
                    <Skeleton className="aspect-[16/10] rounded-t-xl" />
                    <div className="p-4 pb-2">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                    <div className="p-4 pt-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))
            : articles.map((article, index) => {
                const category = article.categories?.[0];
                return (
                  <RevealOnScroll key={article.id} delay={(index % 3) * 90}>
                    <Link href={`/${locale}/news/${article.slug}`} className="block h-full">
                      <div className="homepage-glass-card h-full group flex cursor-pointer flex-col rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/72 hover:shadow-xl hover:shadow-purple-950/10">
                        {article.cover_image ? (
                          <div className="aspect-[16/9] rounded-t-xl bg-cover bg-center md:aspect-[16/10]" style={{ backgroundImage: `url(${article.cover_image})` }} />
                        ) : (
                          <div className="aspect-[16/9] rounded-t-xl bg-gradient-to-br from-primary/10 to-purple-400/5 md:aspect-[16/10]" />
                        )}
                        <div className="p-4 pb-1.5">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            {category && (
                              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-normal text-secondary">
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
                          <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-secondary md:text-lg">
                            {article.title}
                          </h3>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                            {truncate(article.summary || '', 120)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </RevealOnScroll>
                );
              })}
        </div>
      </div>
    </section>
  );
}
