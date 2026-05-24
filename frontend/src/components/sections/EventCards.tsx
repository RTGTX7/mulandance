'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  image: string;
  href: string;
}

const events: Event[] = [
  {
    id: '1',
    title: 'Spring Showcase 2026',
    description: 'Annual student performance featuring all dance programs.',
    date: '2026-05-15',
    time: '19:00',
    location: 'Grand Theatre',
    type: 'performance',
    image: '/images/events/spring-showcase.jpg',
    href: '/events/spring-showcase',
  },
  {
    id: '2',
    title: 'Contemporary Workshop',
    description: 'Open workshop with guest choreographer Maria Chen.',
    date: '2026-06-01',
    time: '10:00',
    location: 'Studio A',
    type: 'workshop',
    image: '/images/events/contemporary-workshop.jpg',
    href: '/events/contemporary-workshop',
  },
  {
    id: '3',
    title: 'Annual Gala Dinner',
    description: 'Fundraising gala celebrating our 40th anniversary.',
    date: '2026-06-20',
    time: '18:30',
    location: 'Ballroom, Grand Hotel',
    type: 'gala',
    image: '/images/events/annual-gala.jpg',
    href: '/events/annual-gala',
  },
];

export function EventCards() {
  const t = useTranslations();

  return (
    <section className="section-padding">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h2 className="heading-lg mb-2">{t('home.events.title')}</h2>
            <p className="text-lead">{t('home.events.subtitle')}</p>
          </div>
          <Link href="/events/calendar">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={event.href}>
              <Card className="card-hover h-full group cursor-pointer flex flex-col">
                <div className="h-48 bg-muted rounded-t-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-primary">
                      {t(`events.type.${event.type}`)}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="heading-sm group-hover:text-secondary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{formatDate(event.date, 'en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
