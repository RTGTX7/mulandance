'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { homepageApi, newsApi, type HomepageSection } from '@/lib/api';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';
import { truncate } from '@/lib/utils';
import { ExhibitHeading, ExhibitReveal } from '@/components/motion/ExhibitMotion';

interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  slug: string;
  published_at?: string;
  cover_image?: string;
  categories?: Array<{ name: string; slug: string; color?: string }>;
}

const MAX_HOMEPAGE_ARTICLES = 4;

export function NewsGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [section, setSection] = useState<HomepageSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    newsApi
      .list({ limit: 6, locale: articleLocaleFor(locale), homepage: true })
      .then((data) => {
        if (active) setArticles(selectHomepageArticles(data as NewsArticle[]));
      })
      .catch(() => {
        if (active) setArticles([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    homepageApi.get(locale)
      .then((settings) => {
        if (active) setSection(settings.sections.news);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [locale]);

  const featured = articles[0];
  const updates = articles.slice(1);
  const singleArticle = Boolean(featured && updates.length === 0);

  if (section && !section.is_enabled) return null;

  return (
    <section className="homepage-news-editorial section-padding bg-white">
      <div className="container">
        <ExhibitReveal className="mb-8 flex flex-col gap-4 md:mb-11 md:flex-row md:items-end md:justify-between" distance={24}>
          <div>
            <ExhibitHeading className="mb-3" align="left">{section?.title || t('home.news.title')}</ExhibitHeading>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{section?.subtitle || t('home.news.subtitle')}</p>
          </div>
          <Link href={`/${locale}/news`} className="homepage-news-view-all">
            {section?.link_label || t('home.news.viewAll')} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </ExhibitReveal>

        {loading ? (
          <NewsEditorialLoading />
        ) : !featured ? (
          <div className="homepage-news-empty">{t('home.news.noItems')}</div>
        ) : (
          <div className={`homepage-news-layout${singleArticle ? ' is-single' : ''}`}>
            <ExhibitReveal distance={24}>
              <FeaturedArticle article={featured} locale={locale} readMore={t('home.news.readMore')} />
            </ExhibitReveal>

            {updates.length > 0 && (
              <ExhibitReveal delay={0.08} distance={20}>
                <aside className="homepage-news-updates" aria-label={t('home.news.latestUpdates')}>
                  <p className="homepage-news-updates-title">{t('home.news.latestUpdates')}</p>
                  {updates.map((article, index) => (
                    <NewsUpdateRow key={article.id} article={article} locale={locale} delay={index * 0.06} />
                  ))}
                </aside>
              </ExhibitReveal>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedArticle({ article, locale, readMore }: { article: NewsArticle; locale: string; readMore: string }) {
  const category = article.categories?.[0];
  const date = formatNewsDate(article.published_at, locale);
  const [imageFailed, setImageFailed] = useState(false);
  const showCover = Boolean(article.cover_image && !imageFailed);

  return (
    <Link href={`/${locale}/news/${article.slug}`} className={`homepage-news-feature group${showCover ? '' : ' is-date-poster'}`}>
      {showCover ? (
        <div className="homepage-news-feature-media">
          <img
            src={article.cover_image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="homepage-news-date-poster" aria-hidden="true">
          <span>{date.day}</span>
          <strong>{date.month}</strong>
          <small>{date.year}</small>
        </div>
      )}

      <div className="homepage-news-feature-copy">
        <div className="homepage-news-meta">
          {category && <span>{category.name}</span>}
          {date.full && <time dateTime={article.published_at}>{date.full}</time>}
        </div>
        <h3>{article.title}</h3>
        {article.summary && <p>{truncate(article.summary, 180)}</p>}
        <span className="homepage-news-read-more">
          {readMore} <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function NewsUpdateRow({ article, locale, delay }: { article: NewsArticle; locale: string; delay: number }) {
  const category = article.categories?.[0];
  const date = formatNewsDate(article.published_at, locale);

  return (
    <ExhibitReveal delay={delay} distance={16}>
      <Link href={`/${locale}/news/${article.slug}`} className="homepage-news-update-row group">
        <div className="homepage-news-update-date" aria-hidden="true">
          <strong>{date.day}</strong>
          <span>{date.month}</span>
        </div>
        <div className="min-w-0">
          <div className="homepage-news-meta">
            {category && <span>{category.name}</span>}
            {date.year && <time dateTime={article.published_at}>{date.year}</time>}
          </div>
          <h3>{article.title}</h3>
          {article.summary && <p>{truncate(article.summary, 105)}</p>}
        </div>
        <ArrowUpRight className="homepage-news-update-arrow" aria-hidden="true" />
      </Link>
    </ExhibitReveal>
  );
}

function NewsEditorialLoading() {
  return (
    <div className="homepage-news-layout" aria-hidden="true">
      <div className="homepage-news-loading homepage-news-loading-feature" />
      <div className="homepage-news-updates">
        <div className="homepage-news-loading h-10" />
        <div className="homepage-news-loading h-28" />
        <div className="homepage-news-loading h-28" />
        <div className="homepage-news-loading h-28" />
      </div>
    </div>
  );
}

function selectHomepageArticles(items: NewsArticle[]) {
  const candidates = items.slice(0, 6);
  if (candidates.length === 0) return [];

  const featured = candidates.find((article) => Boolean(article.cover_image || article.summary?.trim())) || candidates[0];
  return [featured, ...candidates.filter((article) => article.id !== featured.id)].slice(0, MAX_HOMEPAGE_ARTICLES);
}

function formatNewsDate(value: string | undefined, locale: string) {
  if (!value) return { day: '--', month: '', year: '', full: '' };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '', year: '', full: '' };

  const dateLocale = dateLocaleFor(locale);
  return {
    day: new Intl.DateTimeFormat(dateLocale, { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat(dateLocale, { month: 'short' }).format(date),
    year: new Intl.DateTimeFormat(dateLocale, { year: 'numeric' }).format(date),
    full: new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date),
  };
}
