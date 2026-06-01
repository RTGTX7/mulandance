'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { aiApi, isAuthenticated, performanceApi, type AiDraft, type PerformanceBody, type PerformanceItem } from '@/lib/api';
import { adminContentLanguageOptions, contentLocaleFromPath } from '@/lib/admin-i18n';
import { useTranslations } from '@/components/ui/i18n-client';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { CheckCircle2, Save, Sparkles, Trash2, Wand2 } from 'lucide-react';

type ContentLocale = 'zh' | 'en' | 'fr';

interface FormState {
  title: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  venue: string;
  cover_image: string;
  is_current: boolean;
  translations?: PerformanceBody['translations'];
}

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

function formFromPerformance(item: PerformanceItem): FormState {
  return {
    title: item.title,
    slug: item.slug,
    description: item.description || '',
    start: item.start_date.slice(0, 16),
    end: item.end_date.slice(0, 16),
    venue: item.venue || '',
    cover_image: item.cover_image || '',
    is_current: item.is_current,
    translations: item.translations || {},
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
    translations: form.translations,
  };
}

export function PerformanceEditor({ editId }: { editId?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const languageOptions = adminContentLanguageOptions(locale);
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    start: toDateTimeInput(new Date()),
    end: toDateTimeInput(new Date(), '21:00'),
  }));
  const [contentLocale, setContentLocale] = useState<ContentLocale>(() => contentLocaleFromPath(locale));
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);

  useEffect(() => {
    setContentLocale(contentLocaleFromPath(locale));
  }, [locale]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    if (!editId) return;

    performanceApi.get(editId)
      .then((item) => setForm(formFromPerformance(item)))
      .catch((err) => setError(err instanceof Error ? err.message : t('admin.performances.loadFailed')))
      .finally(() => setLoading(false));
  }, [editId, locale, router, t]);

  const handleTitleChange = (title: string) => {
    setLocalizedField('title', title);
  };

  function localizedField(key: 'title' | 'description' | 'venue') {
    if (contentLocale === 'zh') return form[key] || '';
    return form.translations?.[contentLocale]?.[key] || '';
  }

  function setLocalizedField(key: 'title' | 'description' | 'venue', value: string) {
    if (contentLocale === 'zh') {
      setForm((prev) => ({
        ...prev,
        [key]: value,
        slug: key === 'title' && !editId ? slugify(value) : prev.slug,
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      title: key === 'title' && !prev.title ? value : prev.title,
      slug: key === 'title' && !prev.slug ? slugify(value) : prev.slug,
      translations: {
        ...(prev.translations || {}),
        [contentLocale]: {
          ...(prev.translations?.[contentLocale] || {}),
          [key]: value,
        },
      },
    }));
  }

  function applyAiDrafts(drafts: AiDraft[]) {
    if (drafts.length === 0) return;
    setForm((prev) => {
      const next: FormState = {
        ...prev,
        translations: { ...(prev.translations || {}) },
      };

      drafts.forEach((draft) => {
        const fields = draft.fields || {};
        if (draft.locale === 'zh') {
          next.title = fields.title ?? next.title;
          next.description = fields.description ?? next.description;
          next.venue = fields.venue ?? next.venue;
          if (!editId && !next.slug && next.title) {
            next.slug = slugify(next.title);
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
            ...(fields.venue ? { venue: fields.venue } : {}),
          },
        };
        if (!next.title && fields.title) next.title = fields.title;
        if (!editId && !next.slug && fields.title) next.slug = slugify(fields.title);
      });

      return next;
    });
    setAiMessage(`已应用 ${drafts.map((draft) => draft.locale.toUpperCase()).join(', ')} 内容。`);
  }

  async function handleAiFillAllLanguages() {
    const fields = {
      title: localizedField('title'),
      description: localizedField('description'),
      venue: localizedField('venue'),
    };
    if (!fields.title.trim() && !fields.description.trim()) {
      setAiMessage('请先填写一个语言的标题或描述。');
      return;
    }

    const targets = (['zh', 'en', 'fr'] as ContentLocale[]).filter((item) => item !== contentLocale);
    setAiLoading(true);
    setAiMessage('');
    try {
      const result = await aiApi.translate({
        module: 'performances',
        source_locale: contentLocale,
        target_locales: targets,
        fields,
      });
      const sourceDraft: AiDraft = { locale: contentLocale, fields, warnings: [] };
      const allDrafts = [sourceDraft, ...(result.drafts || [])];
      setAiDrafts(allDrafts);
      applyAiDrafts(allDrafts);
      setAiMessage(result.warnings?.length ? result.warnings.join('；') : 'AI 已生成并应用中英法内容，检查后保存。');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      setAiMessage(message);
    } finally {
      setAiLoading(false);
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await performanceApi.update(editId, bodyFromForm(form));
      } else {
        await performanceApi.create(bodyFromForm(form));
      }
      router.push(`/${locale}/admin/performances/list`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editId || !window.confirm(t('admin.performances.deleteConfirm').replace('{title}', form.title))) return;
    setSaving(true);
    setError('');
    try {
      await performanceApi.remove(editId);
      router.push(`/${locale}/admin/performances/list`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">{t('admin.common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editId ? t('admin.performances.editTitle') : t('admin.performances.addTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {editId ? t('admin.performances.editorSubtitleEdit') : t('admin.performances.editorSubtitleNew')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BackButton fallbackRoute={`/${locale}/admin/performances/list`} className="shrink-0 px-2" />
            {editId && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t('admin.common.delete')}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="flex flex-wrap gap-2">
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

              <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-950">
                      <Sparkles className="h-4 w-4 text-purple-700" />
                      AI 中英法填充
                    </div>
                    <p className="mt-1 text-xs text-purple-900/70">
                      先填写任意一个语言，AI 会生成并应用中文、英文、法语字段，检查后再保存。
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={handleAiFillAllLanguages} disabled={aiLoading}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {aiLoading ? '生成中...' : '生成中英法'}
                  </Button>
                </div>
                {aiMessage && (
                  <div className="mt-3 rounded-md border border-purple-100 bg-white/70 px-3 py-2 text-sm text-purple-950">
                    {aiMessage}
                  </div>
                )}
                {aiDrafts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-purple-900">
                    {aiDrafts.map((draft) => (
                      <span key={draft.locale} className="rounded-full border border-purple-200 bg-white px-2 py-1">
                        {draft.locale.toUpperCase()} ready
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.title')}</label>
                <Input value={localizedField('title')} onChange={(e) => handleTitleChange(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.slug')}</label>
                <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.description')}</label>
                <Textarea value={localizedField('description')} onChange={(e) => setLocalizedField('description', e.target.value)} rows={8} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Input value={localizedField('venue')} onChange={(e) => setLocalizedField('venue', e.target.value)} />
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {editId ? <Save className="h-4 w-4 mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  {editId ? t('admin.performances.save') : t('admin.performances.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
