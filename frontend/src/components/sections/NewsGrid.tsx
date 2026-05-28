'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, truncate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { newsApi } from '@/lib/api';
import { useEffect, useState } from 'react';

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
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsApi
      .list({ limit: 6 })
      .then((data) => {
        setArticles(data as NewsArticle[]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const getLocalePrefix = () => {
    try {
      return new URL(window.location.href).pathname.split('/')[1] || 'en';
    } catch {
      return 'en';
    }
  };

  const locale = getLocalePrefix();

  return (
    <section className="section-padding bg-card/50">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h2 className="heading-lg mb-2">{t('home.news.title')}</h2>
            <p className="text-lead">{t('home.news.subtitle')}</p>
          </div>
          <Link href={`/${locale}/news`}>
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.news.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="h-full">
                    <Skeleton className="h-44 rounded-t-lg" />
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
            : articles.map((article) => {
                const category = article.categories?.[0];
                return (
                  <Link key={article.id} href={`/${locale}/news/${article.slug}`}>
                    <Card className="card-hover h-full group cursor-pointer flex flex-col">
                      {article.cover_image ? (
                        <div className="h-44 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${article.cover_image})` }} />
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-primary/10 to-purple-400/5 rounded-t-lg" />
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          {category && (
                            <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                              {category.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {article.published_at
                              ? formatDate(article.published_at.split('T')[0], 'en-US')
                              : ''}
                          </span>
                        </div>
                        <CardTitle className="heading-sm group-hover:text-secondary transition-colors line-clamp-2">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {truncate(article.summary || '', 120)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
