'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/ui/i18n-client';
import { dateLocaleFor } from '@/lib/i18n';
import { cn, parseStableDateTime } from '@/lib/utils';
import { type ScheduleCalendarEvent, unifiedScheduleApi } from '@/lib/api';

interface WeekRange {
  start: string;
  end: string;
}

function dateKey(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function dateFromKey(value: string) {
  return parseStableDateTime(`${value}T12:00:00`);
}

function weekRange(reference = new Date()): WeekRange {
  const start = new Date(reference);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}

function shiftWeek(range: WeekRange, amount: number): WeekRange {
  const start = dateFromKey(range.start);
  start.setDate(start.getDate() + amount);
  const end = dateFromKey(range.end);
  end.setDate(end.getDate() + amount);
  return { start: dateKey(start), end: dateKey(end) };
}

function datesInWeek(range: WeekRange) {
  const start = dateFromKey(range.start);
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
}

function replaceCount(value: string, count: number) {
  return value.replace('{count}', String(count));
}

function WeekNavigator({
  label,
  year,
  previousLabel,
  nextLabel,
  currentLabel,
  onPrevious,
  onNext,
  onCurrent,
}: {
  label: string;
  year: string;
  previousLabel: string;
  nextLabel: string;
  currentLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 bg-white"
        aria-label={previousLabel}
        onClick={onPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 text-center">
        <div className="truncate text-sm font-semibold text-slate-950">{label}</div>
        <div className="mt-0.5 flex items-center justify-center gap-2">
          <span className="text-[11px] text-slate-500">{year}</span>
          <button
            type="button"
            className="min-h-7 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={onCurrent}
          >
            {currentLabel}
          </button>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 bg-white"
        aria-label={nextLabel}
        onClick={onNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid grid-cols-[68px_minmax(0,1fr)] gap-4 py-4">
          <div className="h-8 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh';
  const dateLocale = dateLocaleFor(locale);
  const today = dateKey(new Date());
  const [range, setRange] = useState<WeekRange>(() => weekRange());
  const [selectedDate, setSelectedDate] = useState(today);
  const [manualSelection, setManualSelection] = useState(false);
  const [items, setItems] = useState<ScheduleCalendarEvent[]>([]);
  const [loadedRange, setLoadedRange] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const rangeId = `${range.start}:${range.end}`;
  const weekDates = useMemo(() => datesInWeek(range), [range]);
  const weekDateKeys = useMemo(() => weekDates.map(dateKey), [weekDates]);
  const weekdays = useMemo(
    () =>
      (t.raw('common.weekdays.long') as string[] | undefined) || [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    [t],
  );

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleCalendarEvent[]>();
    for (const item of items) {
      const entries = grouped.get(item.date) || [];
      entries.push(item);
      grouped.set(item.date, entries);
    }
    for (const entries of Array.from(grouped.values())) {
      entries.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return grouped;
  }, [items]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    unifiedScheduleApi
      .publicClasses(range.start, range.end, locale)
      .then((result) => {
        if (!active) return;
        setItems(result);
        setLoadedRange(rangeId);
      })
      .catch(() => {
        if (!active) return;
        setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale, range.end, range.start, rangeId, retryKey]);

  useEffect(() => {
    if (loading || loadedRange !== rangeId || manualSelection) return;
    const occupiedDates = weekDateKeys.filter((key) => (itemsByDate.get(key)?.length || 0) > 0);
    const isCurrentWeek = today >= range.start && today <= range.end;
    if (isCurrentWeek) {
      if ((itemsByDate.get(today)?.length || 0) > 0) {
        setSelectedDate(today);
        return;
      }
      setSelectedDate(occupiedDates.find((key) => key > today) || today);
      return;
    }
    setSelectedDate(occupiedDates[0] || range.start);
  }, [itemsByDate, loadedRange, loading, manualSelection, range.end, range.start, rangeId, today, weekDateKeys]);

  const shortWeekday = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }),
    [dateLocale],
  );
  const shortDate = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric' }),
    [dateLocale],
  );
  const fullDate = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    [dateLocale],
  );

  const weekLabel = `${shortDate.format(weekDates[0])} - ${shortDate.format(weekDates[6])}`;
  const weekYear =
    weekDates[0].getFullYear() === weekDates[6].getFullYear()
      ? String(weekDates[0].getFullYear())
      : `${weekDates[0].getFullYear()} - ${weekDates[6].getFullYear()}`;
  const selectedEntries = itemsByDate.get(selectedDate) || [];
  const totalClasses = weekDateKeys.reduce((total, key) => total + (itemsByDate.get(key)?.length || 0), 0);

  function navigateTo(nextRange: WeekRange) {
    setLoading(true);
    setManualSelection(false);
    setSelectedDate(nextRange.start);
    setRange(nextRange);
  }

  const navigator = (
    <WeekNavigator
      label={weekLabel}
      year={weekYear}
      previousLabel={t('classes.schedulePage.previousWeek')}
      nextLabel={t('classes.schedulePage.nextWeek')}
      currentLabel={t('classes.schedulePage.thisWeek')}
      onPrevious={() => navigateTo(shiftWeek(range, -7))}
      onNext={() => navigateTo(shiftWeek(range, 7))}
      onCurrent={() => navigateTo(weekRange())}
    />
  );

  return (
    <div className="md:pt-16">
      <div className="hidden md:block">
        <PageHero
          breadcrumbLabel={t('common.nav.classes')}
          breadcrumbHref="/classes/schedule"
          title={t('classes.schedule')}
          subtitle={t('classes.schedulePage.description')}
        />
      </div>

      <section className="border-b border-primary/10 bg-white px-4 py-5 md:hidden">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <CalendarDays className="h-4 w-4" />
            {t('classes.schedulePage.badge')}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{t('classes.schedule')}</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{t('classes.schedulePage.description')}</p>
        </div>
      </section>

      <main className="bg-slate-100 py-5 md:py-16">
        <div className="container">
          {loadFailed && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <span>{t('classes.schedulePage.loadFailed')}</span>
              <Button type="button" size="sm" variant="outline" className="shrink-0 bg-white" onClick={() => setRetryKey((value) => value + 1)}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {t('classes.schedulePage.retry')}
              </Button>
            </div>
          )}

          <section className="md:hidden" aria-labelledby="mobile-schedule-title">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-purple-950/5">
              <h2 id="mobile-schedule-title" className="sr-only">
                {t('classes.schedulePage.calendarTitle')}
              </h2>
              {navigator}
              <div className="mt-3 grid grid-cols-7 gap-1" role="group" aria-label={t('classes.schedulePage.calendarTitle')}>
                {weekDates.map((value, index) => {
                  const key = weekDateKeys[index];
                  const count = itemsByDate.get(key)?.length || 0;
                  const selected = selectedDate === key;
                  const isToday = today === key;
                  const dateLabel = fullDate.format(value);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${dateLabel}, ${replaceCount(t('classes.schedulePage.dayCount'), count)}${isToday ? `, ${t('classes.schedulePage.today')}` : ''}`}
                      className={cn(
                        'relative flex h-[74px] min-w-0 flex-col items-center justify-center rounded-md border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                        selected
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-transparent bg-slate-50 text-slate-700 hover:border-primary/20 hover:bg-primary/5',
                        isToday && !selected && 'border-primary/50 bg-white',
                      )}
                      onClick={() => {
                        setManualSelection(true);
                        setSelectedDate(key);
                      }}
                    >
                      <span className={cn('max-w-full truncate px-0.5 text-[10px] font-semibold', selected ? 'text-white/80' : 'text-slate-500')}>
                        {shortWeekday.format(value).replace('.', '')}
                      </span>
                      <span className="mt-0.5 text-base font-semibold leading-none">{value.getDate()}</span>
                      <span
                        className={cn(
                          'mt-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                          selected ? 'bg-white/20 text-white' : count ? 'bg-primary/10 text-primary' : 'text-transparent',
                        )}
                        aria-hidden="true"
                      >
                        {count || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 shadow-sm shadow-purple-950/5">
              <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 py-3">
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-base font-semibold text-slate-950">{fullDate.format(dateFromKey(selectedDate))}</h3>
                  {!loading && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {replaceCount(t('classes.schedulePage.dayCount'), selectedEntries.length)}
                    </p>
                  )}
                </div>
                {selectedDate === today && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    {t('classes.schedulePage.today')}
                  </span>
                )}
              </div>

              {loading ? (
                <ScheduleSkeleton />
              ) : selectedEntries.length ? (
                <div className="divide-y divide-slate-100" aria-live="polite">
                  {selectedEntries.map((item) => (
                    <article key={item.id} className="grid grid-cols-[68px_minmax(0,1fr)] gap-4 py-4">
                      <div className="border-r border-primary/20 pr-3 text-right">
                        <div className="text-sm font-semibold text-primary">{item.start_time}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{item.end_time}</div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="break-words font-semibold leading-5 text-slate-950">{item.title}</h4>
                        {item.room_name && (
                          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-600">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="break-words">{item.room_name}</span>
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-32 flex-col items-center justify-center py-6 text-center" aria-live="polite">
                  <CalendarDays className="h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {totalClasses === 0 ? t('classes.schedulePage.noWeekCourses') : t('classes.schedulePage.noCourse')}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="content-glass-section hidden p-5 md:block" aria-labelledby="desktop-schedule-title">
            <div className="mb-5 flex items-start justify-between gap-6">
              <div>
                <h2 id="desktop-schedule-title" className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {t('classes.schedulePage.calendarTitle')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t('classes.schedulePage.calendarHint')}</p>
              </div>
              <div className="w-[320px] shrink-0">{navigator}</div>
            </div>

            <div className="desktop-wide-grid overflow-x-auto">
              <div className="grid min-w-[1050px] grid-cols-7 overflow-hidden rounded-lg border">
                {weekDates.map((value, index) => {
                  const key = weekDateKeys[index];
                  const entries = itemsByDate.get(key) || [];
                  return (
                    <div key={key} className="min-h-[300px] border-r last:border-r-0">
                      <div className="border-b bg-slate-100 px-3 py-2 text-sm font-semibold">
                        {weekdays[value.getDay()]}
                        <span className="ml-1.5 text-xs font-normal text-slate-500">{value.getDate()}</span>
                      </div>
                      <div className="space-y-2 p-3">
                        {loading ? (
                          <div className="space-y-2" aria-hidden="true">
                            <div className="h-20 animate-pulse rounded-md bg-slate-100" />
                          </div>
                        ) : entries.length ? (
                          entries.map((item) => (
                            <article key={item.id} className="rounded-md border border-primary/15 bg-primary/5 p-3 text-xs">
                              <div className="flex items-center gap-1 font-medium text-primary">
                                <Clock3 className="h-3.5 w-3.5" />
                                {item.start_time} - {item.end_time}
                              </div>
                              <h3 className="mt-1 text-sm font-semibold text-slate-950">{item.title}</h3>
                              {item.room_name && <p className="mt-1 text-slate-600">{item.room_name}</p>}
                            </article>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">{t('classes.schedulePage.noCourse')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
