'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiBulkArticleImportDialog } from '@/components/admin/AiBulkArticleImportDialog';
import { isAuthenticated, newsApi, NewsArticleGroup, type NewsCategory, type NewsTag } from '@/lib/api';
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  Languages,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';

const requiredLocales = [
  { code: 'zh', label: '简体', name: '简体中文' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'French' },
];

const showOptions = [5, 10, 20, 50, 100];

type SortOrder = 'newest' | 'oldest';
type StatusFilter = 'all' | 'published' | 'draft' | 'missing';

const articleAdminText = {
  zh: {
    title: '文章管理',
    subtitle: '管理新闻、公告、文章和多语言版本。',
    loading: '加载文章...',
    loadFailed: '文章加载失败',
    updateFailed: '状态更新失败',
    deleteFailed: '删除失败',
    deleteConfirm: (title: string) => `删除「${title}」以及所有语言版本吗？`,
    newArticle: '新建文章',
    search: '按标题、摘要或 slug 搜索...',
    allYears: '全部年份',
    uncategorized: '未分类',
    allStatus: '全部状态',
    publishedVersions: '有已发布版本',
    draftVersions: '有草稿版本',
    missingVersions: '缺少语言版本',
    newest: '最新优先',
    oldest: '最旧优先',
    show: '显示',
    count: (visible: number, total: number) => `显示 ${visible} / 共 ${total} 篇文章`,
    versionStatus: 'EN / 中文 / FR 版本状态',
    articleCount: (count: number) => `${count} 篇`,
    emptyTitle: '没有找到文章',
    emptyBody: '调整筛选条件，或新建第一篇文章。',
    published: '已发布',
    draft: '草稿',
    missing: '缺少',
    edit: '编辑',
    preview: '预览',
    delete: '删除',
  },
  en: {
    title: 'Article Management',
    subtitle: 'Manage news, announcements, articles, and multilingual versions.',
    loading: 'Loading articles...',
    loadFailed: 'Failed to load articles',
    updateFailed: 'Failed to update status',
    deleteFailed: 'Delete failed',
    deleteConfirm: (title: string) => `Delete "${title}" and all language versions?`,
    newArticle: 'New Article',
    search: 'Search by title, summary, or slug...',
    allYears: 'All years',
    uncategorized: 'Uncategorized',
    allStatus: 'All status',
    publishedVersions: 'Has published version',
    draftVersions: 'Has draft version',
    missingVersions: 'Missing language version',
    newest: 'Newest first',
    oldest: 'Oldest first',
    show: 'Show',
    count: (visible: number, total: number) => `Showing ${visible} / ${total} articles`,
    versionStatus: 'EN / Chinese / FR version status',
    articleCount: (count: number) => `${count} articles`,
    emptyTitle: 'No articles found',
    emptyBody: 'Adjust filters or create the first article.',
    published: 'Published',
    draft: 'Draft',
    missing: 'Missing',
    edit: 'Edit',
    preview: 'Preview',
    delete: 'Delete',
  },
  fr: {
    title: 'Gestion des articles',
    subtitle: 'Gérez les nouvelles, annonces, articles et versions multilingues.',
    loading: 'Chargement des articles...',
    loadFailed: 'Impossible de charger les articles',
    updateFailed: 'Impossible de modifier le statut',
    deleteFailed: 'Échec de la suppression',
    deleteConfirm: (title: string) => `Supprimer « ${title} » et toutes ses versions linguistiques ?`,
    newArticle: 'Nouvel article',
    search: 'Rechercher par titre, résumé ou slug...',
    allYears: 'Toutes les années',
    uncategorized: 'Non classé',
    allStatus: 'Tous les statuts',
    publishedVersions: 'Version publiée',
    draftVersions: 'Version brouillon',
    missingVersions: 'Version linguistique manquante',
    newest: 'Plus récent',
    oldest: 'Plus ancien',
    show: 'Afficher',
    count: (visible: number, total: number) => `${visible} / ${total} articles affichés`,
    versionStatus: 'Statut des versions EN / chinois / FR',
    articleCount: (count: number) => `${count} articles`,
    emptyTitle: 'Aucun article trouvé',
    emptyBody: 'Ajustez les filtres ou créez le premier article.',
    published: 'Publié',
    draft: 'Brouillon',
    missing: 'Manquant',
    edit: 'Modifier',
    preview: 'Aperçu',
    delete: 'Supprimer',
  },
} as const;

