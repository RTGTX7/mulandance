'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProgramBody, ProgramItem, isAuthenticated, programApi, uploadApi } from '@/lib/api';
import { cn, generateSlug } from '@/lib/utils';
import { BookOpen, Edit2, ImagePlus, Loader2, Save, Trash2, X } from 'lucide-react';

const emptyForm: ProgramBody & { is_active: boolean } = {
  slug: '',
  name: '',
  description: '',
  category: 'dance',
  level: '',
  syllabus_ref: '',
  cover_image: '',
  order_index: 0,
  is_active: true,
};

function VisibilitySwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-sm font-medium transition-colors',
        checked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      <span className={cn('relative inline-flex h-4 w-7 rounded-full', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[14px]' : 'translate-x-0.5')} />
      </span>
      {checked ? '前台显示' : '隐藏'}
    </button>
  );
}

export default function AdminProgramsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const sortedPrograms = useMemo(
    () => [...programs].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)),
    [programs]
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadPrograms();
  }, [router, locale]);

  function loadPrograms() {
    setLoading(true);
    programApi
      .adminList()
      .then(setPrograms)
      .catch((err) => setError(err instanceof Error ? err.message : '加载课程失败'))
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  function editProgram(program: ProgramItem) {
    setEditingId(program.id);
    setForm({
      slug: program.slug,
      name: program.name,
      description: program.description || '',
      category: program.category || 'dance',
      level: program.level || '',
      syllabus_ref: program.syllabus_ref || '',
      cover_image: program.cover_image || '',
      order_index: program.order_index || 0,
      is_active: program.is_active,
    });
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadApi.image(file);
      setForm((current) => ({ ...current, cover_image: uploaded.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传封面失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('课程名称必填');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug 必填');
      return;
    }

    setSaving(true);
    setError('');
    const body = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description?.trim() || undefined,
      category: form.category.trim() || 'dance',
      level: form.level?.trim() || undefined,
      syllabus_ref: form.syllabus_ref?.trim() || undefined,
      cover_image: form.cover_image?.trim() || undefined,
      order_index: Number(form.order_index) || 0,
    };

    try {
      if (editingId) {
        await programApi.update(editingId, body);
      } else {
        const { is_active, ...createBody } = body;
        const created = await programApi.create(createBody);
        if (!is_active) await programApi.update(created.id, { is_active });
      }
      resetForm();
      loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function removeProgram(program: ProgramItem) {
    if (!window.confirm(`删除课程“${program.name}”吗？`)) return;
    setError('');
    try {
      await programApi.remove(program.id);
      if (editingId === program.id) resetForm();
      loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingId ? '编辑课程' : '新增课程'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="space-y-4">
              {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <label className="block space-y-1">
                <span className="text-sm font-medium">课程名称</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value, slug: current.slug || generateSlug(e.target.value) }))}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Slug</span>
                <Input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: generateSlug(e.target.value) }))} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium">分类</span>
                  <Input value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">级别</span>
                  <Input value={form.level || ''} onChange={(e) => setForm((current) => ({ ...current, level: e.target.value }))} />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">封面图</span>
                <div className="space-y-2">
                  <div className="h-32 overflow-hidden rounded-md border bg-slate-100">
                    {form.cover_image ? (
                      <img src={form.cover_image} alt={form.name || '课程封面'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">无封面</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild type="button" variant="outline" disabled={uploading}>
                      <label className="cursor-pointer">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        上传封面
                        <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
                      </label>
                    </Button>
                    <Input
                      value={form.cover_image || ''}
                      onChange={(e) => setForm((current) => ({ ...current, cover_image: e.target.value }))}
                      placeholder="或粘贴图片 URL"
                    />
                  </div>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">简介</span>
                <Textarea rows={5} value={form.description || ''} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">补充说明</span>
                <Textarea
                  rows={3}
                  value={form.syllabus_ref || ''}
                  onChange={(e) => setForm((current) => ({ ...current, syllabus_ref: e.target.value }))}
                  placeholder="可写课程体系、考试、适合年龄等"
                />
              </label>

              <div className="flex items-center justify-between gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium">排序</span>
                  <Input type="number" className="w-24" value={form.order_index} onChange={(e) => setForm((current) => ({ ...current, order_index: Number(e.target.value) }))} />
                </label>
                <VisibilitySwitch checked={form.is_active} onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  保存
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>课程列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPrograms.map((program) => (
                  <div key={program.id} className="flex items-center gap-4 rounded-md border bg-white p-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {program.cover_image ? (
                        <img src={program.cover_image} alt={program.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">无图</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{program.name}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', program.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {program.is_active ? '显示' : '隐藏'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">/{program.slug} · {program.level || program.category}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{program.description || '未填写简介'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => editProgram(program)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProgram(program)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
