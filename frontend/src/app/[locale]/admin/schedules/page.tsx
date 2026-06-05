'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  type AiDraft,
  type AiExtractItem,
  CourseScheduleItem,
  CourseScheduleItemBody,
  isAuthenticated,
  scheduleApi,
} from '@/lib/api';
import { adminContentLanguageOptions, adminUiText } from '@/lib/admin-i18n';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';
import { AiPasteFillDialog } from '@/components/admin/AiPasteFillDialog';
import { AiBulkScheduleDialog } from '@/components/admin/AiBulkScheduleDialog';

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

function parseAiWeekday(value?: string) {
  const text = (value || '').trim().toLowerCase();
  if (!text) return null;
  if (/^[0-6]$/.test(text)) return Number(text);
  const map: Record<string, number> = {
    sunday: 0,
    sun: 0,
    dimanche: 0,
    lundi: 1,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    mardi: 2,
    wednesday: 3,
    wed: 3,
    mercredi: 3,
    thursday: 4,
    thu: 4,
    jeudi: 4,
    friday: 5,
    fri: 5,
    vendredi: 5,
    saturday: 6,
    sat: 6,
    samedi: 6,
    '星期日': 0,
    '周日': 0,
    '星期天': 0,
    '周天': 0,
    '星期一': 1,
    '周一': 1,
    '星期二': 2,
    '周二': 2,
    '星期三': 3,
    '周三': 3,
    '星期四': 4,
    '周四': 4,
    '星期五': 5,
    '周五': 5,
    '星期六': 6,
    '周六': 6,
  };
  return map[text] ?? null;
}

