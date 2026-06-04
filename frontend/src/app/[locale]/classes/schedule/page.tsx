'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { usePathname } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { CourseScheduleItem, SchoolPolicy, isAuthenticated, scheduleApi, settingsApi } from '@/lib/api';
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
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh';
  const rawWeekdays = t.raw('common.weekdays.long') as string[] | undefined;
  const weekdays = useMemo(
    () => rawWeekdays || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    [rawWeekdays]
  );
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [policy, setPolicy] = useState<SchoolPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const loadFailedMessage = t('classes.schedulePage.loadFailed');

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  useEffect(() => {
    Promise.all([scheduleApi.list({ locale }), settingsApi.schoolPolicy(locale)])
      .then(([scheduleItems, policyData]) => {
        setItems(scheduleItems);
        setPolicy(policyData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : loadFailedMessage))
      .finally(() => setLoading(false));
  }, [loadFailedMessage, locale]);

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
    <div className="pt-16">
      <PageHero
        breadcrumbLabel={t('common.nav.classes')}
        breadcrumbHref="/classes/schedule"
        title={t('classes.schedule')}
        subtitle={t('classes.schedulePage.description')}
      />

      <main className="section-padding bg-slate-100">
        <div className="container space-y-8">

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
          <section className="content-glass-section p-4 md:p-5">
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
                {authenticated &&
                  locations.slice(0, 2).map((location) => (
                    <Badge key={location} variant="outline" className="max-w-[260px] truncate">
                      {location}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="mobile-card-list">
              {grouped.map((day) => (
                <div key={day.day} className="rounded-xl border border-white/70 bg-white/[0.78] p-3 shadow-sm shadow-purple-950/5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{day.label}</h3>
                      <p className="text-xs text-slate-500">
                        {interpolate(t('classes.schedulePage.dayCount'), { count: day.items.length })}
                      </p>
                    </div>
                  </div>
                  {day.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
                      {t('classes.schedulePage.noCourse')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {day.items.map((item) => (
                        <article key={item.id} className="rounded-lg border border-purple-100 bg-purple-50/75 p-3 text-xs shadow-sm">
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.85] px-2 py-1 font-semibold text-purple-700">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTimeRange(item)}
                          </div>
                          <h4 className="text-sm font-semibold leading-5 text-slate-950">{item.title}</h4>
                          {item.description && <p className="mt-1 line-clamp-3 leading-5 text-slate-600">{item.description}</p>}
                          {authenticated && item.location && (
                            <div className="mt-2 flex items-start gap-1.5 leading-5 text-slate-500">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="desktop-wide-grid overflow-x-auto">
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
                            {authenticated && item.location && (
                              <div className="mt-3 flex items-start gap-1.5 leading-5 text-slate-500">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{item.location}</span>
                              </div>
                            )}
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
          <section className="content-glass-section p-4 md:p-6">
            <h2 className="text-2xl font-semibold text-slate-950">{policy.title}</h2>
            <div
              className="prose prose-slate mt-5 max-w-none prose-headings:font-semibold prose-li:my-1 prose-p:leading-7"
              dangerouslySetInnerHTML={{ __html: policyHtml }}
            />
          </section>
        )}
      </div>
      </main>
    </div>
  );
}
