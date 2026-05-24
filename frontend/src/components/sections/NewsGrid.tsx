'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, truncate } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  image: string;
  href: string;
}

const articles: Article[] = [
  {
    id: '1',
    title: 'Spring Showcase 2026 Announced',
    summary:
      'Join us for our annual student performance featuring over 200 dancers across all programs.',
    date: '2026-04-15',
    category: 'Events',
    image: '/images/news/spring-showcase.jpg',
    href: '/media/news/spring-showcase-2026',
  },
  {
    id: '2',
    title: 'New RAD Examination Centre',
    summary:
      'Grace Dance Academy is now an approved RAD examination centre for the 2026-2027 session.',
    date: '2026-04-01',
    category: 'Announcements',
    image: '/images/news/rad-centre.jpg',
    href: '/media/news/rad-examination-centre',
  },
  {
    id: '3',
    title: 'Summer Camp Registration Open',
    summary:
      'Early bird pricing available for our 2026 summer dance camps. Register before May 31.',
    date: '2026-03-20',
    category: 'Programs',
    image: '/images/news/summer-camp.jpg',
    href: '/media/news/summer-camp-2026',
  },
];

export function NewsGrid() {
  const t = useTranslations();

  return (
    <section className="section-padding bg-card/50">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h2 className="heading-lg mb-2">{t('home.news.title')}</h2>
            <p className="text-lead">{t('home.news.subtitle')}</p>
          </div>
          <Link href="/media/news">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.news.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={article.href}>
              <Card className="card-hover h-full group cursor-pointer flex flex-col">
                <div className="h-44 bg-muted rounded-t-lg overflow-hidden" />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      {article.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(article.date, 'en-US')}
                    </span>
                  </div>
                  <CardTitle className="heading-sm group-hover:text-secondary transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncate(article.summary, 140)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
