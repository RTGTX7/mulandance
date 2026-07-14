'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiBulkArticleImportDialog } from '@/components/admin/AiBulkArticleImportDialog';
import {
  isAuthenticated,
  newsApi,
  NewsArticleGroup,
  type NewsCategory,
  type NewsTag,
} from '@/lib/api';
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  Languages,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';

const requiredLocales = [
  { code: 'zh', label: 'ZH', name: 'Chinese' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'French' },
];

const pageSizeOptions = [20, 50, 100];

type StatusFilter = 'all' | 'published' | 'draft' | 'missing';

const articleAdminText = {
  zh: {
    title: '文章管理',
    subtitle: '分页管理新闻、公告和 AI 导入内容，支持批量发布。',
    loading: '加载文章中...',
    loadFailed: '文章加载失败',
    updateFailed: '状态更新失败',
    deleteFailed: '删除失败',
    bulkSuccess: (count: number) => `已批量更新 ${count} 篇文章`,
    deleteConfirm: (title: string) => `删除「${title}」以及所有语言版本吗？`,
    newArticle: '新建文章',
    search: '搜索标题、摘要或 slug...',
    allStatus: '全部状态',
    publishedVersions: '已发布',
    draftVersions: '草稿',
    missingVersions: '缺少语言',
    pageSize: '每页',
    count: (shown: number, total: number) => `当前 ${shown} / 共 ${total} 篇`,
    versionStatus: '多语言状态',
    page: (current: number, total: number) => `第 ${current} / ${total} 页`,
    emptyTitle: '没有找到文章',
    emptyBody: '调整筛选条件，或者先导入一批内容。',
    published: '已发布',
    draft: '草稿',
    missing: '缺少',
    edit: '编辑',
    preview: '预览',
    delete: '删除',
    selectAll: '全选本页',
    clear: '清空选择',
    selected: (count: number) => `已选 ${count} 篇`,
    bulkPublish: '批量发布',
    bulkUnpublish: '批量撤下',
    bulkDelete: '批量删除',
    bulkDeleteConfirm: (count: number) => `确认删除选中的 ${count} 篇文章及其所有语言版本吗？`,
    bulkDeleteSuccess: (count: number) => `已删除 ${count} 篇文章`,
    prev: '上一页',
    next: '下一页',
  },
  en: {
    title: 'Article Management',
    subtitle: 'Manage news, announcements, and AI imports with pagination and bulk publish tools.',
    loading: 'Loading articles...',
    loadFailed: 'Failed to load articles',
    updateFailed: 'Failed to update status',
    deleteFailed: 'Delete failed',
    bulkSuccess: (count: number) => `Updated ${count} articles`,
    deleteConfirm: (title: string) => `Delete "${title}" and all language versions?`,
    newArticle: 'New Article',
    search: 'Search title, summary, or slug...',
    allStatus: 'All status',
    publishedVersions: 'Published',
    draftVersions: 'Draft',
    missingVersions: 'Missing locale',
    pageSize: 'Per page',
    count: (shown: number, total: number) => `Showing ${shown} / ${total} articles`,
    versionStatus: 'Locale status',
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    emptyTitle: 'No articles found',
    emptyBody: 'Adjust filters or import a batch first.',
    published: 'Published',
    draft: 'Draft',
    missing: 'Missing',
    edit: 'Edit',
    preview: 'Preview',
    delete: 'Delete',
    selectAll: 'Select page',
    clear: 'Clear',
    selected: (count: number) => `${count} selected`,
    bulkPublish: 'Publish selected',
    bulkUnpublish: 'Unpublish selected',
    bulkDelete: 'Delete selected',
    bulkDeleteConfirm: (count: number) => `Delete ${count} selected articles and all locale versions?`,
    bulkDeleteSuccess: (count: number) => `Deleted ${count} articles`,
    prev: 'Previous',
    next: 'Next',
  },
  fr: {
    title: 'Gestion des articles',
    subtitle: 'Gerez les actualites, annonces et imports IA avec pagination et actions en lot.',
    loading: 'Chargement des articles...',
    loadFailed: 'Impossible de charger les articles',
    updateFailed: 'Impossible de modifier le statut',
    deleteFailed: 'Echec de la suppression',
    bulkSuccess: (count: number) => `${count} articles mis a jour`,
    deleteConfirm: (title: string) => `Supprimer "${title}" et toutes ses versions ?`,
    newArticle: 'Nouvel article',
    search: 'Rechercher titre, resume ou slug...',
    allStatus: 'Tous les statuts',
    publishedVersions: 'Publie',
    draftVersions: 'Brouillon',
    missingVersions: 'Langue manquante',
    pageSize: 'Par page',
    count: (shown: number, total: number) => `${shown} / ${total} articles`,
    versionStatus: 'Etat des langues',
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    emptyTitle: 'Aucun article trouve',
    emptyBody: 'Ajustez les filtres ou importez un lot.',
    published: 'Publie',
    draft: 'Brouillon',
    missing: 'Manquant',
    edit: 'Modifier',
    preview: 'Apercu',
    delete: 'Supprimer',
    selectAll: 'Tout selectionner',
    clear: 'Effacer',
    selected: (count: number) => `${count} selectionnes`,
    bulkPublish: 'Publier la selection',
    bulkUnpublish: 'Retirer la selection',
    bulkDelete: 'Supprimer la selection',
    bulkDeleteConfirm: (count: number) => `Supprimer les ${count} articles selectionnes et toutes leurs versions ?`,
    bulkDeleteSuccess: (count: number) => `${count} articles supprimes`,
    prev: 'Precedent',
    next: 'Suivant',
  },
} as const;

