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
  href: string;
}

const articles: Article[] = [
  {
    id: '1',
    title: '2026 Summer Camp Registration Now Open',
    summary: 'Early bird pricing available for our 2026 summer dance camps. Classes available for ages 5-17 in ballet, Chinese dance, contemporary, jazz, and hip-hop. Register before June 30.',
    date: '2026-05-15',
    category: 'Programs',
    href: '/programs/summer-camps',
  },
  {
    id: '2',
    title: 'Annual Showcase 2026 Date Announced',
    summary: 'Mark your calendars! Our annual student showcase will be held in June 2026 at the Grand Hotel Ottawa. All students are invited to participate.',
    date: '2026-05-01',
    category: 'Events',
    href: '/performances/current-season',
  },
  {
    id: '3',
    title: 'New Students Welcome - All Ages, All Levels',
    summary: 'Whether you are a complete beginner or have dance experience, Mulan Dance Studio has a program for you. Come join our warm dance family today!',
    date: '2026-04-20',
    category: 'Studio',
    href: '/about/contact',
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
          <Link href="/about/contact">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.news.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={article.href}>
              <Card className="card-hover h-full group cursor-pointer flex flex-col">
                <div className="h-44 bg-gradient-to-br from-primary/10 to-purple-400/5 rounded-t-lg overflow-hidden" />
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
                    {article.summary}
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
