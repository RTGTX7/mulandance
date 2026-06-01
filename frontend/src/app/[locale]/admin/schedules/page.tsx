'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  type AiDraft,
  CourseScheduleItem,
  CourseScheduleItemBody,
  isAuthenticated,
  scheduleApi,
} from '@/lib/api';
import { adminContentLanguageOptions, adminUiText, contentLocaleFromPath } from '@/lib/admin-i18n';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';

const displayOrder = [1, 2, 3, 4, 5, 6, 0];
type ContentLocale = 'zh' | 'en' | 'fr';

const initialForm: CourseScheduleItemBody = {
  day_of_week: 1,
  title: '',
  start_time: '17:00',
  end_time: '18:00',
  description: '',
  location: '2527 Baseline Road 二楼',
  is_active: true,
  order_index: 10,
};

function weekdayLabelsForLocale(locale: string) {
  if (locale === 'fr') return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  if (locale === 'en') return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
}

function scheduleStatusLabels(locale: string, active: boolean) {
  if (locale === 'fr') {
    return {
      label: active ? 'Publié' : 'Masqué',
      title: active ? 'Cliquer pour masquer ce cours' : 'Cliquer pour publier ce cours',
    };
  }
  if (locale === 'en') {
    return {
      label: active ? 'Published' : 'Hidden',
      title: active ? 'Click to hide this class' : 'Click to publish this class',
    };
  }
  return {
    label: active ? '已发布' : '已隐藏',
    title: active ? '点击隐藏此排课' : '点击发布此排课',
  };
}