function adminLocale(locale: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
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

function primaryTranslation(group: NewsArticleGroup, uiLocale: string) {
  const contentLocale = articleLocaleFor(uiLocale);
  return (
    group.translations.find((item) => item.locale === contentLocale) ||
    group.translations.find((item) => item.locale === 'zh') ||
    group.translations.find((item) => item.locale === 'en') ||
    group.translations[0]
  );
}

function latestDate(group: NewsArticleGroup) {
  const dates = group.translations
    .map((item) => item.published_at || item.updated_at || item.created_at)
    .filter(Boolean)
    .map((item) => new Date(item as string).getTime())
    .filter(Number.isFinite);
  return dates.length ? new Date(Math.max(...dates)).toISOString() : undefined;
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

export default function ArticlesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const text = articleAdminText[adminLocale(locale)];
  const homepageText = adminLocale(locale) === 'zh'
    ? { on: '首页显示', off: '首页隐藏', failed: '首页显示状态更新失败' }
    : adminLocale(locale) === 'fr'
      ? { on: 'Visible sur l’accueil', off: 'Masqué de l’accueil', failed: 'Impossible de modifier l’affichage sur l’accueil' }
      : { on: 'On homepage', off: 'Hidden from homepage', failed: 'Failed to update homepage visibility' };

  const [groups, setGroups] = useState<NewsArticleGroup[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [homepagePending, setHomepagePending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadMeta = useCallback(async () => {
    const [categoryData, tagData] = await Promise.all([newsApi.categories(), newsApi.tags()]);
    setCategories(categoryData);
    setTags(tagData);
  }, []);

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await newsApi.adminGroups({
        search: search || undefined,
        status,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setGroups(response.items);
      setTotal(response.total);
      setSelected((prev) => prev.filter((slug) => response.items.some((item) => item.shared_slug === slug)));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.loadFailed);
      setGroups([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [locale, page, pageSize, router, search, status, text.loadFailed]);

  useEffect(() => {
    loadMeta().catch(() => undefined);
  }, [loadMeta]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, pageSize]);

  const pageSelected = useMemo(
    () => groups.length > 0 && groups.every((group) => selected.includes(group.shared_slug)),
    [groups, selected]
  );

  async function updatePublished(group: NewsArticleGroup, published: boolean) {
    setError('');
    setNotice('');
    try {
      await newsApi.togglePublish(group.shared_slug, published);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.updateFailed);
    }
  }

  async function updateHomepageVisibility(group: NewsArticleGroup, visible: boolean) {
    setHomepagePending(group.shared_slug);
    setError('');
    setNotice('');
    try {
      await newsApi.setHomepageVisibility(group.shared_slug, visible);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : homepageText.failed);
    } finally {
      setHomepagePending(null);
    }
  }

  async function updateSelected(published: boolean) {
    if (selected.length === 0) return;
    setBulkPending(true);
    setError('');
    setNotice('');
    try {
      const result = await newsApi.bulkTogglePublish(selected, published);
      setNotice(text.bulkSuccess(result.updated));
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.updateFailed);
    } finally {
      setBulkPending(false);
    }
  }

  async function deleteSelected() {
    if (selected.length === 0) return;
    if (!window.confirm(text.bulkDeleteConfirm(selected.length))) return;
    setBulkPending(true);
    setError('');
    setNotice('');
    try {
      const result = await newsApi.bulkDelete(selected);
      setSelected([]);
      setNotice(text.bulkDeleteSuccess(result.deleted));
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteFailed);
    } finally {
      setBulkPending(false);
    }
  }

  async function deleteArticle(group: NewsArticleGroup) {
    const title = primaryTranslation(group, locale)?.title || group.shared_slug;
    if (!window.confirm(text.deleteConfirm(title))) return;
    setError('');
    setNotice('');
    try {
      await newsApi.removeArticle(group.shared_slug);
      await loadGroups();
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

  function toggleSelected(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]));
  }

  function toggleSelectPage() {
    if (pageSelected) {
      setSelected((prev) => prev.filter((slug) => !groups.some((group) => group.shared_slug === slug)));
      return;
    }
    setSelected((prev) => Array.from(new Set([...prev, ...groups.map((group) => group.shared_slug)])));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{text.title}</h1>
              <p className="mt-0.5 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">{text.subtitle}</p>
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
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={text.search}
                className="h-9 bg-slate-50 pl-9 text-sm sm:h-10"
              />
            </div>
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
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-10"
            >
              {pageSizeOptions.map((item) => (
                <option key={item} value={item}>
                  {text.pageSize} {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 sm:text-sm">
          <span>{text.count(groups.length, total)}</span>
          <span className="inline-flex items-center gap-1">
            <Languages className="h-4 w-4" />
            {text.versionStatus}
          </span>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="h-8 px-3 text-xs" onClick={toggleSelectPage}>
                {pageSelected ? text.clear : text.selectAll}
              </Button>
              {selected.length > 0 && (
                <span className="text-xs font-medium text-slate-600">{text.selected(selected.length)}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={selected.length === 0 || bulkPending}
                onClick={() => updateSelected(true)}
              >
                {bulkPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {text.bulkPublish}
              </Button>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={selected.length === 0 || bulkPending}
                onClick={() => updateSelected(false)}
              >
                {text.bulkUnpublish}
              </Button>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={selected.length === 0 || bulkPending}
                onClick={deleteSelected}
              >
                {text.bulkDelete}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {text.loading}
            </div>
          ) : groups.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-lg font-semibold text-slate-800">{text.emptyTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{text.emptyBody}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {groups.map((group) => {
                const primary = primaryTranslation(group, locale);
                const missing = requiredLocales.filter(
                  (item) => !group.translations.some((translation) => translation.locale === item.code)
                );
                const hasPublished = group.translations.some((item) => item.is_published);
                return (
                  <article key={group.id} className="px-3 py-3 sm:px-4">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[28px_minmax(0,1.25fr)_minmax(280px,0.85fr)_180px] xl:items-center">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(group.shared_slug)}
                          onChange={() => toggleSelected(group.shared_slug)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${hasPublished ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-950 sm:text-[15px]">
                            {primary?.title || group.shared_slug}
                          </h2>
                          {missing.length > 0 && (
                            <Badge variant="outline" className="h-5 shrink-0 border-amber-200 bg-amber-50 px-2 text-[11px] leading-none text-amber-700">
                              {text.missing} {missing.map((item) => item.label).join(', ')}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(latestDate(group), locale)}
                          </span>
                          <span className="truncate">/ {group.shared_slug}</span>
                        </div>
                        {primary?.summary && (
                          <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-slate-500">{primary.summary}</p>
                        )}
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

                      <div className="flex flex-wrap items-center gap-1 xl:justify-end">
                        <PublishSwitch
                          checked={hasPublished}
                          onCheckedChange={(checked) => updatePublished(group, checked)}
                          labels={{ published: text.published, draft: text.draft }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={homepagePending === group.shared_slug}
                          onClick={() => updateHomepageVisibility(group, !group.show_on_homepage)}
                          className={`h-7 px-2 text-[11px] ${group.show_on_homepage ? 'border-purple-200 bg-purple-50 text-purple-700' : 'text-slate-500'}`}
                        >
                          {homepagePending === group.shared_slug ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                          {group.show_on_homepage ? homepageText.on : homepageText.off}
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArticle(group)}
                          title={text.delete}
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5">
            <span className="text-xs text-slate-500">{text.page(page, totalPages)}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 px-3 text-xs" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                {text.prev}
              </Button>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                {text.next}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
