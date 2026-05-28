'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { newsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { articleLocaleFor, dateLocaleFor, localizeText } from '@/lib/i18n';

interface Article {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  cover_image?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  locale: string;
  category_slugs?: string[];
  categories?: Array<{ slug: string; name: string; name_zh?: string; color?: string }>;
  tags?: Array<{ slug: string; name: string; name_zh?: string }>;
}

interface Category {
  slug: string;
  name: string;
  name_zh?: string;
  color?: string;
}

function localizeArticle(article: Article, locale: string): Article {
  return {
    ...article,
    title: localizeText(article.title, locale) || article.title,
    summary: localizeText(article.summary, locale) || article.summary,
    body: localizeText(article.body, locale) || article.body,
    categories: article.categories?.map((category) => ({
      ...category,
      name_zh: localizeText(category.name_zh, locale) || category.name_zh,
    })),
    tags: article.tags?.map((tag) => ({
      ...tag,
      name_zh: localizeText(tag.name_zh, locale) || tag.name_zh,
    })),
  };
}

function localizeCategory(category: Category, locale: string): Category {
  return {
    ...category,
    name_zh: localizeText(category.name_zh, locale) || category.name_zh,
  };
}

export default function NewsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        newsApi.list({ limit: 50, locale: articleLocaleFor(locale) }).catch(() => []),
        newsApi.categories().catch(() => []),
      ]);
      const published = (articlesData as Article[])
        .filter((a) => a.is_published)
        .map((article) => localizeArticle(article, locale));
      setArticles(published);
      setCategories((categoriesData as Category[]).map((category) => localizeCategory(category, locale)));
    } catch {
      setArticles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredArticles = filterCategory === 'all'
    ? articles
    : articles.filter((a) => a.categories?.some((c) => c.slug === filterCategory));

  const handleCategoryChange = (slug: string) => {
    setFilterCategory(slug);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Header */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="heading-lg mb-3">
            {t('news.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('news.subtitle')}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-card border-b sticky top-12 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange('all')}
            className="flex-shrink-0"
          >
            {t('news.allCategories')}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.slug}
              variant={filterCategory === cat.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat.slug)}
              style={
                filterCategory === cat.slug && cat.color
                  ? { backgroundColor: cat.color }
                  : undefined
              }
              className="flex-shrink-0"
            >
              {cat.name_zh ? `${cat.name} (${cat.name_zh})` : cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
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
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              {t('news.noArticles')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const primaryCategory = article.categories?.[0];
              return (
                <Card
                  key={article.id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  onClick={() => router.push(`/${locale}/news/${article.slug}`)}
                >
                  {article.cover_image && (
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      {primaryCategory && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={
                            primaryCategory.color
                              ? { backgroundColor: `${primaryCategory.color}20`, color: primaryCategory.color }
                              : undefined
                          }
                        >
                          {primaryCategory.name_zh ? `${primaryCategory.name} (${primaryCategory.name_zh})` : primaryCategory.name}
                        </Badge>
                      )}
                      {article.published_at && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(article.published_at, dateLocaleFor(locale))}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {article.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {article.published_at
                          ? formatDate(article.published_at, dateLocaleFor(locale))
                          : formatDate(article.created_at, dateLocaleFor(locale))}
                      </span>
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('news.readMore')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Mulan Dance Studio News</p>
        </div>
      </footer>
    </div>
  );
}
