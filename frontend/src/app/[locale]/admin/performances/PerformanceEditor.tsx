'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { aiApi, isAuthenticated, newsApi, performanceApi, type AiDraft, type NewsArticle, type PerformanceBody, type PerformanceItem } from '@/lib/api';
import { adminContentLanguageOptions } from '@/lib/admin-i18n';
import { useTranslations } from '@/components/ui/i18n-client';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { CheckCircle2, FileText, Plus, Save, Sparkles, Trash2, Wand2, X } from 'lucide-react';

type ContentLocale = 'zh' | 'en' | 'fr';
const CONTENT_LOCALES: ContentLocale[] = ['zh', 'en', 'fr'];

interface FormState {
  title: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  venue: string;
  cover_image: string;
  is_current: boolean;
  related_article_ids: string[];
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
  related_article_ids: [],
};

const performanceAiText = {
  zh: {
    title: 'AI \u4e2d\u82f1\u6cd5\u586b\u5145',
    description: '\u5efa\u8bae\u5148\u586b\u5199\u4e2d\u6587\u4e3b\u5185\u5bb9\uff0c\u518d\u7528 AI \u751f\u6210 English / Francais\uff0c\u6216\u624b\u52a8\u5207\u6362\u8bed\u8a00\u8865\u9f50\u5b57\u6bb5\uff0c\u68c0\u67e5\u540e\u518d\u4fdd\u5b58\u3002',
    generating: '\u751f\u6210\u4e2d...',
    generate: '\u751f\u6210\u4e2d\u82f1\u6cd5',
    empty: '\u8bf7\u5148\u586b\u5199\u4e00\u4e2a\u8bed\u8a00\u7684\u6807\u9898\u6216\u63cf\u8ff0\u3002',
    applied: (locales: string) => `\u5df2\u5e94\u7528 ${locales} \u5185\u5bb9\u3002`,
    generated: 'AI \u5df2\u751f\u6210\u5e76\u5e94\u7528\u4e2d\u82f1\u6cd5\u5185\u5bb9\uff0c\u68c0\u67e5\u540e\u4fdd\u5b58\u3002',
    failed: 'AI \u751f\u6210\u5931\u8d25',
    ready: 'ready',
  },
  en: {
    title: 'AI Chinese / English / French fill',
    description: 'Fill one language first, then use AI to generate the other language versions, or switch languages manually and review before saving.',
    generating: 'Generating...',
    generate: 'Generate languages',
    empty: 'Add a title or description in one language first.',
    applied: (locales: string) => `Applied ${locales} content.`,
    generated: 'AI generated and applied Chinese, English, and French content. Review before saving.',
    failed: 'AI generation failed',
    ready: 'ready',
  },
  fr: {
    title: 'Remplissage IA chinois / anglais / francais',
    description: 'Remplissez d abord une langue, puis utilisez IA pour generer les autres versions, ou changez de langue manuellement et verifiez avant d enregistrer.',
    generating: 'Generation...',
    generate: 'Generer les langues',
    empty: 'Ajoutez d abord un titre ou une description dans une langue.',
    applied: (locales: string) => `Contenu ${locales} applique.`,
    generated: 'IA a genere et applique les contenus chinois, anglais et francais. Verifiez avant d enregistrer.',
    failed: 'Echec de la generation IA',
    ready: 'pret',
  },
} as const;

const relatedArticleText = {
  zh: {
    title: '\u5173\u8054\u65b0\u95fb\u6587\u7ae0',
    description: '\u628a\u901a\u77e5\u3001\u62a5\u9053\u3001\u56de\u987e\u548c\u83b7\u5956\u65b0\u95fb\u7ed1\u5230\u8fd9\u4e2a\u6f14\u51fa\u3002\u524d\u53f0\u6f14\u51fa\u8be6\u60c5\u9875\u4f1a\u663e\u793a\u8fd9\u4e9b\u6587\u7ae0\u3002',
    search: '\u641c\u7d22\u6587\u7ae0\u6807\u9898\u6216\u6458\u8981',
    selected: '\u5df2\u5173\u8054',
    empty: '\u8fd8\u6ca1\u6709\u5173\u8054\u6587\u7ae0\u3002',
    add: '\u6dfb\u52a0',
  },
  en: {
    title: 'Related News Articles',
    description: 'Link notices, reports, recaps, and award news to this performance. They will appear on the performance detail page.',
    search: 'Search article title or summary',
    selected: 'Linked',
    empty: 'No related articles yet.',
    add: 'Add',
  },
  fr: {
    title: 'Articles lies',
    description: 'Associez annonces, reportages, retours et nouvelles de prix a ce spectacle. Ils apparaitront sur la page detaillee.',
    search: 'Rechercher par titre ou resume',
    selected: 'Associes',
    empty: 'Aucun article lie pour le moment.',
    add: 'Ajouter',
  },
} as const;