function SchedulePublishSwitch({
  item,
  locale,
  loading,
  onChange,
}: {
  item: CourseScheduleItem;
  locale: string;
  loading: boolean;
  onChange: (item: CourseScheduleItem, nextValue: boolean) => void;
}) {
  const active = item.is_active;
  const labels = scheduleStatusLabels(locale, active);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onChange(item, !active)}
      className={`
        inline-flex h-8 min-w-[104px] items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition-all duration-200
        ${active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
        ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      aria-pressed={active}
      title={labels.title}
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span className="leading-none">{labels.label}</span>
    </button>
  );
}

export default function AdminSchedulesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh';
  const labels = adminUiText(locale);
  const text = labels.resources.schedules;
  const weekdays = useMemo(() => weekdayLabelsForLocale(locale), [locale]);
  const languageOptions = adminContentLanguageOptions(locale);
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [form, setForm] = useState<CourseScheduleItemBody>(initialForm);
  const [contentLocale, setContentLocale] = useState<ContentLocale>(() => contentLocaleFromPath(locale));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);

  useEffect(() => {
    setContentLocale(contentLocaleFromPath(locale));
  }, [locale]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadData();
  }, [router, locale]);

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
  }, [items, weekdays]);

  function loadData() {
    setLoading(true);
    setError('');
    scheduleApi
      .list({ includeInactive: true })
      .then((scheduleItems) => {
        setItems(scheduleItems);
      })
      .catch((err) => setError(err instanceof Error ? err.message : text.loadFailed))
      .finally(() => setLoading(false));
  }

  function editItem(item: CourseScheduleItem) {
    setEditingId(item.id);
    setForm({
      day_of_week: item.day_of_week,
      title: item.title,
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description || '',
      location: item.location,
      is_active: item.is_active,
      order_index: item.order_index,
      translations: item.translations || {},
    });
  }

  function localizedField(key: keyof CourseScheduleItemBody) {
    if (contentLocale === 'zh') return String(form[key] ?? '');
    return form.translations?.[contentLocale]?.[String(key)] ?? '';
  }

  function setLocalizedField(key: keyof CourseScheduleItemBody, value: string) {
    if (contentLocale === 'zh') {
      setForm((current) => ({ ...current, [key]: value }));
      return;
    }
    setForm((current) => ({
      ...current,
      title: key === 'title' && !current.title ? value : current.title,
      location: key === 'location' && !current.location ? value : current.location,
      translations: {
        ...(current.translations || {}),
        [contentLocale]: {
          ...(current.translations?.[contentLocale] || {}),
          [String(key)]: value,
        },
      },
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function applyAiDrafts(drafts: AiDraft[]) {
    setForm((current) => {
      const next = { ...current, translations: { ...(current.translations || {}) } };
      drafts.forEach((draft) => {
        const fields = draft.fields || {};
        if (draft.locale === 'zh') {
          next.title = fields.title ?? next.title;
          next.description = fields.description ?? next.description;
          next.location = fields.location ?? next.location;
          return;
        }
        const localeKey = draft.locale as ContentLocale;
        next.translations = {
          ...(next.translations || {}),
          [localeKey]: {
            ...(next.translations?.[localeKey] || {}),
            ...(fields.title ? { title: fields.title } : {}),
            ...(fields.description ? { description: fields.description } : {}),
            ...(fields.location ? { location: fields.location } : {}),
          },
        };
        if (!next.title && fields.title) next.title = fields.title;
        if (!next.location && fields.location) next.location = fields.location;
      });
      return next;
    });
  }

  async function saveScheduleItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (editingId) {
        await scheduleApi.update(editingId, form);
      } else {
        await scheduleApi.create(form);
      }
      resetForm();
      setMessage(text.saved);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: CourseScheduleItem) {
    if (!window.confirm(text.deleteConfirm.replace('{title}', item.title))) return;
    setError('');
    try {
      await scheduleApi.remove(item.id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteFailed);
    }
  }

  async function toggleScheduleStatus(item: CourseScheduleItem, nextValue: boolean) {
    setSwitchLoading(item.id);
    setError('');
    try {
      const updated = await scheduleApi.update(item.id, { is_active: nextValue });
      setItems((prev) => prev.map((scheduleItem) => scheduleItem.id === item.id ? updated : scheduleItem));
      if (editingId === item.id) {
        setForm((prev) => ({ ...prev, is_active: updated.is_active }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setSwitchLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CalendarDays className="h-6 w-6 text-primary" />
            {text.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {text.subtitle}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? text.editTitle : text.newTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveScheduleItem} className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="flex flex-wrap gap-2 md:col-span-6">
                {languageOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={contentLocale === option.value ? 'default' : 'outline'}
                    onClick={() => setContentLocale(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="md:col-span-6">
                <AiLocaleSyncPanel
                  module="schedules"
                  sourceLocale={contentLocale}
                  fields={{
                    title: localizedField('title'),
                    description: localizedField('description'),
                    location: localizedField('location'),
                  }}
                  onApply={applyAiDrafts}
                />
              </div>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.weekday}</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.day_of_week}
                  onChange={(event) => setForm((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))}
                >
                  {weekdays.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.courseName}</span>
                <Input required value={localizedField('title')} onChange={(event) => setLocalizedField('title', event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.start}</span>
                <Input type="time" required value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{text.end}</span>
                <Input type="time" required value={form.end_time} onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{labels.common.sort}</span>
                <Input type="number" value={form.order_index} onChange={(event) => setForm((prev) => ({ ...prev, order_index: Number(event.target.value) }))} />
              </label>
              <label className="space-y-1 md:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">{text.description}</span>
                <Input value={localizedField('description')} onChange={(event) => setLocalizedField('description', event.target.value)} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{text.location}</span>
                <Input required value={localizedField('location')} onChange={(event) => setLocalizedField('location', event.target.value)} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                {labels.resources.visibleOnSite}
              </label>
              <div className="md:col-span-6 flex justify-end gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>{text.cancelEdit}</Button>
                )}
                <Button type="submit" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? labels.common.saving : text.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            <Card className="lg:col-span-2 p-8 text-sm text-muted-foreground">{labels.resources.listLoading}</Card>
          ) : grouped.map((day) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="text-lg">{day.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{text.noClasses}</p>
                ) : day.items.map((item) => (
                  <div key={item.id} className={`rounded-md border p-3 ${item.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.start_time} - {item.end_time} / {item.location}
                        </div>
                        {item.description && <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <SchedulePublishSwitch
                          item={item}
                          locale={locale}
                          loading={switchLoading === item.id}
                          onChange={toggleScheduleStatus}
                        />
                        <Button size="sm" variant="outline" onClick={() => editItem(item)}>{labels.resources.edit}</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => removeItem(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

      </main>
    </div>
  );
}