function normalizeAiTime(value?: string) {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = Number(match[2] || '0');
  const marker = match[3]?.replace(/\./g, '');
  if (marker === 'pm' && hour < 12) hour += 12;
  if (marker === 'am' && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
  const languageOptions = adminContentLanguageOptions(locale);
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [form, setForm] = useState<CourseScheduleItemBody>(initialForm);
  const [contentLocale, setContentLocale] = useState<ContentLocale>('zh');
  const weekdays = useMemo(() => weekdayLabelsForLocale(contentLocale), [contentLocale]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);
  const aiText = useMemo(() => {
    if (locale === 'fr') {
      return {
        syncTitle: 'Synchronisation IA chinois / anglais / français',
        syncDescription: 'L’IA utilise le premier contenu renseigné et génère les trois versions. Vérifiez avant d’enregistrer.',
        empty: 'Ajoutez d’abord du contenu dans au moins une langue, puis utilisez l’IA.',
        generated: 'L’IA a généré les brouillons chinois, anglais et français.',
        applyFirst: 'Générez d’abord les brouillons IA.',
        applied: 'Les champs chinois, anglais et français ont été synchronisés. Vérifiez avant d’enregistrer.',
        applyButton: 'Synchroniser',
        generateButton: 'Préparer et traduire',
        generating: 'Génération...',
        pasteTrigger: 'Coller du texte',
        pasteTitle: 'Coller le texte du cours',
        pasteDescription: 'Collez une description, un message ou un ancien tableau. L’IA remplira les champs du cours.',
        pastePlaceholder: 'Exemple : Lundi 17:00-18:00, danse chinoise enfants, 2527 Baseline Road, 2e étage. Pour 5-7 ans.',
        bulkTrigger: 'Créer plusieurs horaires',
        bulkTitle: 'Coller plusieurs horaires',
        bulkDescription: 'Vous pouvez écrire plusieurs lignes ou une plage comme lundi à vendredi. L’IA créera plusieurs cours.',
        bulkPlaceholder: 'Exemple :\nLundi à vendredi 17:00-18:00 danse chinoise enfants, 2527 Baseline Road, 2e étage.\nSamedi 10:00-11:30 danse chinoise ados, même lieu.',
        cancel: 'Annuler',
        pasteSubmit: 'Remplir',
        bulkSubmit: 'Générer et créer',
      };
    }
    if (locale === 'en') {
      return {
        syncTitle: 'AI Chinese / English / French sync',
        syncDescription: 'AI uses the first language that has content and generates all three versions. Review before saving.',
        empty: 'Add content in at least one language before using AI polish and translation.',
        generated: 'AI generated Chinese, English, and French drafts.',
        applyFirst: 'Generate AI drafts first.',
        applied: 'Chinese, English, and French fields were synced. Please review before saving.',
        applyButton: 'Sync languages',
        generateButton: 'Polish and translate',
        generating: 'Generating...',
        pasteTrigger: 'Paste text to fill',
        pasteTitle: 'Paste class text',
        pasteDescription: 'Paste a class description, message, or old table text. AI will fill the schedule fields.',
        pastePlaceholder: 'Example: Monday 5:00-6:00pm beginner Chinese dance, 2527 Baseline Road, 2nd floor. For ages 5-7.',
        bulkTrigger: 'Bulk create schedules',
        bulkTitle: 'Paste multiple schedules',
        bulkDescription: 'You can write multiple lines or a range like Monday to Friday. AI will create multiple classes.',
        bulkPlaceholder: 'Example:\nMonday to Friday 5:00-6:00pm beginner Chinese dance, 2527 Baseline Road, 2nd floor.\nSaturday 10:00-11:30am teen Chinese dance, same location.',
        cancel: 'Cancel',
        pasteSubmit: 'Fill form',
        bulkSubmit: 'Generate and create',
      };
    }
    return {
      syncTitle: 'AI 中英法同步',
      syncDescription: 'AI 会使用第一个已填写的语言内容，并生成中文、英文、法语版本。检查后再保存。',
      empty: '请先在任意语言里填写一些内容，再使用 AI 整理和翻译。',
      generated: 'AI 已生成中英法草稿。',
      applyFirst: '请先生成 AI 草稿。',
      applied: '已同步到中英法字段，请检查后保存。',
      applyButton: '语言同步',
      generateButton: '整理并翻译',
      generating: '生成中...',
      pasteTrigger: '粘贴文字 AI 填表',
      pasteTitle: '粘贴课程文字',
      pasteDescription: '把课程介绍、微信文字、旧表格内容直接粘贴进来，AI 会拆成课程名、时间、地点和中英法内容。',
      pastePlaceholder: '例：周一 5:00-6:00pm 少儿中国舞启蒙，2527 Baseline Road 二楼。适合 5-7 岁，训练基础身韵、软开和节奏感。',
      bulkTrigger: '批量粘贴生成排课',
      bulkTitle: '批量粘贴排课',
      bulkDescription: '可以写多行，也可以写“周一到周五 5-6 点”。AI 会拆成多条课程并直接创建。',
      bulkPlaceholder: '例：\n周一到周五 5:00-6:00pm 少儿中国舞启蒙，2527 Baseline Road 二楼，适合 5-7 岁。\n周六 10:00-11:30am 青少年中国舞提高班，同一地点。',
      cancel: '取消',
      pasteSubmit: 'AI 填入',
      bulkSubmit: '生成并创建',
    };
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

  function localizedItemField(item: CourseScheduleItem, key: 'title' | 'description' | 'location') {
    if (contentLocale === 'zh') return String(item[key] ?? '');
    return item.translations?.[contentLocale]?.[key] || String(item[key] ?? '');
  }

  function localizedItemTitle(item: CourseScheduleItem) {
    return localizedItemField(item, 'title') || item.title;
  }

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

  const aiSyncSource = useMemo(() => {
    const locales: ContentLocale[] = [contentLocale, 'zh', 'en', 'fr'];
    const uniqueLocales = locales.filter((value, index) => locales.indexOf(value) === index);
    for (const localeKey of uniqueLocales) {
      const fieldForLocale = (key: keyof CourseScheduleItemBody) => {
        if (localeKey === 'zh') return String(form[key] ?? '');
        return form.translations?.[localeKey]?.[String(key)] ?? '';
      };
      const fields = {
        title: fieldForLocale('title'),
        description: fieldForLocale('description'),
        location: fieldForLocale('location'),
      };
      if (Object.values(fields).some((value) => value.trim())) {
        return { locale: localeKey, fields };
      }
    }
    return {
      locale: contentLocale,
      fields: { title: '', description: '', location: '' },
    };
  }, [contentLocale, form]);

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
          const parsedDay = parseAiWeekday(fields.day_of_week);
          if (parsedDay !== null) next.day_of_week = parsedDay;
          const startTime = normalizeAiTime(fields.start_time);
          const endTime = normalizeAiTime(fields.end_time);
          if (startTime) next.start_time = startTime;
          if (endTime) next.end_time = endTime;
          if (fields.order_index && !Number.isNaN(Number(fields.order_index))) {
            next.order_index = Number(fields.order_index);
          }
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

  function scheduleBodyFromAiDrafts(drafts: AiDraft[], index: number): CourseScheduleItemBody | null {
    const zhDraft = drafts.find((draft) => draft.locale === 'zh') || drafts[0];
    const fields = zhDraft?.fields || {};
    const day = parseAiWeekday(fields.day_of_week);
    const startTime = normalizeAiTime(fields.start_time);
    const endTime = normalizeAiTime(fields.end_time);
    const title = fields.title?.trim();
    const location = fields.location?.trim() || initialForm.location;
    if (!title || day === null || !startTime || !endTime) return null;

    const translations: CourseScheduleItemBody['translations'] = {};
    drafts.forEach((draft) => {
      if (draft.locale === 'zh') return;
      const localeKey = draft.locale as ContentLocale;
      const draftFields = draft.fields || {};
      translations[localeKey] = {
        ...(draftFields.title ? { title: draftFields.title } : {}),
        ...(draftFields.description ? { description: draftFields.description } : {}),
        ...(draftFields.location ? { location: draftFields.location } : {}),
      };
    });

    return {
      day_of_week: day,
      title,
      start_time: startTime,
      end_time: endTime,
      description: fields.description || '',
      location,
      is_active: true,
      order_index: Number(fields.order_index) || (index + 1) * 10,
      translations,
    };
  }

  async function createAiScheduleItems(aiItems: AiExtractItem[]) {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const bodies = aiItems
        .map((item, index) => scheduleBodyFromAiDrafts(item.drafts, index))
        .filter((body): body is CourseScheduleItemBody => Boolean(body));
      if (bodies.length === 0) {
        throw new Error('AI 没有识别出完整排课，请确认文字里有课程名、星期和开始/结束时间。');
      }
      for (const body of bodies) {
        await scheduleApi.create(body);
      }
      setMessage(`已创建 ${bodies.length} 条排课，请检查后调整。`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
      throw err;
    } finally {
      setSaving(false);
    }
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
    if (!window.confirm(text.deleteConfirm.replace('{title}', localizedItemTitle(item)))) return;
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
                  sourceLocale={aiSyncSource.locale}
                  uiLocale={locale}
                  fields={aiSyncSource.fields}
                  onApply={applyAiDrafts}
                  title={aiText.syncTitle}
                  description={aiText.syncDescription}
                  labels={{
                    empty: aiText.empty,
                    generated: aiText.generated,
                    applyFirst: aiText.applyFirst,
                    applied: aiText.applied,
                    applyButton: aiText.applyButton,
                    generateButton: aiText.generateButton,
                    generating: aiText.generating,
                  }}
                />
              </div>
              <div className="md:col-span-6">
                <div className="flex flex-wrap gap-2">
                  <AiPasteFillDialog
                    module="schedules"
                    sourceLocale={contentLocale}
                    uiLocale={locale}
                    targetFields={['title', 'description', 'location', 'day_of_week', 'start_time', 'end_time']}
                    onApply={applyAiDrafts}
                    triggerLabel={aiText.pasteTrigger}
                    title={aiText.pasteTitle}
                    description={aiText.pasteDescription}
                    placeholder={aiText.pastePlaceholder}
                    instruction="Extract one class schedule item. If a time range is present, split it into start_time and end_time."
                    labels={{
                      empty: aiText.empty,
                      cancel: aiText.cancel,
                      submit: aiText.pasteSubmit,
                    }}
                  />
                  <AiBulkScheduleDialog
                    sourceLocale={contentLocale}
                    onCreateItems={createAiScheduleItems}
                    labels={{
                      trigger: aiText.bulkTrigger,
                      title: aiText.bulkTitle,
                      description: aiText.bulkDescription,
                      placeholder: aiText.bulkPlaceholder,
                      empty: aiText.empty,
                      cancel: aiText.cancel,
                      submit: aiText.bulkSubmit,
                    }}
                  />
                </div>
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
                ) : day.items.map((item) => {
                  const itemTitle = localizedItemTitle(item);
                  const itemLocation = localizedItemField(item, 'location');
                  const itemDescription = localizedItemField(item, 'description');
                  return (
                  <div key={item.id} className={`rounded-md border p-3 ${item.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-semibold">{itemTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.start_time} - {item.end_time} / {itemLocation}
                        </div>
                        {itemDescription && <div className="mt-1 text-sm text-muted-foreground">{itemDescription}</div>}
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
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </section>

      </main>
    </div>
  );
}
