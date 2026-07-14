'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { newsApi } from '@/lib/api';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Tag, Folder } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { articleLocaleFor, dateLocaleFor, isChineseLocale, localizeText } from '@/lib/i18n';

interface Article {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  body?: string;
  rendered_body?: string;
  cover_image?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  locale: string;
  video_url?: string;
  category_slugs?: string[];
  categories?: Array<{ slug: string; name: string; name_zh?: string; color?: string }>;
  tags?: Array<{ slug: string; name: string; name_zh?: string }>;
}

type NamedTaxonomy = { slug: string; name: string; name_zh?: string };

function taxonomyLabel(item: NamedTaxonomy, locale: string) {
  if (isChineseLocale(locale) && item.name_zh) {
    return localizeText(item.name_zh, locale) || item.name_zh;
  }
  return item.name || item.name_zh || item.slug;
}

function localizeArticle(article: Article, locale: string): Article {
  return {
    ...article,
    title: localizeText(article.title, locale) || article.title,
    summary: localizeText(article.summary, locale) || article.summary,
    body: localizeText(article.body, locale) || article.body,
    rendered_body: localizeText(article.rendered_body, locale) || article.rendered_body,
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

function extractVideoUrl(article: Article | null): string {
  if (!article) return "";
  if (article.video_url) return article.video_url;

  const sources = [article.rendered_body || "", article.body || ""];
  for (const source of sources) {
    const match = source.match(/https?:\/\/[^\s)"']+\.(mp4|webm|ogg|mov|m4v)(\?[^\s)"']*)?/i);
    if (match) return match[0];
  }
  return "";
}

export default function ArticleDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1];
  const slug = params?.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      try {
        const data = await newsApi.publicGet(slug, articleLocaleFor(locale));
        setArticle(localizeArticle(data as Article, locale));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug, locale]);

  const categoryNames = article?.categories
    ?.map((c) => taxonomyLabel(c, locale))
    .join(', ') || '';

  const tagNames = article?.tags
    ?.map((t) => taxonomyLabel(t, locale))
    .join(', ') || '';
  const videoUrl = extractVideoUrl(article);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/news`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('news.backToNews', { defaultMessage: 'Back to News' })}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-3">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">
              {t('news.notFound', { defaultMessage: 'Article Not Found' })}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('news.notFoundDesc', { defaultMessage: 'The article you are looking for does not exist or has been removed.' })}
            </p>
            <Button onClick={() => router.push(`/${locale}/news`)}>
              {t('news.backToNews', { defaultMessage: 'Back to News' })}
            </Button>
          </div>
        ) : article ? (
          <article>
            {/* Cover Image */}
            {article.cover_image && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-auto max-h-[400px] object-cover"
                />
              </div>
            )}

            {videoUrl && (
              <div className="mb-8 overflow-hidden rounded-xl border border-white/60 bg-black shadow-sm">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-auto max-h-[520px] bg-black"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="heading-lg mb-4">{article.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(article.published_at, dateLocaleFor(locale))}
                </span>
              )}
              {article.categories && article.categories.length > 0 && (
                <span className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  {categoryNames}
                </span>
              )}
              {article.tags && article.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {tagNames}
                </span>
              )}
            </div>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-4">
                {article.summary}
              </p>
            )}

            {/* Categories */}
            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.categories.map((cat) => (
                  <Badge
                    key={cat.slug}
                    variant="secondary"
                    className="border-primary/20 bg-accent text-sm text-accent-foreground"
                    style={
                      cat.color
                        ? { borderColor: cat.color }
                        : undefined
                    }
                  >
                    {taxonomyLabel(cat, locale)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag) => (
                  <Badge key={tag.slug} variant="outline">
                    {taxonomyLabel(tag, locale)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="prose prose-lg max-w-none mb-12">
              {article.rendered_body ? (
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: article.rendered_body }}
                />
              ) : article.body ? (
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {article.body}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {t('news.noContent', { defaultMessage: 'No content available.' })}
                </p>
              )}
            </div>

            {/* Footer */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span>
                    {t('news.publishedAt')}:{' '}
                    {article.published_at
                      ? formatDate(article.published_at, dateLocaleFor(locale))
                      : formatDate(article.created_at, dateLocaleFor(locale))}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/news`)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t('news.backToNews', { defaultMessage: 'Back to News' })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </article>
        ) : null}
      </main>
    </div>
  );
}
