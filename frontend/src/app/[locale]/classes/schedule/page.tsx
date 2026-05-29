'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { CourseScheduleItem, SchoolPolicy, scheduleApi } from '@/lib/api';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';

const displayOrder = [1, 2, 3, 4, 5, 6, 0];

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatTimeRange(item: CourseScheduleItem) {
  return `${item.start_time} - ${item.end_time}`;
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

export default function SchedulePage() {
  const t = useTranslations();
  const rawWeekdays = t.raw('common.weekdays.long') as string[] | undefined;
  const weekdays = useMemo(
    () => rawWeekdays || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    [rawWeekdays]
  );
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [policy, setPolicy] = useState<SchoolPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadFailedMessage = t('classes.schedulePage.loadFailed');

  useEffect(() => {
    Promise.all([scheduleApi.list(), scheduleApi.policy()])
      .then(([scheduleItems, policyData]) => {
        setItems(scheduleItems);
        setPolicy(policyData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : loadFailedMessage))
      .finally(() => setLoading(false));
  }, [loadFailedMessage]);

  const grouped = useMemo(() => {
    return displayOrder.map((day) => ({
      day,
      label: weekdays[day],
      items: items
        .filter((item) => item.day_of_week === day)
        .sort((a, b) =>
          timeToMinutes(a.start_time) - timeToMinutes(b.start_time) ||
          a.order_index - b.order_index ||
          timeToMinutes(a.end_time) - timeToMinutes(b.end_time)
        ),
    }));
  }, [items, weekdays]);

  const locations = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.location).filter(Boolean)));
  }, [items]);

  const policyHtml = useMemo(() => {
    if (!policy?.body_markdown) return '';
    return String(marked.parse(policy.body_markdown));
  }, [policy]);

  return (
    <main className="section-padding bg-slate-50">
      <div className="container space-y-8">
        <div className="max-w-3xl">
          <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm">
            <CalendarDays className="h-4 w-4" />
            {t('classes.schedulePage.badge')}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {t('classes.schedule')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {t('classes.schedulePage.description')}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">{t('common.ui.loading')}</CardContent>
          </Card>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                  {t('classes.schedulePage.calendarTitle')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('classes.schedulePage.calendarHint')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {interpolate(t('classes.schedulePage.slotCount'), { count: items.length })}
                </Badge>
                {locations.slice(0, 2).map((location) => (
                  <Badge key={location} variant="outline" className="max-w-[260px] truncate">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[1120px] grid-cols-7 overflow-hidden rounded-lg border border-slate-200">
                {grouped.map((day) => (
                  <div key={day.day} className="min-h-[460px] border-r border-slate-200 last:border-r-0">
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-2">
                      <div className="text-sm font-semibold text-slate-950">{day.label}</div>
                      <div className="text-xs text-slate-500">
                        {interpolate(t('classes.schedulePage.dayCount'), { count: day.items.length })}
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      {day.items.length === 0 ? (
                        <div className="rounded-md border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">
                          {t('classes.schedulePage.noCourse')}
                        </div>
                      ) : (
                        day.items.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-md border border-purple-100 bg-purple-50/70 p-3 text-xs shadow-sm"
                          >
                            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 font-semibold text-purple-700">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTimeRange(item)}
                            </div>
                            <h3 className="text-sm font-semibold leading-5 text-slate-950">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="mt-1 line-clamp-4 leading-5 text-slate-600">
                                {item.description}
                              </p>
                            )}
                            <div className="mt-3 flex items-start gap-1.5 leading-5 text-slate-500">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{item.location}</span>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {policy && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">{policy.title}</h2>
            <div
              className="prose prose-slate mt-5 max-w-none prose-headings:font-semibold prose-li:my-1 prose-p:leading-7"
              dangerouslySetInnerHTML={{ __html: policyHtml }}
            />
          </section>
        )}
      </div>
    </main>
  );
}
