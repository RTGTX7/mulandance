'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { CourseScheduleItem, SchoolPolicy, scheduleApi } from '@/lib/api';
import { CalendarDays, MapPin } from 'lucide-react';

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const displayOrder = [1, 2, 3, 4, 5, 6, 0];

export default function SchedulePage() {
  const t = useTranslations();
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [policy, setPolicy] = useState<SchoolPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([scheduleApi.list(), scheduleApi.policy()])
      .then(([scheduleItems, policyData]) => {
        setItems(scheduleItems);
        setPolicy(policyData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '排课表加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return displayOrder.map((day) => ({
      day,
      label: weekdays[day],
      items: items
        .filter((item) => item.day_of_week === day)
        .sort((a, b) =>
          a.order_index - b.order_index ||
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time)
        ),
    }));
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
            课程排课表
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {t('classes.schedule')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            查看各班级上课时间、适合年龄基础和上课地址。具体名额以报名确认结果为准。
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">加载中...</CardContent>
          </Card>
        ) : (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {grouped.map((day) => (
              <Card key={day.day} className="rounded-lg">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-xl font-semibold text-slate-950">{day.label}</h2>
                  {day.items.length === 0 ? (
                    <p className="text-sm text-slate-500">暂无课程安排。</p>
                  ) : (
                    <div className="space-y-3">
                      {day.items.map((item) => (
                        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-950">{item.title}</h3>
                              {item.description && (
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {item.start_time} - {item.end_time}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {item.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
