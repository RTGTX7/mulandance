'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { clearAuthToken, isAuthenticated, newsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, Link } from 'lucide-react';

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
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      const [articlesData, categoriesData] = await Promise.all([
        newsApi.list({ limit: 100 }).catch(() => []),
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
      await newsApi.remove(slug);
      setArticles((prev) => prev.filter((a) => a.slug !== slug));
      setDeleteDialog(null);
    } catch {}
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push(`/${locale}/admin/login`);
  };

  const filteredArticles = articles.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== 'all' && !a.categories.some((c) => c.slug === filterCategory)) return false;
    return true;
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

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="heading-sm">{t('admin.articles.title')}</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push(`/${locale}/admin/editor`)}>
              New Article
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              {t('admin.common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t('admin.articles.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{t('news.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name_zh ? `${c.name} (${c.name_zh})` : c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('common.loading')}</CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('admin.articles.noArticles')}</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.articles.title')}</CardTitle>
              <CardDescription>{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <div className="divide-y">
              {filteredArticles.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-4 hover:bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(article.published_at || article.created_at)}</span>
                      <span>•</span>
                      <span>{article.locale.toUpperCase()}</span>
                      {article.categories.length > 0 && (
                        <>
                          <span>•</span>
                          {article.categories.map((c) => (
                            <Badge key={c.slug} variant="secondary" className="text-xs">
                              {c.name_zh ? `${c.name} (${c.name_zh})` : c.name}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={article.is_published ? 'default' : 'secondary'}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/${locale}/admin/editor/${article.slug}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('admin.articles.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/${locale}/news/${article.slug}`)} target="_blank">
                          <Link className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteDialog(article.slug)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('admin.articles.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.articles.confirmDelete')}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The article and its markdown file will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
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
