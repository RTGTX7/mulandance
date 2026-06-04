'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAuthenticated, newsApi, type NewsArticleGroup } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { CheckCircle, FileText, Tag, Folder, CalendarDays, Pencil } from 'lucide-react';
import { articleLocaleFor, dateLocaleFor } from '@/lib/i18n';

interface Stats {
  total: number;
  published: number;
  drafts: number;
  categories: number;
  tags: number;
}

const SHOW_OPTIONS = [5, 10, 20, 50, 100];

function latestDate(group: NewsArticleGroup) {
  const dates = group.translations
    .map((item) => item.published_at || item.updated_at || item.created_at)
    .filter(Boolean)
    .map((item) => new Date(item as string).getTime());
  return dates.length ? Math.max(...dates) : 0;
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

function dedupeArticleGroups(groups: NewsArticleGroup[]) {
  const bySlug = new Map<string, NewsArticleGroup>();

  for (const group of groups) {
    const key = group.shared_slug || group.id;
    const existing = bySlug.get(key);

    if (!existing) {
      bySlug.set(key, group);
      continue;
    }

    const translationsByLocale = new Map(existing.translations.map((item) => [item.locale, item]));
    for (const translation of group.translations) {
      translationsByLocale.set(translation.locale, translation);
    }

    bySlug.set(key, {
      ...existing,
      translations: Array.from(translationsByLocale.values()),
      categories: existing.categories.length ? existing.categories : group.categories,
      tags: existing.tags.length ? existing.tags : group.tags,
      updated_at: existing.updated_at || group.updated_at,
    });
  }

  return Array.from(bySlug.values());
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, drafts: 0, categories: 0, tags: 0 });
  const [articleGroups, setArticleGroups] = useState<NewsArticleGroup[]>([]);
  const [showCount, setShowCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    newsApi.adminGroups({ limit: 100 })
      .then((groups) => {
        Promise.all([
          newsApi.categories().catch(() => []),
          newsApi.tags().catch(() => []),
        ]).then(([cats, tags]) => {
          const articleList = dedupeArticleGroups(groups as NewsArticleGroup[]);
          setArticleGroups(articleList);
          setStats({
            total: articleList.length,
            published: articleList.filter((group) => group.translations.some((item) => item.is_published)).length,
            drafts: articleList.filter((group) => group.translations.some((item) => !item.is_published)).length,
            categories: Array.isArray(cats) ? cats.length : 0,
            tags: Array.isArray(tags) ? tags.length : 0,
          });
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router, locale]);

  const recentArticles = useMemo(() => {
    return [...articleGroups]
      .sort((a, b) => latestDate(b) - latestDate(a))
      .slice(0, showCount);
  }, [articleGroups, showCount]);

  const openArticle = (group: NewsArticleGroup) => {
    const primary = primaryTranslation(group, locale);
    router.push(`/${locale}/admin/editor/${group.shared_slug}?locale=${primary?.locale || 'en'}`);
  };

  return (
    <div className="min-h-screen bg-muted/25">
      {/* Page Header */}
      <header className="sticky top-12 z-10 border-b border-white/60 bg-white/75 backdrop-blur-xl md:top-14">
        <div className="mx-auto max-w-7xl px-3 py-2 md:px-4 md:py-3">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-3 px-3 py-3 md:space-y-5 md:px-4 md:py-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-5">
          <Card className="min-h-[82px] min-w-0 cursor-pointer hover:border-primary/50 md:min-h-[96px]" onClick={() => router.push(`/${locale}/admin/articles`)}>
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {t('admin.dashboard.totalArticles')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold md:text-3xl">{loading ? '...' : stats.total}</p>
            </CardContent>
          </Card>
          <Card className="min-h-[82px] min-w-0 cursor-pointer hover:border-emerald-400 md:min-h-[96px]" onClick={() => router.push(`/${locale}/admin/articles?status=published`)}>
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {t('admin.dashboard.published')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold md:text-3xl">{loading ? '...' : stats.published}</p>
            </CardContent>
          </Card>
          <Card className="min-h-[82px] min-w-0 cursor-pointer hover:border-amber-400 md:min-h-[96px]" onClick={() => router.push(`/${locale}/admin/articles?status=draft`)}>
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {t('admin.dashboard.drafts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold md:text-3xl">{loading ? '...' : stats.drafts}</p>
            </CardContent>
          </Card>
          <Card className="min-h-[82px] min-w-0 cursor-pointer hover:border-primary/50 md:min-h-[96px]" onClick={() => router.push(`/${locale}/admin/categories`)}>
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
                <Folder className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {t('admin.dashboard.totalCategories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-primary md:text-3xl">{loading ? '...' : stats.categories}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 min-h-[82px] min-w-0 cursor-pointer hover:border-secondary/50 md:col-span-1 md:min-h-[96px]" onClick={() => router.push(`/${locale}/admin/tags`)}>
            <CardHeader className="pb-1.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
                <Tag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {t('admin.dashboard.totalTags')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-secondary md:text-3xl">{loading ? '...' : stats.tags}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle>{t('admin.dashboard.recentArticles')}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                {stats.total === 0
                  ? t('admin.dashboard.noArticles')
                  : t('admin.dashboard.articleTotal').replace('{count}', String(stats.total))}
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
              <span className="hidden sm:inline">Show</span>
              <select
                value={showCount}
                onChange={(event) => setShowCount(Number(event.target.value))}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              >
                {SHOW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('admin.common.loading')}</p>
            ) : recentArticles.length === 0 ? (
              <p className="text-muted-foreground">{t('admin.dashboard.noArticles')}</p>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border bg-white/80">
                {recentArticles.map((group) => {
                  const primary = primaryTranslation(group, locale);
                  const published = group.translations.some((item) => item.is_published);
                  const date = latestDate(group);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => openArticle(group)}
                      className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 md:items-center md:gap-4 md:px-4 md:py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${published ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <p className="truncate font-medium text-slate-950">{primary?.title || group.shared_slug}</p>
                          <span className="hidden shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 sm:inline-flex">
                            {group.translations.map((item) => item.locale.toUpperCase()).join(' / ')}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {date ? new Date(date).toLocaleDateString(dateLocaleFor(locale)) : '-'}
                          </span>
                          <span>/ {group.shared_slug}</span>
                          {primary?.summary && <span className="hidden max-w-xl truncate lg:inline">{primary.summary}</span>}
                        </div>
                      </div>
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-purple-50 hover:text-purple-700">
                        <Pencil className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
