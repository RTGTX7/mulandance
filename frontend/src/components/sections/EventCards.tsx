'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { homepageApi, performanceApi, type HomepageSection, type PerformanceItem } from '@/lib/api';
import { ExhibitHeading, ExhibitReveal } from '@/components/motion/ExhibitMotion';
import { parseStableDateTime, stableDateKey } from '@/lib/utils';

type EventStatus = 'upcoming' | 'highlight';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  href: string;
  coverImage?: string;
  status: EventStatus;
}

interface EventShowcase {
  featured?: TimelineEvent;
  upcoming: TimelineEvent[];
  hasPastHighlights: boolean;
}

const EMPTY_SHOWCASE: EventShowcase = { upcoming: [], hasPastHighlights: false };
const MAX_UPCOMING_ROWS = 3;

export function EventCards() {
  const t = useTranslations();
  const locale = useLocale();
  const [showcase, setShowcase] = useState<EventShowcase>(EMPTY_SHOWCASE);
  const [section, setSection] = useState<HomepageSection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);

    performanceApi.list({ locale })
      .then((items) => {
        if (active) setShowcase(selectShowcase(items, locale));
      })
      .catch(() => {
        if (active) setShowcase(EMPTY_SHOWCASE);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    homepageApi.get(locale)
      .then((settings) => {
        if (active) setSection(settings.sections.performances);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [locale]);

  const featured = showcase.featured;

  if (section && !section.is_enabled) return null;

  return (
    <section className="homepage-events-showcase py-10 md:py-16 lg:py-20">
      <div className="container">
        <ExhibitReveal className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between" distance={24}>
          <div>
            <ExhibitHeading className="mb-3" align="left">{section?.title || t('home.events.title')}</ExhibitHeading>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{section?.subtitle || t('home.events.subtitle')}</p>
          </div>
          <Link href={`/${locale}/performances`}>
            <span className="inline-flex rounded-md border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
              {section?.link_label || t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </ExhibitReveal>

        {!loaded ? (
          <div className="homepage-events-loading" aria-hidden="true" />
        ) : !featured ? (
          <div className="homepage-events-empty text-muted-foreground">{t('home.events.noItems')}</div>
        ) : (
          <div className="homepage-events-showcase-layout">
            <ExhibitReveal distance={26}>
              <Link href={`/${locale}${featured.href}`} className="homepage-event-feature group">
                {featured.coverImage ? (
                  <img src={featured.coverImage} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                ) : (
                  <div className="homepage-event-feature-fallback" aria-hidden="true">
                    <span>{formatDay(featured.date, locale)}</span>
                    <small>{formatMonth(featured.date, locale)}</small>
                  </div>
                )}
                <div className="homepage-event-feature-overlay" />
                <div className="homepage-event-feature-content">
                  <div className="homepage-event-feature-date">
                    <strong>{formatDay(featured.date, locale)}</strong>
                    <span>{formatMonth(featured.date, locale)}</span>
                  </div>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                    {t(featured.status === 'highlight' ? 'home.events.highlights' : 'home.events.featured')}
                  </p>
                  <h3 className="mt-2 max-w-xl text-3xl font-bold leading-tight text-white md:text-4xl">{featured.title}</h3>
                  {featured.description && <p className="mt-3 max-w-xl line-clamp-2 text-sm leading-6 text-white/80 md:text-base">{featured.description}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-white/90 md:text-sm">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{featured.time || t('home.events.allDay')}</span>
                    {featured.location && <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{featured.location}</span></span>}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    {t('home.events.viewDetails')} <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </ExhibitReveal>

            <ExhibitReveal delay={0.08} distance={20}>
              <aside className="homepage-events-upcoming" aria-label={t('home.events.upcoming')}>
                <p className="homepage-events-upcoming-title">{t('home.events.upcoming')}</p>
                {showcase.upcoming.length > 0 ? (
                  <div>
                    {showcase.upcoming.map((event) => (
                      <Link key={event.id} href={`/${locale}${event.href}`} className="homepage-events-upcoming-row group">
                        <div className="homepage-events-upcoming-date" aria-hidden="true">
                          <strong>{formatDay(event.date, locale)}</strong>
                          <span>{formatMonth(event.date, locale)}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{event.title}</h3>
                          {event.description && <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{event.description}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-foreground/75">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{event.time || t('home.events.allDay')}</span>
                            {event.location && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{event.location}</span></span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-sm leading-6 text-muted-foreground">{t('home.events.noUpcoming')}</p>
                )}
                {showcase.hasPastHighlights && (
                  <Link href={`/${locale}/performances`} className="homepage-events-highlights-link">
                    {t('home.events.highlights')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </aside>
            </ExhibitReveal>
          </div>
        )}
      </div>
    </section>
  );
}

function selectShowcase(items: PerformanceItem[], locale: string): EventShowcase {
  const now = Date.now();
  const visible = items.filter((item) => item.is_current);
  const upcoming = visible
    .filter((item) => parseStableDateTime(item.end_date).getTime() >= now)
    .sort((a, b) => parseStableDateTime(a.start_date).getTime() - parseStableDateTime(b.start_date).getTime());
  const highlights = visible
    .filter((item) => parseStableDateTime(item.end_date).getTime() < now)
    .sort((a, b) => parseStableDateTime(b.start_date).getTime() - parseStableDateTime(a.start_date).getTime());

  if (upcoming.length > 0) {
    return {
      featured: toTimelineEvent(upcoming[0], locale, 'upcoming'),
      upcoming: upcoming.slice(1, MAX_UPCOMING_ROWS + 1).map((item) => toTimelineEvent(item, locale, 'upcoming')),
      hasPastHighlights: highlights.length > 0,
    };
  }

  if (highlights.length > 0) {
    return {
      featured: toTimelineEvent(highlights[0], locale, 'highlight'),
      upcoming: [],
      hasPastHighlights: highlights.length > 1,
    };
  }

  return EMPTY_SHOWCASE;
}

function toTimelineEvent(item: PerformanceItem, locale: string, status: EventStatus): TimelineEvent {
  const start = parseStableDateTime(item.start_date);
  const end = parseStableDateTime(item.end_date);
  const allDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;

  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    date: stableDateKey(item.start_date),
    time: allDay ? '' : formatTimeRange(start, end, locale),
    location: item.venue || '',
    href: `/performances/${item.slug}`,
    coverImage: item.cover_image,
    status,
  };
}

function formatDay(date: string, locale: string) {
  const parsed = parseStableDateTime(date);
  if (Number.isNaN(parsed.getTime())) return '--';
  return new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(parsed);
}

function formatMonth(date: string, locale: string) {
  const parsed = parseStableDateTime(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(parsed);
}

function formatTimeRange(start: Date, end: Date, locale: string) {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${start.toLocaleTimeString(locale, options)} – ${end.toLocaleTimeString(locale, options)}`;
}
