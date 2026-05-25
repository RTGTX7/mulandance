'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { clearAuthToken, isAuthenticated, newsApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Plus, Edit2, Trash2, X, Check, AlertTriangle, Palette } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  name_zh?: string;
  color?: string;
}

type EditingCategory = {
  slug: string;
  name: string;
  name_zh: string;
  color: string;
};

export default function CategoriesPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ slug: '', name: '', name_zh: '', color: '#6366f1' });
  const [editForm, setEditForm] = useState<EditingCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      const data = await newsApi.categories();
      setCategories(data as Category[]);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleLogout = () => {
    clearAuthToken();
    router.push(`/${locale}/admin/login`);
  };

  const handleAdd = async () => {
    try {
      const body = {
        slug: addForm.slug,
        name: addForm.name,
        name_zh: addForm.name_zh || undefined,
        color: addForm.color || undefined,
      };
      await newsApi.create(body);
      setAddForm({ slug: '', name: '', name_zh: '', color: '#6366f1' });
      setShowAdd(false);
      await fetchCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const handleEdit = async () => {
    if (!editing || !editForm) return;
    try {
      await newsApi.update(editing, {
        name: editForm.name,
        name_zh: editForm.name_zh || undefined,
        color: editForm.color || undefined,
      });
      setEditing(null);
      setEditForm(null);
      await fetchCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await newsApi.remove(deleteTarget);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const openEdit = (cat: Category) => {
    setEditing(cat.slug);
    setEditForm({ slug: cat.slug, name: cat.name, name_zh: cat.name_zh || '', color: cat.color || '#6366f1' });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="heading-sm">{t('admin.categories.title', { defaultMessage: 'Manage Categories' })}</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('common.add', { defaultMessage: 'Add' })}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/admin/dashboard`)}>
              {t('common.back')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              {t('admin.common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('common.loading')}</CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('admin.categories.noCategories', { defaultMessage: 'No categories yet. Add your first one!' })}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.slug} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: cat.color || '#6366f1' }} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{cat.name_zh ? `${cat.name} (${cat.name_zh})` : cat.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(cat.slug)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>/{cat.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  {editing === cat.slug && editForm ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (EN)</label>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (ZH)</label>
                        <Input value={editForm.name_zh} onChange={(e) => setEditForm({ ...editForm, name_zh: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={editForm.color}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="w-10 h-9 p-1 rounded"
                          />
                          <Input value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="flex-1 font-mono" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={handleEdit}>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditing(null); setEditForm(null); }}>
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Palette className="h-3.5 w-3.5" />
                      <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: cat.color || '#6366f1' }} />
                      <span>{cat.color || '#6366f1'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.addTitle', { defaultMessage: 'Add New Category' })}</DialogTitle>
            <DialogDescription>{t('admin.categories.addDescription', { defaultMessage: 'Create a new news category.' })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.categories.slug', { defaultMessage: 'Slug' })}</label>
              <Input value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="breaking-news" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.categories.nameEn', { defaultMessage: 'Name (English)' })}</label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Breaking News" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.categories.nameZh', { defaultMessage: 'Name (中文)' })}</label>
              <Input value={addForm.name_zh} onChange={(e) => setAddForm({ ...addForm, name_zh: e.target.value })} placeholder="要闻" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.categories.color', { defaultMessage: 'Color' })}</label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={addForm.color} onChange={(e) => setAddForm({ ...addForm, color: e.target.value })} className="w-10 h-9 p-1 rounded" />
                <Input value={addForm.color} onChange={(e) => setAddForm({ ...addForm, color: e.target.value })} className="flex-1 font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd}>{t('common.add', { defaultMessage: 'Add' })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('admin.categories.confirmDelete', { defaultMessage: 'Delete Category' })}
            </DialogTitle>
            <DialogDescription>
              {t('admin.categories.confirmDeleteDesc', {
                defaultMessage: 'Are you sure you want to delete "{slug}"? Articles in this category will not be deleted. This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