function pageLocale(locale: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

function normalizeTranslations(value?: PerformanceBody['translations']) {
  return CONTENT_LOCALES.reduce<NonNullable<PerformanceBody['translations']>>((acc, locale) => {
    acc[locale] = { ...(value?.[locale] || {}) };
    return acc;
  }, {});
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateTimeInput(date: Date, hour = '19:00') {
  return `${toDateInput(date)}T${hour}`;
}

function toLocalDateTimeInput(value?: string) {
  if (!value) return '';
  const text = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(text);
  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    return text.slice(0, 16);
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 16);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${toDateInput(date)}T${hours}:${minutes}`;
}

function localDateTimeForApi(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || `performance-${Date.now()}`;
}

function formFromPerformance(item: PerformanceItem): FormState {
  return {
    title: item.title,
    slug: item.slug,
    description: item.description || '',
    start: toLocalDateTimeInput(item.start_date),
    end: toLocalDateTimeInput(item.end_date),
    venue: item.venue || '',
    cover_image: item.cover_image || '',
    is_current: item.is_current,
    related_article_ids: item.related_article_ids || [],
    translations: normalizeTranslations(item.translations),
  };
}

function bodyFromForm(form: FormState): PerformanceBody {
  const translations = normalizeTranslations(form.translations);
  return {
    title: form.title,
    slug: form.slug || slugify(form.title),
    description: form.description,
    start_date: localDateTimeForApi(form.start),
    end_date: localDateTimeForApi(form.end || form.start),
    venue: form.venue,
    cover_image: form.cover_image,
    is_current: form.is_current,
    related_article_ids: form.related_article_ids,
    translations,
  };
}

export function PerformanceEditor({ editId }: { editId?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const aiText = performanceAiText[pageLocale(locale)];
  const relatedText = relatedArticleText[pageLocale(locale)];
  const languageOptions = adminContentLanguageOptions(locale);
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    start: toDateTimeInput(new Date()),
    end: toDateTimeInput(new Date(), '21:00'),
  }));
  const [contentLocale, setContentLocale] = useState<ContentLocale>('zh');
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [articleSearch, setArticleSearch] = useState('');
  const loadedEditIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    if (!editId) {
      loadedEditIdRef.current = null;
      setLoading(false);
      return;
    }

    if (loadedEditIdRef.current === editId) return;

    let cancelled = false;
    setLoading(true);

    performanceApi.get(editId)
      .then((item) => {
        if (cancelled) return;
        setForm(formFromPerformance(item));
        loadedEditIdRef.current = editId;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load performance');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId, locale, router]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    newsApi.adminList({ limit: 200 })
      .then(setArticles)
      .catch(() => setArticles([]));
  }, []);

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
        translations: normalizeTranslations(prev.translations),
        slug: key === 'title' && !editId && (!prev.slug || prev.slug.startsWith('performance-')) ? slugify(value) : prev.slug,
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      title: key === 'title' && !prev.title ? value : prev.title,
      slug: key === 'title' && !prev.slug ? slugify(value) : prev.slug,
      translations: {
        ...normalizeTranslations(prev.translations),
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
        translations: normalizeTranslations(prev.translations),
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
    setAiMessage(aiText.applied(drafts.map((draft) => draft.locale.toUpperCase()).join(', ')));
  }

  const relatedArticles = form.related_article_ids
    .map((id) => articles.find((article) => article.id === id || article.group_id === id))
    .filter((article): article is NewsArticle => Boolean(article));
  const selectedArticleKeys = new Set(
    form.related_article_ids.flatMap((id) => {
      const article = articles.find((item) => item.id === id || item.group_id === id);
      return article ? [article.id, article.group_id || ''] : [id];
    }).filter(Boolean)
  );
  const articleSuggestions = articles
    .filter((article) => {
      const key = article.group_id || article.id;
      if (selectedArticleKeys.has(article.id) || selectedArticleKeys.has(key)) return false;
      const search = articleSearch.trim().toLowerCase();
      if (!search) return true;
      return `${article.title} ${article.summary || ''} ${article.slug}`.toLowerCase().includes(search);
    })
    .slice(0, 8);

  function addRelatedArticle(article: NewsArticle) {
    const articleId = article.group_id || article.id;
    setForm((prev) => ({
      ...prev,
      related_article_ids: prev.related_article_ids.includes(articleId)
        ? prev.related_article_ids
        : [...prev.related_article_ids, articleId],
    }));
    setArticleSearch('');
  }

  function removeRelatedArticle(articleId: string) {
    setForm((prev) => ({
      ...prev,
      related_article_ids: prev.related_article_ids.filter((id) => id !== articleId),
    }));
  }

  async function handleAiFillAllLanguages() {
    const fields = {
      title: localizedField('title'),
      description: localizedField('description'),
      venue: localizedField('venue'),
    };
    if (!fields.title.trim() && !fields.description.trim()) {
      setAiMessage(aiText.empty);
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
      setAiMessage(result.warnings?.length ? result.warnings.join('; ') : aiText.generated);
    } catch (err) {
      const message = err instanceof Error ? err.message : aiText.failed;
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
        router.push(`/${locale}/admin/performances/list`);
      } else {
        const created = await performanceApi.create(bodyFromForm(form));
        router.push(`/${locale}/admin/performances/editor/${created.id}`);
      }
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
                      {aiText.title}
                    </div>
                    <p className="mt-1 text-xs text-purple-900/70">
                      {aiText.description}
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={handleAiFillAllLanguages} disabled={aiLoading}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {aiLoading ? aiText.generating : aiText.generate}
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
                        {draft.locale.toUpperCase()} {aiText.ready}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('admin.performances.fields.title')}</label>
                <Input value={localizedField('title')} onChange={(e) => handleTitleChange(e.target.value)} required={contentLocale === 'zh'} />
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

              <div className="rounded-xl border bg-slate-50/70 p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-purple-700" />
                    {relatedText.title}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{relatedText.description}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Input
                      value={articleSearch}
                      onChange={(event) => setArticleSearch(event.target.value)}
                      placeholder={relatedText.search}
                    />
                    {articleSuggestions.length > 0 && (
                      <div className="mt-2 max-h-64 overflow-auto rounded-md border bg-white">
                        {articleSuggestions.map((article) => (
                          <button
                            key={`${article.id}-${article.locale}`}
                            type="button"
                            onClick={() => addRelatedArticle(article)}
                            className="flex w-full items-start justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-purple-50"
                          >
                            <span className="min-w-0">
                              <span className="line-clamp-1 font-medium text-slate-900">{article.title}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {article.locale.toUpperCase()} · {article.slug}
                              </span>
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-purple-700">
                              <Plus className="h-3.5 w-3.5" />
                              {relatedText.add}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-muted-foreground">{relatedText.selected}</div>
                    {relatedArticles.length === 0 ? (
                      <p className="rounded-md border border-dashed bg-white px-3 py-2 text-sm text-muted-foreground">{relatedText.empty}</p>
                    ) : (
                      <div className="space-y-2">
                        {relatedArticles.map((article) => {
                          const articleId = article.group_id || article.id;
                          return (
                            <div key={articleId} className="flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2 text-sm">
                              <div className="min-w-0">
                                <div className="line-clamp-1 font-medium text-slate-900">{article.title}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">{article.locale.toUpperCase()} · {article.slug}</div>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeRelatedArticle(articleId)} className="h-8 px-2">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
