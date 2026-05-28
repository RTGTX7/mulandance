'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAuthenticated, performanceApi, type PerformanceBody, type PerformanceItem } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';

interface FormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  venue: string;
  cover_image: string;
  is_current: boolean;
}

type ListMode = 'selected' | 'all';

const emptyForm: FormState = {
  title: '',
  slug: '',
  description: '',
  start: '',
  end: '',
  venue: '',
  cover_image: '',
  is_current: true,
};

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateTimeInput(date: Date, hour = '19:00') {
  return `${toDateInput(date)}T${hour}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formFromPerformance(item: PerformanceItem): FormState {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description || '',
    start: item.start_date.slice(0, 16),
    end: item.end_date.slice(0, 16),
    venue: item.venue || '',
    cover_image: item.cover_image || '',
    is_current: item.is_current,
  };
}

function bodyFromForm(form: FormState): PerformanceBody {
  return {
    title: form.title,
    slug: form.slug || slugify(form.title),
    description: form.description,
    start_date: new Date(form.start).toISOString(),
    end_date: new Date(form.end || form.start).toISOString(),
    venue: form.venue,
    cover_image: form.cover_image,
    is_current: form.is_current,
  };
}

export default function AdminPerformancesPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [listMode, setListMode] = useState<ListMode>('selected');
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    start: toDateTimeInput(new Date()),
    end: toDateTimeInput(new Date(), '21:00'),
  }));

  const loadPerformances = async () => {
    setLoading(true);
    try {
      const data = await performanceApi.list();
      setPerformances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadPerformances();
  }, [router, locale]);

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

  const selectedPerformances = performances.filter((item) => sameDay(new Date(item.start_date), selectedDate));
  const displayedPerformances = listMode === 'all' ? performances : selectedPerformances;

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setForm({
      ...emptyForm,
      start: toDateTimeInput(date),
      end: toDateTimeInput(date, '21:00'),
    });
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.id ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      if (form.id) {
        const updated = await performanceApi.update(form.id, bodyFromForm(form));
        setPerformances((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await performanceApi.create(bodyFromForm(form));
        setPerformances((prev) => [...prev, created].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
      }
      setForm({
        ...emptyForm,
        start: toDateTimeInput(selectedDate),
        end: toDateTimeInput(selectedDate, '21:00'),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.saveFailed'));
    }
  };

  const handleDelete = async (item: PerformanceItem) => {
    if (!window.confirm(t('admin.performances.deleteConfirm').replace('{title}', item.title))) return;
    setError('');
    try {
      await performanceApi.remove(item.id);
      setPerformances((prev) => prev.filter((performance) => performance.id !== item.id));
      if (form.id === item.id) {
        setForm({
          ...emptyForm,
          start: toDateTimeInput(selectedDate),
          end: toDateTimeInput(selectedDate, '21:00'),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.deleteFailed'));
    }
  };

  const monthLabel = month.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {t('admin.performances.calendarTitle')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[150px] text-center text-sm font-medium">{monthLabel}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                >
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
                  const dateEvents = performances.filter((item) => sameDay(new Date(item.start_date), date));
                  const active = sameDay(date, selectedDate);
                  const inMonth = date.getMonth() === month.getMonth();

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => selectDate(date)}
                      className={`min-h-[86px] rounded-md border p-2 text-left transition-colors ${
                        active
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/40'
                      } ${inMonth ? '' : 'opacity-45'}`}
                    >
                      <span className="text-sm font-medium">{date.getDate()}</span>
                      <div className="mt-2 space-y-1">
                        {dateEvents.slice(0, 2).map((event) => (
                          <div key={event.id} className="truncate rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
                            {event.title}
                          </div>
                        ))}
                        {dateEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            {t('admin.performances.moreCount').replace('{count}', String(dateEvents.length - 2))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{form.id ? t('admin.performances.editTitle') : t('admin.performances.addTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.title')}</label>
                  <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.slug')}</label>
                  <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.description')}</label>
                  <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.start')}</label>
                    <Input type="datetime-local" value={form.start} onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.end')}</label>
                    <Input type="datetime-local" value={form.end} onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.venue')}</label>
                  <Input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.coverImage')}</label>
                  <Input value={form.cover_image} onChange={(e) => setForm((prev) => ({ ...prev, cover_image: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_current}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_current: e.target.checked }))}
                  />
                  {t('admin.performances.fields.showOnHomepage')}
                </label>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {form.id ? t('admin.performances.save') : t('admin.performances.create')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({
                      ...emptyForm,
                      start: toDateTimeInput(selectedDate),
                      end: toDateTimeInput(selectedDate, '21:00'),
                    })}
                  >
                    {t('admin.performances.clear')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>
                {listMode === 'all'
                  ? t('admin.performances.allTitle')
                  : selectedDate.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {listMode === 'all'
                  ? t('admin.performances.totalCount').replace('{count}', String(displayedPerformances.length))
                  : t('admin.performances.selectedCount').replace('{count}', String(displayedPerformances.length))}
              </p>
            </div>
            <div className="inline-flex rounded-md border bg-white p-1">
              <Button
                type="button"
                size="sm"
                variant={listMode === 'selected' ? 'default' : 'ghost'}
                onClick={() => setListMode('selected')}
                className="h-8"
              >
                {t('admin.performances.selectedDate')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={listMode === 'all' ? 'default' : 'ghost'}
                onClick={() => setListMode('all')}
                className="h-8"
              >
                {t('admin.performances.all')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('admin.common.loading')}</p>
            ) : displayedPerformances.length === 0 ? (
              <p className="text-muted-foreground">
                {listMode === 'all' ? t('admin.performances.emptyAll') : t('admin.performances.emptySelected')}
              </p>
            ) : (
              <div className="space-y-2">
                {displayedPerformances.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listMode === 'all' && (
                          <>
                            {new Date(item.start_date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {' · '}
                          </>
                        )}
                        {new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {item.venue ? ` · ${item.venue}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setForm(formFromPerformance(item))}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
