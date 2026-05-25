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
import { LogOut, Plus, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';

interface Tag {
  slug: string;
  name: string;
  name_zh?: string;
}

type EditingTag = {
  slug: string;
  name: string;
  name_zh: string;
};

export default function TagsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ slug: '', name: '', name_zh: '' });
  const [editForm, setEditForm] = useState<EditingTag | null>(null);

  const fetchTags = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      const data = await newsApi.tags();
      setTags(data as Tag[]);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

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
      };
      await newsApi.create(body);
      setAddForm({ slug: '', name: '', name_zh: '' });
      setShowAdd(false);
      await fetchTags();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const handleEdit = async () => {
    if (!editing || !editForm) return;
    try {
      await newsApi.update(editing, {
        name: editForm.name,
        name_zh: editForm.name_zh || undefined,
      });
      setEditing(null);
      setEditForm(null);
      await fetchTags();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await newsApi.remove(deleteTarget);
      setDeleteTarget(null);
      await fetchTags();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag.slug);
    setEditForm({ slug: tag.slug, name: tag.name, name_zh: tag.name_zh || '' });
  };

  const cardColors = [
    'from-blue-500/20 to-blue-500/5',
    'from-purple-500/20 to-purple-500/5',
    'from-emerald-500/20 to-emerald-500/5',
    'from-amber-500/20 to-amber-500/5',
    'from-rose-500/20 to-rose-500/5',
    'from-cyan-500/20 to-cyan-500/5',
    'from-indigo-500/20 to-indigo-500/5',
    'from-orange-500/20 to-orange-500/5',
    'from-pink-500/20 to-pink-500/5',
    'from-teal-500/20 to-teal-500/5',
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="heading-sm">{t('admin.tags.title', { defaultMessage: 'Manage Tags' })}</h1>
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
        ) : tags.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('admin.tags.noTags', { defaultMessage: 'No tags yet. Add your first one!' })}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag, index) => {
              const gradient = cardColors[index % cardColors.length];
              return (
                <Card key={tag.slug} className={`bg-gradient-to-br ${gradient} overflow-hidden`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{tag.name_zh ? `${tag.name} (${tag.name_zh})` : tag.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tag)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(tag.slug)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>/{tag.slug}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editing === tag.slug && editForm ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (EN)</label>
                          <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (ZH)</label>
                          <Input value={editForm.name_zh} onChange={(e) => setEditForm({ ...editForm, name_zh: e.target.value })} />
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
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{tag.slug}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.tags.addTitle', { defaultMessage: 'Add New Tag' })}</DialogTitle>
            <DialogDescription>{t('admin.tags.addDescription', { defaultMessage: 'Create a new news tag.' })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.slug', { defaultMessage: 'Slug' })}</label>
              <Input value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="workshop" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.nameEn', { defaultMessage: 'Name (English)' })}</label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Workshop" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.nameZh', { defaultMessage: 'Name (中文)' })}</label>
              <Input value={addForm.name_zh} onChange={(e) => setAddForm({ ...addForm, name_zh: e.target.value })} placeholder="工作坊" />
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
              {t('admin.tags.confirmDelete', { defaultMessage: 'Delete Tag' })}
            </DialogTitle>
            <DialogDescription>
              {t('admin.tags.confirmDeleteDesc', {
                defaultMessage: 'Are you sure you want to delete "{slug}"? This action cannot be undone.',
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
