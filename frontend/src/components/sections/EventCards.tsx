'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceApi, type PerformanceItem } from '@/lib/api';
import { AnimatedLineHeading, RevealOnScroll } from '@/components/motion/ScrollEffects';

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
  const locale = useLocale();
  const [events, setEvents] = useState<Event[]>(fallbackEvents);

  useEffect(() => {
    performanceApi.list({ current: true, locale })
      .then((items) => {
        if (items.length > 0) {
          setEvents(items.slice(0, 3).map(performanceToEvent));
        }
      })
      .catch(() => setEvents(fallbackEvents));
  }, [locale]);

  return (
    <section className="section-padding">
      <div className="container">
        <div className="mb-5 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <AnimatedLineHeading text={t('home.events.title')} align="left" className="mb-2" />
            <p className="text-lead">{t('home.events.subtitle')}</p>
          </div>
          <Link href={`/${locale}/performances`}>
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="relative md:hidden">
          <div className="absolute bottom-3 left-[19px] top-3 w-px bg-primary/18" aria-hidden="true" />
          <div className="space-y-3">
            {events.map((event, index) => (
              <RevealOnScroll key={event.id} delay={index * 80}>
                <Link
                  href={event.href.startsWith('/') ? `/${locale}${event.href}` : event.href}
                  className="group relative grid grid-cols-[40px_1fr] gap-2"
                >
                  <div className="relative z-10 flex justify-center pt-4">
                    <span className="flex h-3.5 w-3.5 rounded-full border-2 border-white bg-secondary shadow-sm shadow-purple-950/10" />
                  </div>
                  <div className="grid min-w-0 grid-cols-[72px_1fr] gap-3 rounded-lg border border-white/70 bg-white/75 p-2.5 shadow-sm shadow-purple-950/5 backdrop-blur-xl transition-all group-hover:bg-white/90">
                    <div className="relative h-[76px] overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-purple-300/20 to-secondary/15">
                      {event.coverImage && (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary">
                        {eventTypeLabel(event.type, t)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold leading-none text-secondary">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatShortDate(event.date, locale)}</span>
                        {event.time && (
                          <>
                            <span className="text-muted-foreground/45">/</span>
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{event.time}</span>
                          </>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-secondary">
                        {event.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs leading-snug text-muted-foreground">
                        {event.description}
                      </p>
                      {event.location && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {events.map((event, index) => (
            <RevealOnScroll key={event.id} delay={index * 90}>
              <Link href={event.href.startsWith('/') ? `/${locale}${event.href}` : event.href} className="block h-full text-left">
                <Card className="card-hover h-full group cursor-pointer flex flex-col">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 to-purple-400/10 md:aspect-[16/10]">
                    {event.coverImage && (
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
                      <Badge variant="secondary" className="bg-white/90 text-primary">
                        {eventTypeLabel(event.type, t)}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-1.5">
                    <CardTitle className="line-clamp-2 min-h-[38px] text-base transition-colors group-hover:text-secondary md:min-h-[44px]">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground md:line-clamp-3">
                      {event.description}
                    </p>
                    <div className="space-y-1.5 text-xs leading-snug text-muted-foreground md:text-sm">
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
            </RevealOnScroll>
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

function formatShortDate(date: string, locale: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function eventTypeLabel(type: Event['type'], t: ReturnType<typeof useTranslations>) {
  return type === 'performance' ? t('performanceTimeline.type.performance') : t('performanceTimeline.type.event');
}