function adminLocale(locale: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

function PublishSwitch({
  checked,
  onCheckedChange,
  labels,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  labels: { published: string; draft: string };
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-7 min-w-[88px] items-center gap-1.5 rounded-full border px-2 text-xs font-medium transition-colors ${
        checked
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
      </span>
      <span>{checked ? labels.published : labels.draft}</span>
    </button>
  );
}

function formatDate(value?: string, locale = 'en') {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString(dateLocaleFor(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function latestDate(group: NewsArticleGroup) {
  const dates = group.translations
    .map((item) => item.published_at || item.updated_at || item.created_at)
    .filter(Boolean)
    .map((item) => new Date(item as string).getTime());
  return dates.length ? Math.max(...dates) : 0;
}

function createdDate(group: NewsArticleGroup) {
  const dates = [group.created_at, ...group.translations.map((item) => item.created_at)]
    .filter(Boolean)
    .map((item) => new Date(item as string).getTime())
    .filter(Number.isFinite);

  return dates.length ? Math.min(...dates) : latestDate(group);
}

function createdYear(group: NewsArticleGroup) {
  const date = createdDate(group);
  return date ? String(new Date(date).getFullYear()) : 'uncategorized';
}

function primaryTranslation(group: NewsArticleGroup, uiLocale: string) {
  const contentLocale = articleLocaleFor(uiLocale);
  return (
    group.translations.find((item) => item.locale === contentLocale) ||
    group.translations.find((item) => item.locale === 'zh') ||
    group.translations.find((item) => item.locale === 'en') ||
    group.translations[0]
  );
}

export default function ArticlesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const text = articleAdminText[adminLocale(locale)];

  const [groups, setGroups] = useState<NewsArticleGroup[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [showCount, setShowCount] = useState(10);
  const [error, setError] = useState('');

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [data, categoryData, tagData] = await Promise.all([
        newsApi.adminGroups({ limit: 200 }),
        newsApi.categories(),
        newsApi.tags(),
      ]);
      setGroups(data);
      setCategories(categoryData);
      setTags(tagData);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.loadFailed);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [router, locale, text.loadFailed]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const years = useMemo(() => {
    return Array.from(new Set(groups.map((group) => createdYear(group)))).sort((a, b) => {
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      return Number(b) - Number(a);
    });
  }, [groups]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groups
      .filter((group) => {
        const translations = group.translations;
        const missingLocales = requiredLocales.filter(
          (item) => !translations.some((translation) => translation.locale === item.code)
        );

        if (query) {
          const haystack = [
            group.shared_slug,
            ...translations.map((item) => item.title),
            ...translations.map((item) => item.summary || ''),
          ].join(' ').toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        if (year !== 'all' && createdYear(group) !== year) return false;
        if (status === 'published' && !translations.some((item) => item.is_published)) return false;
        if (status === 'draft' && !translations.some((item) => !item.is_published)) return false;
        if (status === 'missing' && missingLocales.length === 0) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = latestDate(a) - latestDate(b);
        return sort === 'newest' ? -diff : diff;
      });
  }, [groups, search, year, status, sort]);

  const visibleGroups = useMemo(() => filtered.slice(0, showCount), [filtered, showCount]);

  const groupedByYear = useMemo(() => {
    const byYear = new Map<string, NewsArticleGroup[]>();
    visibleGroups.forEach((group) => {
      const key = createdYear(group);
      const list = byYear.get(key) || [];
      list.push(group);
      byYear.set(key, list);
    });

    return Array.from(byYear.entries()).sort(([a], [b]) => {
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      return Number(b) - Number(a);
    });
  }, [visibleGroups]);

  async function updatePublished(group: NewsArticleGroup, published: boolean) {
    setError('');
    try {
      await newsApi.togglePublish(group.shared_slug, published);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.updateFailed);
    }
  }

  async function deleteArticle(group: NewsArticleGroup) {
    const title = primaryTranslation(group, locale)?.title || group.shared_slug;
    if (!window.confirm(text.deleteConfirm(title))) return;
    setError('');
    try {
      await newsApi.removeArticle(group.shared_slug);
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteFailed);
    }
  }

  function editVersion(group: NewsArticleGroup, localeCode: string) {
    const translation = group.translations.find((item) => item.locale === localeCode);
    if (translation) {
      router.push(`/${locale}/admin/editor/${group.shared_slug}?locale=${localeCode}`);
      return;
    }
    router.push(`/${locale}/admin/editor?baseSlug=${group.shared_slug}&locale=${localeCode}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{text.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{text.title}</h1>
              <p className="mt-0.5 max-w-[15rem] text-xs leading-5 text-slate-500 sm:max-w-none sm:text-sm">{text.subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <BackButton fallbackRoute={`/${locale}/admin/dashboard`} className="h-9 shrink-0 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm" />
              <AiBulkArticleImportDialog locale={locale} categories={categories} tags={tags} onImported={loadGroups} />
              <Button className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm" onClick={() => router.push(`/${locale}/admin/editor`)}>
                <Plus className="mr-1.5 h-4 w-4 sm:mr-2" />
                {text.newArticle}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-5 sm:space-y-5 sm:py-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[1fr_140px_160px_160px_120px]">
            <div className="relative col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.search}
                className="h-9 bg-slate-50 pl-9 text-sm sm:h-10"
              />
            </div>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            >
              <option value="all">{text.allYears}</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item === 'uncategorized' ? text.uncategorized : item}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            >
              <option value="all">{text.allStatus}</option>
              <option value="published">{text.publishedVersions}</option>
              <option value="draft">{text.draftVersions}</option>
              <option value="missing">{text.missingVersions}</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            >
              <option value="newest">{text.newest}</option>
              <option value="oldest">{text.oldest}</option>
            </select>
            <select
              value={showCount}
              onChange={(event) => setShowCount(Number(event.target.value))}
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            >
              {showOptions.map((item) => (
                <option key={item} value={item}>
                  {text.show} {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 sm:text-sm">
          <span>{text.count(visibleGroups.length, filtered.length)}</span>
          <span className="inline-flex items-center gap-1">
            <Languages className="h-4 w-4" />
            {text.versionStatus}
          </span>
        </div>

        {filtered.length === 0 ? (
          <section className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">{text.emptyTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.emptyBody}</p>
          </section>
        ) : (
          <section className="space-y-4">
            {groupedByYear.map(([yearLabel, yearGroups]) => (
              <div key={yearLabel} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <span>{yearLabel === 'uncategorized' ? text.uncategorized : yearLabel}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {text.articleCount(yearGroups.length)}
                  </span>
                </div>
                {yearGroups.map((group) => {
              const primary = primaryTranslation(group, locale);
              const missing = requiredLocales.filter(
                (item) => !group.translations.some((translation) => translation.locale === item.code)
              );
              const hasPublished = group.translations.some((item) => item.is_published);
              const latest = formatDate(
                group.translations
                  .map((item) => item.published_at || item.updated_at || item.created_at)
                  .filter(Boolean)
                  .sort()
                  .at(-1),
                locale
              );

              return (
                <article
                  key={group.id}
                  className="bg-white border border-slate-200 rounded-md shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="grid grid-cols-1 gap-2 p-3 sm:gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(260px,360px)_170px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${hasPublished ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-slate-950 sm:text-base">
                          {primary?.title || group.shared_slug}
                        </h2>
                        {missing.length > 0 && (
                          <Badge variant="outline" className="h-5 shrink-0 border-amber-200 bg-amber-50 px-2 text-[11px] leading-none text-amber-700">
                            {text.missing} {missing.map((item) => item.label).join(', ')}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {latest}
                        </span>
                        <span className="truncate">/ {group.shared_slug}</span>
                        {primary?.summary && <span className="hidden max-w-[260px] truncate text-slate-400 xl:inline">{primary.summary}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {requiredLocales.map((item) => {
                        const translation = group.translations.find((version) => version.locale === item.code);
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => editVersion(group, item.code)}
                            className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors ${
                              translation
                                ? 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50'
                                : 'border-dashed border-amber-300 bg-amber-50/60 text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            <span className="font-semibold">{item.label}</span>
                            {translation ? (
                              <span className={`h-1.5 w-1.5 rounded-full ${translation.is_published ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1 pt-0.5 lg:justify-end lg:pt-0">
                      <PublishSwitch checked={hasPublished} onCheckedChange={(checked) => updatePublished(group, checked)} labels={{ published: text.published, draft: text.draft }} />
                      <Button variant="ghost" size="sm" onClick={() => editVersion(group, primary?.locale || 'en')} title={text.edit} className="h-7 w-7 p-0">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/${locale}/news/${primary?.slug || group.shared_slug}`, '_blank')}
                        title={text.preview}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteArticle(group)} title={text.delete} className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
                })}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
