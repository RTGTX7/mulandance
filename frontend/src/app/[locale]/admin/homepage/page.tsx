'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type AiDraft,
  HomepageSettings,
  HomepageSettingsBundle,
  HomepageHeroSlide,
  homepageApi,
  isAuthenticated,
  uploadApi,
} from '@/lib/api';
import { adminContentLanguageOptions, adminUiText } from '@/lib/admin-i18n';
import { toPublicMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { Eye, ImagePlus, Loader2, Plus, Save, Trash2, Video } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';

type PolicyLocale = 'zh' | 'en' | 'fr';

const emptySlides: Record<PolicyLocale, HomepageHeroSlide> = {
  zh: {
  badge: '木兰舞蹈工作室',
  title: '',
  subtitle: '',
  primary: { label: '查看开设课程', href: '/programs' },
  secondary: { label: '观看宣传片', href: 'https://www.youtube.com/@mulandancestudio21' },
  image_url: '',
  overlay: 'from-primary/90 via-primary/70 to-primary/40',
  is_active: true,
  },
  en: {
    badge: 'Mulan Dance Studio',
    title: '',
    subtitle: '',
    primary: { label: 'Explore Programs', href: '/programs' },
    secondary: { label: 'Watch Our Story', href: 'https://www.youtube.com/@mulandancestudio21' },
    image_url: '',
    overlay: 'from-primary/90 via-primary/70 to-primary/40',
    is_active: true,
  },
  fr: {
    badge: 'Mulan Dance Studio',
    title: '',
    subtitle: '',
    primary: { label: 'Découvrir les programmes', href: '/programs' },
    secondary: { label: 'Voir notre histoire', href: 'https://www.youtube.com/@mulandancestudio21' },
    image_url: '',
    overlay: 'from-primary/90 via-primary/70 to-primary/40',
    is_active: true,
  },
};

const defaultHomepageZh: HomepageSettings = {
  hero_slides: [emptySlides.zh],
  stats: [
    { value: '200+', label: '学员' },
    { value: '5+', label: '年教学经验' },
    { value: '100+', label: '演出次数' },
    { value: '5+', label: '专业教师' },
  ],
  cta: {
    title: '加入木兰舞蹈大家庭',
    subtitle: '2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766',
    note: '工作室期待你加入这个温暖的大家庭。',
    primary: { label: '立即报名', href: '/classes/register' },
    secondary: { label: '联系我们', href: '/about/contact' },
  },
};

const defaultHomepageEn: HomepageSettings = {
  hero_slides: [emptySlides.en],
  stats: [
    { value: '200+', label: 'Students' },
    { value: '5+', label: 'Years of Teaching' },
    { value: '100+', label: 'Performances' },
    { value: '5+', label: 'Professional Teachers' },
  ],
  cta: {
    title: 'Join the Mulan Dance Family',
    subtitle: '2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766',
    note: 'The studio looks forward to welcoming you into this warm dance community.',
    primary: { label: 'Register Now', href: '/classes/register' },
    secondary: { label: 'Contact Us', href: '/about/contact' },
  },
};

const defaultHomepageFr: HomepageSettings = {
  hero_slides: [emptySlides.fr],
  stats: [
    { value: '200+', label: 'Élèves' },
    { value: '5+', label: 'Années d’enseignement' },
    { value: '100+', label: 'Spectacles' },
    { value: '5+', label: 'Professeurs professionnels' },
  ],
  cta: {
    title: 'Rejoignez la famille Mulan Dance',
    subtitle: '2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766',
    note: 'Le studio a hâte de vous accueillir dans cette communauté chaleureuse.',
    primary: { label: 'Inscrivez-vous', href: '/classes/register' },
    secondary: { label: 'Contactez-nous', href: '/about/contact' },
  },
};

const defaultHomepageBundle: HomepageSettingsBundle = {
  zh: defaultHomepageZh,
  en: defaultHomepageEn,
  fr: defaultHomepageFr,
};

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function isVideoFile(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
}

function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
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
      {label}
    </button>
  );
}

