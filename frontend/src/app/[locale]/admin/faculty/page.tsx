'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FacultyMember,
  FacultyMemberBody,
  facultyApi,
  isAuthenticated,
  uploadApi,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { Edit2, ImagePlus, Loader2, Save, Trash2, UsersRound, X } from 'lucide-react';

const emptyForm: FacultyMemberBody = {
  name: '',
  role: '',
  bio: '',
  photo_url: '',
  specialties: '',
  achievements: '',
  is_active: true,
  order_index: 0,
};

function VisibilitySwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
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
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[14px]' : 'translate-x-0.5'
          )}
        />
      </span>
      {checked ? '前台显示' : '隐藏'}
    </button>
  );
}

export default function AdminFacultyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [form, setForm] = useState<FacultyMemberBody>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)),
    [members]
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadMembers();
  }, [router, locale]);

  function loadMembers() {
    setLoading(true);
    facultyApi
      .adminList()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : '加载教师失败'))
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  function editMember(member: FacultyMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role || '',
      bio: member.bio || '',
      photo_url: member.photo_url || '',
      specialties: member.specialties || '',
      achievements: member.achievements || '',
      is_active: member.is_active,
      order_index: member.order_index || 0,
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('教师姓名必填');
      return;
    }

    setSaving(true);
    setError('');

    const body: FacultyMemberBody = {
      ...form,
      name: form.name.trim(),
      role: form.role?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
      photo_url: form.photo_url?.trim() || undefined,
      specialties: form.specialties?.trim() || undefined,
      achievements: form.achievements?.trim() || undefined,
      order_index: Number(form.order_index) || 0,
    };

    try {
      if (editingId) {
        await facultyApi.update(editingId, body);
      } else {
        await facultyApi.create(body);
      }
      resetForm();
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadApi.image(file);
      setForm((current) => ({ ...current, photo_url: uploaded.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传照片失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function removeMember(member: FacultyMember) {
    if (!window.confirm(`删除教师“${member.name}”吗？`)) return;
    setError('');
    try {
      await facultyApi.remove(member.id);
      if (editingId === member.id) resetForm();
      loadMembers();
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
              <UsersRound className="h-5 w-5 text-primary" />
              {editingId ? '编辑教师' : '新增教师'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-sm font-medium">姓名</span>
                <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">职位 / 授课方向</span>
                <Input
                  value={form.role || ''}
                  onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))}
                  placeholder="例如：Ballet / Jazz 教师"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium">照片</span>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-md border bg-slate-100">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt={form.name || '教师照片'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        无照片
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Button asChild type="button" variant="outline" disabled={uploading}>
                      <label className="cursor-pointer">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        上传照片
                        <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                      </label>
                    </Button>
                    <Input
                      value={form.photo_url || ''}
                      onChange={(e) => setForm((current) => ({ ...current, photo_url: e.target.value }))}
                      placeholder="或粘贴照片 URL"
                    />
                  </div>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">简介</span>
                <Textarea
                  rows={5}
                  value={form.bio || ''}
                  onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">擅长方向</span>
                <Textarea
                  rows={3}
                  value={form.specialties || ''}
                  onChange={(e) => setForm((current) => ({ ...current, specialties: e.target.value }))}
                  placeholder="每行一个，例如：Ballet"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">经历 / 成就</span>
                <Textarea
                  rows={4}
                  value={form.achievements || ''}
                  onChange={(e) => setForm((current) => ({ ...current, achievements: e.target.value }))}
                  placeholder="每行一个"
                />
              </label>

              <div className="flex items-center justify-between gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium">排序</span>
                  <Input
                    type="number"
                    className="w-24"
                    value={form.order_index}
                    onChange={(e) => setForm((current) => ({ ...current, order_index: Number(e.target.value) }))}
                  />
                </label>
                <VisibilitySwitch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
                />
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
            <CardTitle>教师列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : sortedMembers.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                还没有教师资料。左侧新增后，前台教师页面会自动显示。
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 rounded-md border bg-white p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                          {member.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{member.name}</h3>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs',
                            member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {member.is_active ? '显示' : '隐藏'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.role || '未填写职位'}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{member.bio || '未填写简介'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => editMember(member)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(member)}>
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
