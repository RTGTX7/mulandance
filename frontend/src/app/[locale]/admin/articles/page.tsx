'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { isAuthenticated, newsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  Calendar,
  ExternalLink,
  Tag,
  Folder,
} from 'lucide-react';

interface Article {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  locale: string;
  categories: Array<{ slug: string; name: string; name_zh?: string }>;
  tags: Array<{ slug: string; name: string; name_zh?: string }>;
}

interface Category {
  slug: string;
  name: string;
  name_zh?: string;
  color?: string;
}

type SortOrder = 'newest' | 'oldest';

// ── PublishSwitch Component ──
function PublishSwitch({
  articleSlug,
  published,
  loading,
  onChange,
  t,
}: {
  articleSlug: string;
  published: boolean;
  loading: boolean;
  onChange: (slug: string, newStatus: boolean) => void;
  t: (key: string) => string;
}) {
  const [optimistic, setOptimistic] = useState(published);
  const [wasPublished, setWasPublished] = useState(published);

  // Reset when article data changes from outside
  useEffect(() => {
    setOptimistic(published);
    setWasPublished(published);
  }, [published]);

  const handleToggle = async () => {
    const newStatus = !optimistic;
    setOptimistic(newStatus);
    try {
      await onChange(articleSlug, newStatus);
      setWasPublished(newStatus);
    } catch {
      setOptimistic(wasPublished);
    }
  };

  const isActive = optimistic;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleToggle}
      className={`
        flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200
        ${isActive
          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isActive ? t('admin.articles.switchUnpublish') : t('admin.articles.switchPublish')}
    >
      <span className={`
        inline-flex h-4 w-4 items-center justify-center rounded-full transition-all
        ${isActive ? 'bg-purple-600' : 'bg-amber-500'}
      `}>
        {isActive ? (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="text-white text-[8px] font-bold">!</span>
        )}
      </span>
      <span>{isActive ? t('admin.articles.publishedBadge') : t('admin.articles.unpublishedBadge')}</span>
    </button>
  );
}

export default function ArticlesPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      const [articlesData, categoriesData] = await Promise.all([
        newsApi.adminList({ limit: 100 }).catch(() => []),
        newsApi.categories().catch(() => []),
      ]);
      setArticles(articlesData as Article[]);
      setCategories(categoriesData as Category[]);
    } catch {
      setArticles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (slug: string) => {
    try {
      await newsApi.removeArticle(slug);
      setArticles((prev) => prev.filter((a) => a.slug !== slug));
      setDeleteDialog(null);
    } catch {}
  };

  // Toggle publish status via switch
  const handleSwitchToggle = async (slug: string, newStatus: boolean) => {
    setSwitchLoading(slug);
    setError('');
    try {
      await newsApi.togglePublish(slug, newStatus);
      setArticles((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, is_published: newStatus } : a))
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t('admin.articles.statusTextFailed');
      setError(errorMsg);
      // Revert: articles will re-fetch, but set optimistically wrong
      const current = articles.find((a) => a.slug === slug);
      if (current) {
        setArticles((prev) =>
          prev.map((a) => (a.slug === slug ? { ...a, is_published: !newStatus } : a))
        );
      }
    } finally {
      setSwitchLoading(null);
    }
  };

  // Apply filters
  const filteredArticles = articles.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && !a.categories.some((c) => c.slug === filterCategory)) return false;
    if (filterStatus === 'published' && !a.is_published) return false;
    if (filterStatus === 'draft' && a.is_published) return false;
    return true;
  });

  // Apply sorting
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at).getTime();
    const dateB = new Date(b.published_at || b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getLocaleLabel = (localeCode: string) => {
    if (localeCode === 'zh') return '中文';
    return 'EN';
  };

  // Get localized name
  const getName = (item: { name: string; name_zh?: string }) => {
    return locale === 'zh' ? (item.name_zh || item.name) : item.name;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('admin.articles.title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{t('admin.articles.subtitle')}</p>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              size="sm"
              onClick={() => router.push(`/${locale}/admin/editor`)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('admin.articles.newArticle')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* ── Toolbar ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.articles.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm appearance-none cursor-pointer min-w-[140px] focus:bg-white focus:ring-1 focus:ring-purple-300"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '30px',
              }}
            >
              <option value="all">{t('admin.articles.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {getName(c)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm appearance-none cursor-pointer min-w-[130px] focus:bg-white focus:ring-1 focus:ring-purple-300"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '30px',
              }}
            >
              <option value="all">{t('admin.articles.allStatus')}</option>
              <option value="published">{t('admin.articles.publishedBadge')}</option>
              <option value="draft">{t('admin.articles.draftBadge')}</option>
            </select>

            {/* Sort */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm appearance-none cursor-pointer min-w-[130px] focus:bg-white focus:ring-1 focus:ring-purple-300"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '30px',
              }}
            >
              <option value="newest">{t('admin.articles.newestFirst')}</option>
              <option value="oldest">{t('admin.articles.oldestFirst')}</option>
            </select>
          </div>
        </div>

        {/* ── Results count ── */}
        {sortedArticles.length > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            {t('admin.articles.articleCount').replace('{count}', String(sortedArticles.length))}
          </p>
        )}

        {/* ── Empty State ── */}
        {sortedArticles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">{t('admin.articles.noArticles')}</h3>
                <p className="text-sm text-muted-foreground">{t('admin.articles.noArticlesDesc')}</p>
              </div>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => router.push(`/${locale}/admin/editor`)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t('admin.articles.newArticle')}
              </Button>
            </div>
          </div>
        )}

        {/* ── Desktop Cards ── */}
        {sortedArticles.length > 0 && (
          <div className="hidden md:block space-y-2">
            {sortedArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150 group"
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Left: Article info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${article.is_published ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {article.title || t('admin.articles.untitled')}
                      </h3>
                    </div>
                    {article.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 mb-1.5">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>/{article.slug}</span>
                    </div>
                  </div>

                  {/* Middle: Metadata */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px]">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatDate(article.published_at || article.created_at)}</span>
                    </div>

                    {/* Locale */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium">{getLocaleLabel(article.locale)}</span>
                    </div>

                    {/* Categories */}
                    {article.categories.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Folder className="h-3 w-3 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {article.categories.slice(0, 2).map((c) => (
                            <Badge key={c.slug} variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100">
                              {getName(c)}
                            </Badge>
                          ))}
                          {article.categories.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{article.categories.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.slug} variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 border-gray-200 text-gray-500 bg-gray-50/50">
                              {getName(tag)}
                            </Badge>
                          ))}
                          {article.tags.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{article.tags.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Publish Switch + Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Publish Switch */}
                    <PublishSwitch
                      articleSlug={article.slug}
                      published={article.is_published}
                      loading={switchLoading === article.slug}
                      onChange={handleSwitchToggle}
                      t={t}
                    />

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                      onClick={() => router.push(`/${locale}/admin/editor/${article.slug}`)}
                      title={t('admin.articles.edit')}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    {/* View */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => window.open(`/${locale}/news/${article.slug}`, '_blank')}
                      title={t('admin.articles.view')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── Mobile Cards ── */}
        {sortedArticles.length > 0 && (
          <div className="md:hidden space-y-3">
            {sortedArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                {/* Top row: title + publish switch */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${article.is_published ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {article.title || t('admin.articles.untitled')}
                      </h3>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.summary}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">/{article.slug}</p>
                    </div>
                  </div>
                  <PublishSwitch
                    articleSlug={article.slug}
                    published={article.is_published}
                    loading={switchLoading === article.slug}
                    onChange={handleSwitchToggle}
                    t={t}
                  />
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3 w-3 text-gray-400" />
                    {getLocaleLabel(article.locale)}
                  </span>
                  {article.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-auto">
                      {article.categories.map((c) => (
                        <Badge key={c.slug} variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 border-gray-200 text-gray-600 bg-gray-50">
                          {getName(c)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs flex-1 justify-center border-gray-200"
                    onClick={() => router.push(`/${locale}/admin/editor/${article.slug}`)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    {t('admin.articles.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs flex-1 justify-center border-gray-200"
                    onClick={() => window.open(`/${locale}/news/${article.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    {t('admin.articles.view')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('admin.articles.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('admin.articles.confirmDelete')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}