export default function AdminHomepagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = adminUiText(locale);
  const languageOptions = adminContentLanguageOptions(locale);
  const [forms, setForms] = useState<HomepageSettingsBundle>(defaultHomepageBundle);
  const [contentLocale, setContentLocale] = useState<PolicyLocale>('zh');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    homepageApi
      .getAll()
      .then((settings) => {
        setForms({ ...defaultHomepageBundle, ...settings });
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : labels.homepage.loadFailed))
      .finally(() => setLoading(false));
  }, [router, locale, labels.homepage.loadFailed]);

  const form = forms[contentLocale];

  function setCurrentForm(updater: (current: HomepageSettings) => HomepageSettings) {
    setForms((current) => ({
      ...current,
      [contentLocale]: updater(current[contentLocale]),
    }));
  }

  function setSlide(index: number, patch: Partial<HomepageHeroSlide>) {
    setCurrentForm((current) => ({
      ...current,
      hero_slides: current.hero_slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, ...patch } : slide
      ),
    }));
  }

  function setSlideButton(index: number, key: 'primary' | 'secondary', field: 'label' | 'href', value: string) {
    setCurrentForm((current) => ({
      ...current,
      hero_slides: current.hero_slides.map((slide, slideIndex) =>
        slideIndex === index
          ? { ...slide, [key]: { ...slide[key], [field]: value } }
          : slide
      ),
    }));
  }

  function addSlide() {
    setCurrentForm((current) => ({
      ...current,
      hero_slides: [...current.hero_slides, { ...emptySlides[contentLocale] }],
    }));
  }

  function removeSlide(index: number) {
    setCurrentForm((current) => ({
      ...current,
      hero_slides: current.hero_slides.filter((_, slideIndex) => slideIndex !== index),
    }));
  }

  function setStat(index: number, field: 'value' | 'label', value: string) {
    setCurrentForm((current) => ({
      ...current,
      stats: current.stats.map((stat, statIndex) =>
        statIndex === index ? { ...stat, [field]: value } : stat
      ),
    }));
  }

  function setCta<K extends keyof HomepageSettings['cta']>(key: K, value: HomepageSettings['cta'][K]) {
    setCurrentForm((current) => ({ ...current, cta: { ...current.cta, [key]: value } }));
  }

  function setCtaButton(key: 'primary' | 'secondary', field: 'label' | 'href', value: string) {
    setCurrentForm((current) => ({
      ...current,
      cta: {
        ...current.cta,
        [key]: { ...current.cta[key], [field]: value },
      },
    }));
  }

  function applyHomepageAiDrafts(drafts: AiDraft[]) {
    setForms((current) => {
      const next = { ...current };
      drafts.forEach((draft) => {
        if (!['zh', 'en', 'fr'].includes(draft.locale)) return;
        const localeKey = draft.locale as PolicyLocale;
        const fields = draft.fields || {};
        const currentLocaleForm = next[localeKey] || defaultHomepageBundle[localeKey];
        const firstSlide = currentLocaleForm.hero_slides[0] || emptySlides[localeKey];
        next[localeKey] = {
          ...currentLocaleForm,
          hero_slides: [
            {
              ...firstSlide,
              ...(fields.badge ? { badge: fields.badge } : {}),
              ...(fields.title ? { title: fields.title } : {}),
              ...(fields.subtitle ? { subtitle: fields.subtitle } : {}),
              primary: {
                ...firstSlide.primary,
                ...(fields.primary_label ? { label: fields.primary_label } : {}),
              },
              secondary: {
                ...firstSlide.secondary,
                ...(fields.secondary_label ? { label: fields.secondary_label } : {}),
              },
            },
            ...currentLocaleForm.hero_slides.slice(1),
          ],
          cta: {
            ...currentLocaleForm.cta,
            ...(fields.cta_title ? { title: fields.cta_title } : {}),
            ...(fields.cta_subtitle ? { subtitle: fields.cta_subtitle } : {}),
            ...(fields.cta_note ? { note: fields.cta_note } : {}),
            primary: {
              ...currentLocaleForm.cta.primary,
              ...(fields.cta_primary_label ? { label: fields.cta_primary_label } : {}),
            },
            secondary: {
              ...currentLocaleForm.cta.secondary,
              ...(fields.cta_secondary_label ? { label: fields.cta_secondary_label } : {}),
            },
          },
        };
      });
      return next;
    });
  }

  async function uploadSlideMedia(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
    setError('');
    try {
      const uploaded = isVideoFile(file)
        ? await uploadApi.video(file)
        : await uploadApi.image(file);
      setSlide(index, { image_url: uploaded.url });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.uploadFailed);
    } finally {
      setUploadingIndex(null);
      event.target.value = '';
    }
  }

  async function saveHomepage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const saved = await homepageApi.updateAll(forms);
      setForms({ ...defaultHomepageBundle, ...saved });
      setMessage(labels.homepage.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={saveHomepage} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{labels.homepage.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{labels.homepage.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => window.open(`/${locale}`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />
                {labels.homepage.preview}
              </Button>
              <Button type="submit" disabled={loading || saving || uploadingIndex !== null}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {labels.homepage.save}
              </Button>
            </div>
          </div>

          {(error || message) && (
            <div className={cn('rounded-md border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
              {error || message}
            </div>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 py-4">
              <span className="mr-1 text-sm font-medium text-muted-foreground">{labels.common.editingLanguage}</span>
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
            </CardContent>
          </Card>

          <AiLocaleSyncPanel
            module="homepage"
            sourceLocale={contentLocale}
            fields={{
              badge: form.hero_slides[0]?.badge || '',
              title: form.hero_slides[0]?.title || '',
              subtitle: form.hero_slides[0]?.subtitle || '',
              primary_label: form.hero_slides[0]?.primary?.label || '',
              secondary_label: form.hero_slides[0]?.secondary?.label || '',
              cta_title: form.cta.title,
              cta_subtitle: form.cta.subtitle,
              cta_note: form.cta.note,
              cta_primary_label: form.cta.primary.label,
              cta_secondary_label: form.cta.secondary.label,
            }}
            onApply={applyHomepageAiDrafts}
          />

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.homepage.loading}
              </CardContent>
            </Card>
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{labels.homepage.heroSlides}</h2>
                  <Button type="button" variant="outline" onClick={addSlide}>
                    <Plus className="mr-2 h-4 w-4" />
                    {labels.homepage.addSlide}
                  </Button>
                </div>

                {form.hero_slides.map((slide, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                      <CardTitle className="text-base">{labels.homepage.slide} {index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={slide.is_active}
                          onCheckedChange={(checked) => setSlide(index, { is_active: checked })}
                          label={slide.is_active ? labels.common.show : labels.common.hide}
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSlide(index)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium">{labels.homepage.badge}</span>
                          <Input value={slide.badge} onChange={(e) => setSlide(index, { badge: e.target.value })} />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium">{labels.homepage.mainTitle}</span>
                          <Input value={slide.title} onChange={(e) => setSlide(index, { title: e.target.value })} />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium">{labels.common.subtitle}</span>
                          <Textarea rows={2} value={slide.subtitle} onChange={(e) => setSlide(index, { subtitle: e.target.value })} />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-medium">{labels.homepage.primaryButtonText}</span>
                          <Input value={slide.primary.label} onChange={(e) => setSlideButton(index, 'primary', 'label', e.target.value)} />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-medium">{labels.homepage.primaryButtonLink}</span>
                          <Input value={slide.primary.href} onChange={(e) => setSlideButton(index, 'primary', 'href', e.target.value)} />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-medium">{labels.homepage.secondaryButtonText}</span>
                          <Input value={slide.secondary.label} onChange={(e) => setSlideButton(index, 'secondary', 'label', e.target.value)} />
                        </label>
                        <label className="space-y-1">
                          <span className="text-sm font-medium">{labels.homepage.secondaryButtonLink}</span>
                          <Input value={slide.secondary.href} onChange={(e) => setSlideButton(index, 'secondary', 'href', e.target.value)} />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium">{labels.homepage.backgroundMediaUrl}</span>
                          <Input value={slide.image_url} onChange={(e) => setSlide(index, { image_url: e.target.value })} placeholder={labels.homepage.backgroundPlaceholder} />
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div className="aspect-video overflow-hidden rounded-md border bg-slate-100">
                          {toPublicMediaUrl(slide.image_url) && isVideoUrl(toPublicMediaUrl(slide.image_url)) ? (
                            <video src={toPublicMediaUrl(slide.image_url)} className="h-full w-full object-cover" controls muted playsInline />
                          ) : slide.image_url ? (
                            <img src={toPublicMediaUrl(slide.image_url)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{labels.common.noMedia}</div>
                          )}
                        </div>
                        <Button asChild type="button" variant="outline" disabled={uploadingIndex === index}>
                          <label className="w-full cursor-pointer">
                            {uploadingIndex === index ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isVideoUrl(slide.image_url) ? (
                              <Video className="mr-2 h-4 w-4" />
                            ) : (
                              <ImagePlus className="mr-2 h-4 w-4" />
                            )}
                            {labels.common.uploadMedia}
                            <input type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,.mov" className="hidden" onChange={(event) => uploadSlideMedia(index, event)} />
                          </label>
                        </Button>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium">{labels.homepage.overlay}</span>
                          <Input value={slide.overlay} onChange={(e) => setSlide(index, { overlay: e.target.value })} />
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.homepage.stats}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  {form.stats.map((stat, index) => (
                    <div key={index} className="grid gap-2">
                      <Input value={stat.value} onChange={(e) => setStat(index, 'value', e.target.value)} placeholder="200+" />
                      <Input value={stat.label} onChange={(e) => setStat(index, 'label', e.target.value)} placeholder={labels.homepage.statLabelPlaceholder} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.homepage.cta}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium">{labels.common.title}</span>
                    <Input value={form.cta.title} onChange={(e) => setCta('title', e.target.value)} />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium">{labels.common.subtitle}</span>
                    <Input value={form.cta.subtitle} onChange={(e) => setCta('subtitle', e.target.value)} />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium">{labels.homepage.note}</span>
                    <Textarea rows={3} value={form.cta.note} onChange={(e) => setCta('note', e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">{labels.homepage.primaryButtonText}</span>
                    <Input value={form.cta.primary.label} onChange={(e) => setCtaButton('primary', 'label', e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">{labels.homepage.primaryButtonLink}</span>
                    <Input value={form.cta.primary.href} onChange={(e) => setCtaButton('primary', 'href', e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">{labels.homepage.secondaryButtonText}</span>
                    <Input value={form.cta.secondary.label} onChange={(e) => setCtaButton('secondary', 'label', e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">{labels.homepage.secondaryButtonLink}</span>
                    <Input value={form.cta.secondary.href} onChange={(e) => setCtaButton('secondary', 'href', e.target.value)} />
                  </label>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
