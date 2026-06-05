'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
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
  startDateTime?: string;
  endDateTime?: string;
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
    startDateTime: '2026-06-15T19:00:00',
    endDateTime: '2026-06-15T21:00:00',
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
    startDateTime: '2026-07-20T09:00:00',
    endDateTime: '2026-07-20T17:00:00',
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
    startDateTime: '2026-09-01T09:00:00',
    endDateTime: '2026-09-01T18:00:00',
  },
];

export function EventCards() {
  const t = useTranslations();
  const locale = useLocale();
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const now = Date.now();

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
    <section className="homepage-glass-section py-6 md:py-14 lg:py-16">
      <div className="container relative z-10">
        <div className="homepage-glass-heading mb-5 flex flex-col gap-2 rounded-2xl px-4 py-4 md:mb-8 md:flex-row md:items-end md:justify-between md:gap-4 md:px-5">
          <div>
            <AnimatedLineHeading text={t('home.events.title')} align="left" className="mb-2" />
            <p className="text-lead">{t('home.events.subtitle')}</p>
          </div>
          <Link href={`/${locale}/performances`}>
            <span className="inline-flex rounded-full border border-white/60 bg-white/50 px-3 py-1.5 text-sm font-medium text-secondary shadow-sm backdrop-blur-xl transition-colors hover:bg-white/70">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="relative md:hidden">
          <div
            className="pointer-events-none absolute bottom-3 left-[17px] top-4 w-px bg-gradient-to-b from-secondary/70 via-primary/35 to-transparent"
            aria-hidden="true"
          />
          <div className="space-y-2.5">
            {events.map((event, index) => (
              <RevealOnScroll key={event.id} delay={index * 80}>
                <Link
                  href={event.href.startsWith('/') ? `/${locale}${event.href}` : event.href}
                  className="group relative grid grid-cols-[36px_1fr] gap-2"
                >
                  <div className="relative z-10 flex justify-center pt-4">
                    <span className="relative flex h-3.5 w-3.5 rounded-full border border-white/70 bg-white/65 shadow-sm shadow-purple-950/10 backdrop-blur-xl">
                      <span className="absolute inset-1 rounded-full bg-secondary/65" />
                    </span>
                  </div>
                  <div className="homepage-glass-card rounded-xl p-2.5 transition-all group-hover:-translate-y-0.5 group-hover:bg-white/70 group-hover:shadow-md">
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="relative h-[132px] overflow-hidden rounded-lg border border-white/55 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-xl">
                        {event.coverImage && (
                          <img
                            src={event.coverImage}
                            alt={event.title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_40%,rgba(20,16,30,0.18))]" />
                      </div>

                      <div className="min-w-0 px-0.5 pb-0.5">
                        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium leading-none text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-secondary" />
                            {formatShortDate(event.date, locale)}
                          </span>
                          {event.time && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-secondary" />
                              <span className="truncate">{event.time}</span>
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-secondary">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="homepage-event-timeline relative grid auto-rows-fr grid-cols-3 gap-5 pt-10 xl:gap-6">
            {events.map((event, index) => (
              <RevealOnScroll key={event.id} delay={index * 90}>
                <Link
                  href={event.href.startsWith('/') ? `/${locale}${event.href}` : event.href}
                  className="homepage-event-timeline-item group flex h-full flex-col text-left"
                >
                  <div className="homepage-event-timeline-pin" aria-hidden="true">
                    <span className={`homepage-mini-timeline-node homepage-mini-timeline-node-${eventStatus(event, now)}`}>
                      <span className="homepage-mini-timeline-core" />
                    </span>
                  </div>
                  <div className="homepage-glass-card relative flex h-full min-h-[248px] flex-1 flex-col overflow-hidden rounded-[16px] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-secondary/25 group-hover:bg-white/72 group-hover:shadow-xl group-hover:shadow-purple-950/10">
                    <div className="relative flex h-[210px] items-center justify-center overflow-hidden bg-slate-950">
                      {event.coverImage && (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className={`h-full w-full object-cover ${eventStatusImageClass(event, now)}`}
                        />
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_18%,rgba(18,14,28,0.18)_100%)]" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col px-4 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-secondary">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {formatShortDate(event.date, locale)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0 text-secondary" />
                          {event.time}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-3 min-h-[4.8rem] text-[1.18rem] font-bold leading-snug text-slate-950 transition-colors group-hover:text-secondary">
                        {event.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
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
    startDateTime: item.start_date,
    endDateTime: item.end_date,
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

function eventStatus(event: Event, now: number) {
  const start = event.startDateTime ? new Date(event.startDateTime).getTime() : new Date(`${event.date}T${normalizeTime(event.time)}`).getTime();
  const end = event.endDateTime ? new Date(event.endDateTime).getTime() : endOfEventTime(event);
  if (Number.isNaN(start)) return 'future';
  if (start <= now && end >= now) return 'current';
  if (end < now) return 'past';
  return 'future';
}

function eventStatusDotClass(event: Event, now: number) {
  const status = eventStatus(event, now);
  if (status === 'past') return 'bg-slate-400 shadow-[0_0_0_4px_rgba(148,163,184,0.14)]';
  if (status === 'current') return 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]';
  return 'bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.16)]';
}

function eventStatusLineClass(event: Event, now: number) {
  const status = eventStatus(event, now);
  if (status === 'past') return 'bg-slate-300';
  if (status === 'current') return 'bg-emerald-400';
  return 'bg-orange-300';
}

function eventStatusImageClass(event: Event, now: number) {
  const status = eventStatus(event, now);
  if (status === 'past') return 'opacity-78 saturate-[0.82] contrast-[0.94]';
  if (status === 'current') return 'opacity-96 saturate-[1.02]';
  return 'opacity-92 saturate-[0.96]';
}

function normalizeTime(time: string) {
  if (!time || time.toLowerCase() === 'all day') return '00:00';
  const parsed = new Date(`2000-01-01 ${time}`);
  if (Number.isNaN(parsed.getTime())) return '00:00';
  return parsed.toTimeString().slice(0, 5);
}

function endOfEventTime(event: Event) {
  const base = new Date(`${event.date}T${normalizeTime(event.time)}`);
  if (Number.isNaN(base.getTime())) return 0;
  const end = new Date(base);
  end.setHours(end.getHours() + 2);
  return end.getTime();
}
