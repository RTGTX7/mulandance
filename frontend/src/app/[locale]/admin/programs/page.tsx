'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type AiDraft, ProgramBody, ProgramItem, isAuthenticated, programApi, uploadApi } from '@/lib/api';
import { adminContentLanguageOptions, adminUiText } from '@/lib/admin-i18n';
import { cn, generateSlug } from '@/lib/utils';
import { BookOpen, Edit2, ImagePlus, Loader2, Save, Trash2, X } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';

type ContentLocale = 'zh' | 'en' | 'fr';

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

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

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
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[14px]' : 'translate-x-0.5')} />
      </span>
      {checked ? visibleLabel : hiddenLabel}
    </button>
  );
}

export default function AdminProgramsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = adminUiText(locale);
  const text = labels.resources.programs;
  const languageOptions = adminContentLanguageOptions(locale);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [contentLocale, setContentLocale] = useState<ContentLocale>('zh');
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
      .catch((err) => setError(err instanceof Error ? err.message : text.loadFailed))
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
      translations: program.translations || {},
    });
  }

  function localizedField(key: keyof ProgramBody) {
    if (contentLocale === 'zh') return String(form[key] ?? '');
    return form.translations?.[contentLocale]?.[String(key)] ?? '';
  }

  function setLocalizedField(key: keyof ProgramBody, value: string) {
    if (contentLocale === 'zh') {
      setForm((current) => ({ ...current, [key]: value, slug: key === 'name' && !editingId ? generateSlug(value) : current.slug }));
      return;
    }
    setForm((current) => ({
      ...current,
      name: key === 'name' && !current.name ? value : current.name,
      slug: key === 'name' && !current.slug ? generateSlug(value) : current.slug,
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
          next.description = fields.description ?? next.description;
          next.level = fields.level ?? next.level;
          next.syllabus_ref = fields.syllabus_ref ?? next.syllabus_ref;
          if (!editingId && !next.slug && next.name) next.slug = generateSlug(next.name);
          return;
        }
        const localeKey = draft.locale as ContentLocale;
        next.translations = {
          ...(next.translations || {}),
          [localeKey]: {
            ...(next.translations?.[localeKey] || {}),
            ...(fields.name ? { name: fields.name } : {}),
            ...(fields.description ? { description: fields.description } : {}),
            ...(fields.level ? { level: fields.level } : {}),
            ...(fields.syllabus_ref ? { syllabus_ref: fields.syllabus_ref } : {}),
          },
        };
        if (!next.name && fields.name) next.name = fields.name;
        if (!editingId && !next.slug && fields.name) next.slug = generateSlug(fields.name);
      });
      return next;
    });
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = file.type.startsWith('video/')
        ? await uploadApi.video(file, 'programs')
        : await uploadApi.image(file, 'programs');
      setForm((current) => ({ ...current, cover_image: uploaded.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.uploadFailed);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError(text.nameRequired);
      return;
    }
    if (!form.slug.trim()) {
      setError(text.slugRequired);
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
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function removeProgram(program: ProgramItem) {
    if (!window.confirm(text.deleteConfirm.replace('{name}', program.name))) return;
    setError('');
    try {
      await programApi.remove(program.id);
      if (editingId === program.id) resetForm();
      loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteFailed);
    }
  }

  async function toggleProgramVisibility(program: ProgramItem) {
    setError('');
    try {
      const updated = await programApi.update(program.id, { is_active: !program.is_active });
      setPrograms((current) => current.map((item) => (item.id === program.id ? updated : item)));
      if (editingId === program.id) {
        setForm((current) => ({ ...current, is_active: updated.is_active }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
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
              {editingId ? text.editTitle : text.newTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="space-y-4">
              {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

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
                module="programs"
                sourceLocale={contentLocale}
                uiLocale={locale}
                fields={{
                  name: localizedField('name'),
                  description: localizedField('description'),
                  level: localizedField('level'),
                  syllabus_ref: localizedField('syllabus_ref'),
                }}
                onApply={applyAiDrafts}
              />

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.name}</span>
                <Input
                  value={localizedField('name')}
                  onChange={(e) => setLocalizedField('name', e.target.value)}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Slug</span>
                <Input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: generateSlug(e.target.value) }))} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium">{text.category}</span>
                  <Input value={localizedField('category')} onChange={(e) => setLocalizedField('category', e.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">{text.level}</span>
                  <Input value={localizedField('level')} onChange={(e) => setLocalizedField('level', e.target.value)} />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">{text.coverImage}</span>
                <div className="space-y-2">
                  <div className="h-32 overflow-hidden rounded-md border bg-slate-100">
                    {form.cover_image ? (
                      isVideoUrl(form.cover_image) ? (
                        <video
                          src={form.cover_image}
                          className="h-full w-full object-cover"
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={form.cover_image} alt={form.name || text.coverImage} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text.noCover}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild type="button" variant="outline" disabled={uploading}>
                      <label className="cursor-pointer">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        {text.uploadCover}
                        <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,.mov" className="hidden" onChange={uploadCover} />
                      </label>
                    </Button>
                    <Input
                      value={form.cover_image || ''}
                      onChange={(e) => setForm((current) => ({ ...current, cover_image: e.target.value }))}
                      placeholder={text.pasteImageUrl}
                    />
                  </div>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.description}</span>
                <Textarea rows={5} value={localizedField('description')} onChange={(e) => setLocalizedField('description', e.target.value)} />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">{text.notes}</span>
                <Textarea
                  rows={3}
                  value={localizedField('syllabus_ref')}
                  onChange={(e) => setLocalizedField('syllabus_ref', e.target.value)}
                  placeholder={text.notesPlaceholder}
                />
              </label>

              <div className="flex items-center justify-between gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium">{labels.common.sort}</span>
                  <Input type="number" className="w-24" value={form.order_index} onChange={(e) => setForm((current) => ({ ...current, order_index: Number(e.target.value) }))} />
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
                <Loader2 className="h-4 w-4 animate-spin" /> {labels.resources.listLoading}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPrograms.map((program) => (
                  <div key={program.id} className="flex items-center gap-4 rounded-md border bg-white p-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {program.cover_image ? (
                        isVideoUrl(program.cover_image) ? (
                          <video
                            src={program.cover_image}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            autoPlay
                            loop
                          />
                        ) : (
                          <img src={program.cover_image} alt={program.name} className="h-full w-full object-cover" />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{labels.resources.noImage}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{program.name}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', program.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {program.is_active ? labels.resources.show : labels.resources.hidden}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">/{program.slug} · {program.level || program.category}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{program.description || text.emptyDescription}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <VisibilitySwitch
                        checked={program.is_active}
                        onCheckedChange={() => toggleProgramVisibility(program)}
                        visibleLabel={labels.resources.show}
                        hiddenLabel={labels.resources.hidden}
                      />
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
