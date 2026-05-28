'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceApi, type PerformanceItem } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'performance' | 'workshop';
  href: string;
  coverImage?: string;
}

const fallbackEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Student Showcase',
    description: 'A seasonal student performance featuring class work, stage practice, and community celebration.',
    date: '2026-06-15',
    time: '19:00',
    location: 'Grand Hotel Ottawa',
    type: 'performance',
    href: '/performances',
  },
  {
    id: '2',
    title: 'Summer Dance Camp',
    description: 'A one-week immersive dance camp for young dancers with ballet, Chinese dance, contemporary, and jazz.',
    date: '2026-07-20',
    time: '09:00',
    location: '2527 Baseline Rd, Ottawa',
    type: 'workshop',
    href: '/programs/summer-camps',
  },
  {
    id: '3',
    title: 'Children Dance Competition',
    description: 'A performance and competition opportunity for students to gain stage experience and confidence.',
    date: '2026-09-01',
    time: 'All day',
    location: 'Various Locations',
    type: 'performance',
    href: '/performances',
  },
];

export function EventCards() {
  const t = useTranslations();
  const [events, setEvents] = useState<Event[]>(fallbackEvents);

  useEffect(() => {
    performanceApi.list({ current: true })
      .then((items) => {
        if (items.length > 0) {
          setEvents(items.slice(0, 3).map(performanceToEvent));
        }
      })
      .catch(() => setEvents(fallbackEvents));
  }, []);

  return (
    <section className="section-padding">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h2 className="heading-lg mb-2">{t('home.events.title')}</h2>
            <p className="text-lead">{t('home.events.subtitle')}</p>
          </div>
          <Link href="/performances">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={event.href} className="block h-full text-left">
              <Card className="card-hover h-full group cursor-pointer flex flex-col">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-purple-400/10 rounded-t-lg overflow-hidden relative">
                  {event.coverImage && (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-primary">
                      {event.type === 'performance' ? 'Performance' : 'Workshop'}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="heading-sm group-hover:text-secondary transition-colors text-base line-clamp-2 min-h-[48px]">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}
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

function performanceToEvent(item: PerformanceItem): Event {
  const start = new Date(item.start_date);
  const end = new Date(item.end_date);
  const allDay = start.getHours() === 0 && start.getMinutes() === 0
    && end.getHours() === 0 && end.getMinutes() === 0;

  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    date: start.toISOString().slice(0, 10),
    time: allDay ? 'All day' : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: item.venue || '',
    type: 'performance',
    href: `/performances/${item.slug}`,
    coverImage: item.cover_image,
  };
}
