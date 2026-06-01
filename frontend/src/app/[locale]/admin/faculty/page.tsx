'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type AiDraft,
  FacultyMember,
  FacultyMemberBody,
  facultyApi,
  isAuthenticated,
  uploadApi,
} from '@/lib/api';
import { adminContentLanguageOptions, adminUiText, contentLocaleFromPath } from '@/lib/admin-i18n';
import { cn } from '@/lib/utils';
import { Edit2, ImagePlus, Loader2, Save, Trash2, UsersRound, X } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';

type ContentLocale = 'zh' | 'en' | 'fr';

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
  visibleLabel,
  hiddenLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  visibleLabel: string;
  hiddenLabel: string;
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
      {checked ? visibleLabel : hiddenLabel}
    </button>
  );
}

export default function AdminFacultyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = adminUiText(locale);
  const text = labels.resources.faculty;
  const languageOptions = adminContentLanguageOptions(locale);
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [form, setForm] = useState<FacultyMemberBody>(emptyForm);
  const [contentLocale, setContentLocale] = useState<ContentLocale>(() => contentLocaleFromPath(locale));
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
    setContentLocale(contentLocaleFromPath(locale));
  }, [locale]);

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
      .catch((err) => setError(err instanceof Error ? err.message : text.loadFailed))
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
      translations: member.translations || {},
    });
  }

  function localizedField(key: keyof FacultyMemberBody) {
    if (contentLocale === 'zh') return String(form[key] ?? '');
    return form.translations?.[contentLocale]?.[String(key)] ?? '';
  }

  function setLocalizedField(key: keyof FacultyMemberBody, value: string) {
    if (contentLocale === 'zh') {
      setForm((current) => ({ ...current, [key]: value }));
      return;
    }
    setForm((current) => ({
      ...current,
      name: key === 'name' && !current.name ? value : current.name,
      translations: {
        ...(current.translations || {}),
        [contentLocale]: {
          ...(current.translations?.[contentLocale] || {}),
          [String(key)]: value,
        },
      },
    }));
  }

  function applyAiDrafts(drafts: AiDraft[]) {
    setForm((current) => {
      const next = { ...current, translations: { ...(current.translations || {}) } };
      drafts.forEach((draft) => {
        const fields = draft.fields || {};
        if (draft.locale === 'zh') {
          next.name = fields.name ?? next.name;
          next.role = fields.role ?? next.role;
          next.bio = fields.bio ?? next.bio;
          next.specialties = fields.specialties ?? next.specialties;
          next.achievements = fields.achievements ?? next.achievements;
          return;
        }
        const localeKey = draft.locale as ContentLocale;
        next.translations = {
          ...(next.translations || {}),
          [localeKey]: {
            ...(next.translations?.[localeKey] || {}),
            ...(fields.name ? { name: fields.name } : {}),
            ...(fields.role ? { role: fields.role } : {}),
            ...(fields.bio ? { bio: fields.bio } : {}),
            ...(fields.specialties ? { specialties: fields.specialties } : {}),
            ...(fields.achievements ? { achievements: fields.achievements } : {}),
          },
        };
        if (!next.name && fields.name) next.name = fields.name;
      });
      return next;
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError(text.nameRequired);
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
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
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
      setError(err instanceof Error ? err.message : text.uploadFailed);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function removeMember(member: FacultyMember) {
    if (!window.confirm(text.deleteConfirm.replace('{name}', member.name))) return;
    setError('');
    try {
      await facultyApi.remove(member.id);
      if (editingId === member.id) resetForm();
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteFailed);
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
              {editingId ? text.editTitle : text.newTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {languageOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={contentLocale === option.value ? 'default' : 'outline'}
                    onClick={() => setContentLocale(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <AiLocaleSyncPanel
                module="faculty"
                sourceLocale={contentLocale}
                fields={{
                  name: localizedField('name'),
                  role: localizedField('role'),
                  bio: localizedField('bio'),
                  specialties: localizedField('specialties'),
                  achievements: localizedField('achievements'),
                }}
                onApply={applyAiDrafts}
              />

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.name}</span>
                <Input value={localizedField('name')} onChange={(e) => setLocalizedField('name', e.target.value)} />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.role}</span>
                <Input
                  value={localizedField('role')}
                  onChange={(e) => setLocalizedField('role', e.target.value)}
                  placeholder={text.rolePlaceholder}
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium">{text.photo}</span>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-md border bg-slate-100">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt={form.name || text.photo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {text.noPhoto}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Button asChild type="button" variant="outline" disabled={uploading}>
                      <label className="cursor-pointer">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        {text.uploadPhoto}
                        <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                      </label>
                    </Button>
                    <Input
                      value={form.photo_url || ''}
                      onChange={(e) => setForm((current) => ({ ...current, photo_url: e.target.value }))}
                      placeholder={text.pastePhotoUrl}
                    />
                  </div>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.bio}</span>
                <Textarea
                  rows={5}
                  value={localizedField('bio')}
                  onChange={(e) => setLocalizedField('bio', e.target.value)}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.specialties}</span>
                <Textarea
                  rows={3}
                  value={localizedField('specialties')}
                  onChange={(e) => setLocalizedField('specialties', e.target.value)}
                  placeholder={text.specialtiesPlaceholder}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.achievements}</span>
                <Textarea
                  rows={4}
                  value={localizedField('achievements')}
                  onChange={(e) => setLocalizedField('achievements', e.target.value)}
                  placeholder={text.onePerLine}
                />
              </label>

              <div className="flex items-center justify-between gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium">{labels.common.sort}</span>
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
                  visibleLabel={labels.resources.visibleOnSite}
                  hiddenLabel={labels.resources.hidden}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {labels.common.save}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" />
                    {labels.resources.cancel}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.list}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.resources.listLoading}
              </div>
            ) : sortedMembers.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {text.empty}
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
                          {member.is_active ? labels.resources.show : labels.resources.hidden}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.role || text.missingRole}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{member.bio || text.missingBio}</p>
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
