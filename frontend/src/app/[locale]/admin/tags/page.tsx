'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { clearAuthToken, isAuthenticated, newsApi, getErrorMessage } from '@/lib/api';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    if (!addForm.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!addForm.name.trim()) {
      setError('English name is required');
      return;
    }
    if (!isAuthenticated()) {
      setError('Session expired. Please login again.');
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      setSaving(true);
      const body = {
        slug: addForm.slug.trim(),
        name: addForm.name.trim(),
        name_zh: addForm.name_zh.trim() || undefined,
      };
      console.log('Submitting tag payload:', { slug: addForm.slug.trim(), name: addForm.name.trim(), name_zh: addForm.name_zh.trim() || undefined });
      await newsApi.createTag(body);
      setAddForm({ slug: '', name: '', name_zh: '' });
      setShowAdd(false);
      await fetchTags();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('credentials')) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push(`/${locale}/admin/login`);
        }, 2000);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editing || !editForm) return;
    setError(null);
    if (!isAuthenticated()) {
      setError('Session expired. Please login again.');
      router.push(`/${locale}/admin/login`);
      return;
    }
    if (!editForm.name.trim()) {
      setError('English name is required');
      return;
    }
    try {
      setSaving(true);
      await newsApi.updateTag(editing, {
        name: editForm.name.trim(),
        name_zh: editForm.name_zh.trim() || undefined,
      });
      setEditing(null);
      setEditForm(null);
      await fetchTags();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('credentials')) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push(`/${locale}/admin/login`);
        }, 2000);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    if (!isAuthenticated()) {
      setError('Session expired. Please login again.');
      router.push(`/${locale}/admin/login`);
      return;
    }
    try {
      await newsApi.deleteTag(deleteTarget);
      setDeleteTarget(null);
      await fetchTags();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('credentials')) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push(`/${locale}/admin/login`);
        }, 2000);
      } else {
        setError(getErrorMessage(err));
      }
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.tags.title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('admin.tags.addDescription')}</p>
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm" onClick={() => { setShowAdd(true); setError(null); }}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('admin.common.add')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            <p className="text-sm">{error}</p>
            <button className="mt-2 text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('admin.common.loading')}</CardContent>
          </Card>
        ) : tags.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('admin.tags.noTags')}
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteTarget(tag.slug); setError(null); }}>
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
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('admin.tags.slug')}</label>
                          <Input value={`/${editForm.slug}`} disabled className="opacity-70" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('admin.tags.nameEn')}</label>
                          <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('admin.tags.nameZh')}</label>
                          <Input value={editForm.name_zh} onChange={(e) => setEditForm({ ...editForm, name_zh: e.target.value })} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={handleEdit} disabled={saving}>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {saving ? 'Saving...' : t('common.save')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setEditing(null); setEditForm(null); setError(null); }}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            {t('common.cancel')}
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
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.tags.addTitle')}</DialogTitle>
            <DialogDescription>{t('admin.tags.addDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.slug')} <span className="text-destructive">*</span></label>
              <Input value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="workshop" />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier for this tag (no spaces)</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.nameEn')} <span className="text-destructive">*</span></label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Workshop" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('admin.tags.nameZh')}</label>
              <Input value={addForm.name_zh} onChange={(e) => setAddForm({ ...addForm, name_zh: e.target.value })} placeholder="工作坊" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setError(null); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving...' : t('admin.common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); setError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('admin.tags.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.tags.confirmDeleteDesc').replace('{slug}', deleteTarget || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!deleteTarget}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}