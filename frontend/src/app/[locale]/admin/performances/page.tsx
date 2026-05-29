'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, performanceApi, type PerformanceItem } from '@/lib/api';
import { useTranslations } from '@/components/ui/i18n-client';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock, ListChecks, Plus } from 'lucide-react';
import { dateLocaleFor } from '@/lib/i18n';

type ListMode = 'date' | 'recent';

export default function AdminPerformancesPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [listMode, setListMode] = useState<ListMode>('date');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    performanceApi.list()
      .then(setPerformances)
      .catch(() => setPerformances([]))
      .finally(() => setLoading(false));
  }, [locale, router]);

  const now = Date.now();
  const homepageCount = performances.filter((item) => item.is_current).length;
  const upcomingCount = performances.filter((item) => new Date(item.start_date).getTime() >= now).length;
  const pastCount = performances.filter((item) => new Date(item.end_date).getTime() < now).length;
  const selectedPerformances = performances.filter((item) => {
    const date = new Date(item.start_date);
    return date.getFullYear() === selectedDate.getFullYear()
      && date.getMonth() === selectedDate.getMonth()
      && date.getDate() === selectedDate.getDate();
  });
  const recent = useMemo(() => {
    return [...performances]
      .sort((a, b) => {
        const aTime = Math.abs(new Date(a.start_date).getTime() - now);
        const bTime = Math.abs(new Date(b.start_date).getTime() - now);
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [now, performances]);
  const displayedPerformances = listMode === 'date' ? selectedPerformances : recent;
  const selectedDateLabel = selectedDate.toLocaleDateString(dateLocaleFor(locale), {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.performances.dashboardTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('admin.performances.dashboardSubtitle')}</p>
          </div>
          <Button onClick={() => router.push(`/${locale}/admin/performances/editor`)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('admin.performances.newPerformance')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary/50" onClick={() => router.push(`/${locale}/admin/performances/list`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                {t('admin.performances.totalPerformances')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : performances.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-emerald-400" onClick={() => router.push(`/${locale}/admin/performances/list?filter=homepage`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t('admin.performances.homepage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{loading ? '...' : homepageCount}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-purple-400" onClick={() => router.push(`/${locale}/admin/performances/list?filter=upcoming`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {t('admin.performances.upcoming')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{loading ? '...' : upcomingCount}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-amber-400" onClick={() => router.push(`/${locale}/admin/performances/list?filter=past`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('admin.performances.past')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{loading ? '...' : pastCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {t('admin.performances.calendarTitle')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[150px] text-center text-sm font-medium">
                {month.toLocaleDateString(dateLocaleFor(locale), { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
              {[
                t('admin.performances.weekdays.sun'),
                t('admin.performances.weekdays.mon'),
                t('admin.performances.weekdays.tue'),
                t('admin.performances.weekdays.wed'),
                t('admin.performances.weekdays.thu'),
                t('admin.performances.weekdays.fri'),
                t('admin.performances.weekdays.sat'),
              ].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const active = date.getFullYear() === selectedDate.getFullYear()
                  && date.getMonth() === selectedDate.getMonth()
                  && date.getDate() === selectedDate.getDate();
                const inMonth = date.getMonth() === month.getMonth();
                const hasItems = performances.some((item) => {
                  const d = new Date(item.start_date);
                  return d.getFullYear() === date.getFullYear()
                    && d.getMonth() === date.getMonth()
                    && d.getDate() === date.getDate();
                });

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setListMode('date');
                    }}
                    className={`min-h-[84px] rounded-md border p-2 text-left transition-colors ${
                      active
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/40'
                    } ${inMonth ? '' : 'opacity-45'}`}
                  >
                    <span className="text-sm font-medium">{date.getDate()}</span>
                    {hasItems && (
                      <div className="mt-2 h-2 rounded-full bg-purple-200" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{listMode === 'date' ? selectedDateLabel : t('admin.performances.recentPerformances')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {listMode === 'date'
                  ? t('admin.performances.selectedCount').replace('{count}', String(displayedPerformances.length))
                  : t('admin.performances.totalCount').replace('{count}', String(displayedPerformances.length))}
              </p>
            </div>
            <div className="inline-flex rounded-md border bg-white p-1">
              <Button
                type="button"
                size="sm"
                variant={listMode === 'date' ? 'default' : 'ghost'}
                onClick={() => setListMode('date')}
                className="h-8"
              >
                {t('admin.performances.selectedDate')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={listMode === 'recent' ? 'default' : 'ghost'}
                onClick={() => setListMode('recent')}
                className="h-8"
              >
                {t('admin.performances.recentPerformances')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('admin.common.loading')}</p>
            ) : displayedPerformances.length === 0 ? (
              <p className="text-muted-foreground">
                {listMode === 'date' ? t('admin.performances.emptySelected') : t('admin.performances.emptyAll')}
              </p>
            ) : (
              <div className="space-y-2">
                {displayedPerformances.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/${locale}/admin/performances/editor/${item.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border bg-white px-4 py-3 text-left hover:border-primary/50"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.start_date).toLocaleDateString(dateLocaleFor(locale))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
