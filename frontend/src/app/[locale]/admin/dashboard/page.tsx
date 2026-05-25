'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { clearAuthToken, isAuthenticated } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, LogOut, FileText, CheckCircle, FilePlus, Tag } from 'lucide-react';

interface Stats {
  total: number;
  published: number;
  drafts: number;
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    fetch('/api/v1/news?limit=100')
      .then((res) => res.json())
      .then((articles: unknown[]) => {
        const articleList = articles as Array<{ is_published: boolean }>;
        setStats({
          total: articleList.length,
          published: articleList.filter((a) => a.is_published).length,
          drafts: articleList.filter((a) => !a.is_published).length,
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router, locale]);

  const handleLogout = () => {
    clearAuthToken();
    router.push(`/${locale}/admin/login`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="heading-sm">{t('admin.dashboard.title')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/admin/articles`)}>
              <Link className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              {t('admin.common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
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
          <Card>
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
          <Card>
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
          <Card className="cursor-pointer hover:border-secondary/50" onClick={() => router.push(`/${locale}/admin/categories`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t('admin.dashboard.totalTags')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">Manage</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push(`/${locale}/admin/editor`)}>
            <FilePlus className="h-4 w-4 mr-2" />
            {t('admin.dashboard.newArticle')}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/articles`)}>
            {t('admin.dashboard.viewAll')}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/categories`)}>
            Manage Categories
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/tags`)}>
            Manage Tags
          </Button>
        </div>

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.recentArticles')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {stats.total === 0 ? 'No articles yet. Create your first article!' : `${stats.total} articles total`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
