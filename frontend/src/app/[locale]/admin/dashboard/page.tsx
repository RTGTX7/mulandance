'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated, newsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/components/ui/i18n-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { CheckCircle, FileText, Tag, Folder } from 'lucide-react';

interface Stats {
  total: number;
  published: number;
  drafts: number;
  categories: number;
  tags: number;
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, drafts: 0, categories: 0, tags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    newsApi.adminList({ limit: 100 })
      .then((articles: unknown[]) => {
        const articleList = articles as Array<{ is_published: boolean }>;
        Promise.all([
          newsApi.categories().catch(() => []),
          newsApi.tags().catch(() => []),
        ]).then(([cats, tags]) => {
          setStats({
            total: articleList.length,
            published: articleList.filter((a) => a.is_published).length,
            drafts: articleList.filter((a) => !a.is_published).length,
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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Page Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="min-w-0 min-h-[112px] cursor-pointer hover:border-primary/50" onClick={() => router.push(`/${locale}/admin/articles`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('admin.dashboard.totalArticles')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.total}</p>
            </CardContent>
          </Card>
          <Card className="min-w-0 min-h-[112px] cursor-pointer hover:border-emerald-400" onClick={() => router.push(`/${locale}/admin/articles?status=published`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t('admin.dashboard.published')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.published}</p>
            </CardContent>
          </Card>
          <Card className="min-w-0 min-h-[112px] cursor-pointer hover:border-amber-400" onClick={() => router.push(`/${locale}/admin/articles?status=draft`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('admin.dashboard.drafts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.drafts}</p>
            </CardContent>
          </Card>
          <Card className="min-w-0 min-h-[112px] cursor-pointer hover:border-primary/50" onClick={() => router.push(`/${locale}/admin/categories`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {t('admin.dashboard.totalCategories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{loading ? '...' : stats.categories}</p>
            </CardContent>
          </Card>
          <Card className="min-w-0 min-h-[112px] cursor-pointer hover:border-secondary/50" onClick={() => router.push(`/${locale}/admin/tags`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t('admin.dashboard.totalTags')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{loading ? '...' : stats.tags}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.recentArticles')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('admin.common.loading')}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {stats.total === 0
                    ? t('admin.dashboard.noArticles')
                    : t('admin.dashboard.articleTotal').replace('{count}', String(stats.total))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
