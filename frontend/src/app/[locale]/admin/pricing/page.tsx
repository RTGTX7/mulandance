'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Copy, DollarSign, Eye, ImagePlus, Loader2, Plus, Save, Send, Trash2 } from 'lucide-react';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';
import { PricingCatalogView } from '@/components/pricing/PricingCatalogView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  type AiDraft, type LocaleCode, type PricingCatalog, type PricingCatalogKind,
  type PricingContentBlock, type PricingOption, type PricingPlan, type PricingTranslations,
  type ProgramItem, type Studio, type StudioRoom,
  isAuthenticated, pricingApi, programApi, unifiedScheduleApi, uploadApi, usersApi,
} from '@/lib/api';

const LANGUAGES: Array<{ value: LocaleCode; label: string }> = [
  { value: 'zh', label: '中文' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' },
];

const copy = {
  zh: { title: '价格管理', subtitle: '编辑课程与教室租赁价格，保存草稿、三语预览后再发布。', program: '课程价格', rental: '租赁价格', draft: '草稿', published: '已发布', unsaved: '有未发布修改', save: '保存草稿', preview: '预览', hidePreview: '关闭预览', publish: '发布', language: '内容语言', catalog: '页面标题', plans: '价格方案', addPlan: '添加通用方案', blocks: '页面内容区块', addBlock: '添加区块', name: '名称', description: '说明', badge: '徽标', image: '图片', programLink: '关联课程（可选）', general: '通用方案', room: '关联可出租教室', pendingRoom: '待设置价格', active: '显示', featured: '主推', options: '价格选项', addOption: '添加价格', priceLabel: '价格名称', amount: '金额', currency: '币种', unit: '计费单位', note: '补充说明', details: '方案要点（每行一项）', blockType: '区块类型', body: '正文', items: '列表内容（每行一项）', info: '信息', payment: '付款方式', notice: '重要说明', cta: '行动按钮', duplicate: '复制', remove: '删除', noRentable: '没有启用对外出租的教室，请先到 System → Studio Resources 设置。', saved: '草稿已保存。', publishedDone: '价格已发布，公开页面已经更新。', loadFailed: '无法加载价格资料。', saveFailed: '无法保存价格资料。', upload: '上传图片', aiTitle: 'AI 补齐当前方案三语', aiHelp: '只处理当前方案文字，不修改金额、课程或教室关联。', lastPublished: '最后发布', never: '尚未发布' },
  en: { title: 'Pricing', subtitle: 'Edit program and rental pricing, save drafts, preview all languages, then publish.', program: 'Program Pricing', rental: 'Rental Pricing', draft: 'Draft', published: 'Published', unsaved: 'Unpublished changes', save: 'Save draft', preview: 'Preview', hidePreview: 'Close preview', publish: 'Publish', language: 'Content language', catalog: 'Page heading', plans: 'Pricing plans', addPlan: 'Add general plan', blocks: 'Page content blocks', addBlock: 'Add block', name: 'Name', description: 'Description', badge: 'Badge', image: 'Image', programLink: 'Linked program (optional)', general: 'General plan', room: 'Linked rentable room', pendingRoom: 'Pricing needed', active: 'Visible', featured: 'Featured', options: 'Price options', addOption: 'Add price', priceLabel: 'Price label', amount: 'Amount', currency: 'Currency', unit: 'Billing unit', note: 'Supporting note', details: 'Plan details (one per line)', blockType: 'Block type', body: 'Body', items: 'List items (one per line)', info: 'Information', payment: 'Payment', notice: 'Notice', cta: 'Call to action', duplicate: 'Duplicate', remove: 'Remove', noRentable: 'No rentable rooms are enabled. Configure them under System → Studio Resources.', saved: 'Draft saved.', publishedDone: 'Pricing published and public pages updated.', loadFailed: 'Unable to load pricing.', saveFailed: 'Unable to save pricing.', upload: 'Upload image', aiTitle: 'AI fill this plan’s languages', aiHelp: 'Only translates this plan’s copy. Prices and resource links are unchanged.', lastPublished: 'Last published', never: 'Never' },
  fr: { title: 'Tarifs', subtitle: 'Modifiez les tarifs, enregistrez un brouillon, prévisualisez les langues puis publiez.', program: 'Tarifs des cours', rental: 'Tarifs de location', draft: 'Brouillon', published: 'Publié', unsaved: 'Modifications non publiées', save: 'Enregistrer le brouillon', preview: 'Aperçu', hidePreview: 'Fermer l’aperçu', publish: 'Publier', language: 'Langue du contenu', catalog: 'En-tête de page', plans: 'Forfaits', addPlan: 'Ajouter un forfait général', blocks: 'Blocs de contenu', addBlock: 'Ajouter un bloc', name: 'Nom', description: 'Description', badge: 'Badge', image: 'Image', programLink: 'Programme associé (facultatif)', general: 'Forfait général', room: 'Salle louable associée', pendingRoom: 'Tarif à définir', active: 'Visible', featured: 'Recommandé', options: 'Options tarifaires', addOption: 'Ajouter un tarif', priceLabel: 'Libellé', amount: 'Montant', currency: 'Devise', unit: 'Unité', note: 'Note', details: 'Détails (une ligne par élément)', blockType: 'Type de bloc', body: 'Texte', items: 'Éléments (une ligne par élément)', info: 'Information', payment: 'Paiement', notice: 'Avis important', cta: 'Appel à l’action', duplicate: 'Dupliquer', remove: 'Supprimer', noRentable: 'Aucune salle n’est disponible à la location. Configurez-la dans System → Studio Resources.', saved: 'Brouillon enregistré.', publishedDone: 'Tarifs publiés et pages publiques mises à jour.', loadFailed: 'Impossible de charger les tarifs.', saveFailed: 'Impossible d’enregistrer les tarifs.', upload: 'Téléverser une image', aiTitle: 'IA : compléter les langues du forfait', aiHelp: 'Seuls les textes sont traduits. Les prix et ressources restent inchangés.', lastPublished: 'Dernière publication', never: 'Jamais' },
} as const;

const imageText = {
  zh: { title: '教室展示图片', help: '建议上传清晰的教室实景横图。保存草稿后预览，发布后显示在租赁价格页。', empty: '尚未上传图片', upload: '上传或替换', remove: '删除图片', url: '也可以填写图片 URL' },
  en: { title: 'Room display image', help: 'Use a clear landscape photo of the actual room. Preview it in the draft, then publish it to the rental pricing page.', empty: 'No image uploaded', upload: 'Upload or replace', remove: 'Remove image', url: 'You can also enter an image URL' },
  fr: { title: 'Image de présentation de la salle', help: 'Utilisez une photo horizontale claire de la salle. Prévisualisez le brouillon, puis publiez-la sur la page des tarifs.', empty: 'Aucune image téléversée', upload: 'Téléverser ou remplacer', remove: 'Supprimer l’image', url: 'Vous pouvez aussi saisir une URL d’image' },
} as const;

function uiLocale(pathname: string): LocaleCode { const value = pathname.split('/')[1]; return value === 'fr' ? 'fr' : value === 'en' ? 'en' : 'zh'; }
function blankTranslations(): PricingTranslations { return { zh: {}, en: {}, fr: {} }; }
function newOption(): PricingOption { return { label: '', amount: '', currency: 'CAD', unit: '', note: '', sort_order: 0, translations: blankTranslations() }; }
function newPlan(roomId?: string): PricingPlan { return { program_id: null, room_id: roomId || null, title: '', description: '', badge: '', image_url: '', details: [], is_active: true, is_featured: false, sort_order: 0, translations: blankTranslations(), options: [newOption()] }; }
function newBlock(): PricingContentBlock { return { block_type: 'info', title: '', body: '', items: [], is_active: true, sort_order: 0, translations: blankTranslations() }; }

function localized<T extends { translations: PricingTranslations }>(entity: T, field: string, locale: LocaleCode): string {
  const translated = entity.translations?.[locale]?.[field];
  const source = (entity as unknown as Record<string, unknown>)[field];
  return typeof translated === 'string' ? translated : locale === 'zh' && typeof source === 'string' ? source : '';
}
function localizedList<T extends { translations: PricingTranslations }>(entity: T, field: string, locale: LocaleCode): string[] {
  const translated = entity.translations?.[locale]?.[field];
  const source = (entity as unknown as Record<string, unknown>)[field];
  return Array.isArray(translated) ? translated.map(String) : locale === 'zh' && Array.isArray(source) ? source.map(String) : [];
}
function setLocalized<T extends { translations: PricingTranslations }>(entity: T, field: string, value: string | string[], locale: LocaleCode): T {
  const next = { ...entity, translations: { ...entity.translations, [locale]: { ...(entity.translations?.[locale] || {}), [field]: value } } } as T;
  if (locale === 'zh') (next as Record<string, unknown>)[field] = value;
  return next;
}
function setLocalizedIfMissing<T extends { translations: PricingTranslations }>(entity: T, field: string, value: string | string[], locale: LocaleCode): T {
  const existing = entity.translations?.[locale]?.[field];
  if ((typeof existing === 'string' && existing.trim()) || (Array.isArray(existing) && existing.length > 0)) return entity;
  return setLocalized(entity, field, value, locale);
}
function localizeCatalog(catalog: PricingCatalog, locale: LocaleCode): PricingCatalog {
  return {
    ...catalog, title: localized(catalog, 'title', locale), subtitle: localized(catalog, 'subtitle', locale),
    plans: catalog.plans.map((plan) => ({ ...plan, title: localized(plan, 'title', locale), description: localized(plan, 'description', locale), badge: localized(plan, 'badge', locale), details: localizedList(plan, 'details', locale), options: plan.options.map((option) => ({ ...option, label: localized(option, 'label', locale), unit: localized(option, 'unit', locale), note: localized(option, 'note', locale) })) })),
    blocks: catalog.blocks.map((block) => ({ ...block, title: localized(block, 'title', locale), body: localized(block, 'body', locale), items: localizedList(block, 'items', locale) })),
  };
}

export default function AdminPricingPage() {
  const pathname = usePathname(); const router = useRouter(); const locale = uiLocale(pathname); const t = copy[locale];
  const [kind, setKind] = useState<PricingCatalogKind>('program'); const [contentLocale, setContentLocale] = useState<LocaleCode>('zh');
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null); const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [rooms, setRooms] = useState<StudioRoom[]>([]); const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState<number | null>(null);
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [preview, setPreview] = useState(false);

  const load = async (nextKind = kind) => {
    setLoading(true); setError('');
    try {
      const me = await usersApi.me(); if (me.role !== 'super_admin') { router.replace(`/${pathname.split('/')[1]}/admin/dashboard`); return; }
      const [data, nextPrograms, nextRooms, nextStudios] = await Promise.all([pricingApi.adminCatalog(nextKind), programApi.adminList(), unifiedScheduleApi.resources(false), unifiedScheduleApi.studios()]);
      setCatalog(data); setPrograms(nextPrograms); setRooms(nextRooms); setStudios(nextStudios);
    } catch (err) { setError(err instanceof Error ? err.message : t.loadFailed); } finally { setLoading(false); }
  };
  useEffect(() => { if (!isAuthenticated()) { router.replace(`/${pathname.split('/')[1]}/admin/login`); return; } void load(kind); }, [kind]);

  const rentableRooms = useMemo(() => rooms.filter((room) => room.is_active && room.is_rentable), [rooms]);
  const usedRoomIds = new Set(catalog?.plans.map((plan) => plan.room_id).filter(Boolean));
  const updatePlan = (index: number, change: (plan: PricingPlan) => PricingPlan) => setCatalog((current) => current ? ({ ...current, is_dirty: true, plans: current.plans.map((plan, itemIndex) => itemIndex === index ? change(plan) : plan) }) : current);
  const updateBlock = (index: number, change: (block: PricingContentBlock) => PricingContentBlock) => setCatalog((current) => current ? ({ ...current, is_dirty: true, blocks: current.blocks.map((block, itemIndex) => itemIndex === index ? change(block) : block) }) : current);
  const move = <T,>(items: T[], index: number, offset: number) => { const target = index + offset; if (target < 0 || target >= items.length) return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; };

  const save = async (publish = false) => {
    if (!catalog) return; setSaving(true); setError(''); setMessage('');
    try {
      const normalized = { ...catalog, plans: catalog.plans.map((plan, index) => ({ ...plan, sort_order: index, options: plan.options.map((option, optionIndex) => ({ ...option, amount: option.amount || '0', sort_order: optionIndex })) })), blocks: catalog.blocks.map((block, index) => ({ ...block, sort_order: index })) };
      const saved = await pricingApi.saveDraft(kind, normalized); setCatalog(saved);
      if (publish) { const result = await pricingApi.publish(kind); setCatalog(result.catalog); setMessage(t.publishedDone); } else setMessage(t.saved);
    } catch (err) { setError(err instanceof Error ? err.message : t.saveFailed); } finally { setSaving(false); }
  };

  const uploadImage = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; setUploading(index);
    try { const result = await uploadApi.image(file, 'pricing'); updatePlan(index, (plan) => ({ ...plan, image_url: result.url })); } catch (err) { setError(err instanceof Error ? err.message : t.saveFailed); } finally { setUploading(null); event.target.value = ''; }
  };

  if (loading || !catalog) return <div className="min-h-screen bg-muted/30"><header className="border-b bg-card"><div className="mx-auto max-w-7xl px-4 py-4"><AdminSectionTabs /></div></header><div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-10 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-card"><div className="mx-auto max-w-7xl px-4 py-4"><AdminSectionTabs /></div></header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div><h1 className="flex items-center gap-2 text-2xl font-bold"><DollarSign className="h-6 w-6 text-primary" />{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p><p className="mt-2 text-xs text-muted-foreground">{catalog.is_dirty ? t.unsaved : t.published} · {t.lastPublished}: {catalog.published_at ? new Date(catalog.published_at).toLocaleString() : t.never}</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void save(false)} disabled={saving}><Save className="mr-2 h-4 w-4" />{t.save}</Button><Button type="button" variant="outline" onClick={() => setPreview((value) => !value)}><Eye className="mr-2 h-4 w-4" />{preview ? t.hidePreview : t.preview}</Button><Button type="button" onClick={() => void save(true)} disabled={saving}><Send className="mr-2 h-4 w-4" />{t.publish}</Button></div>
        </div>
        <div className="flex flex-wrap gap-2 border-b pb-2">{(['program', 'rental'] as PricingCatalogKind[]).map((item) => <Button key={item} type="button" variant={kind === item ? 'default' : 'ghost'} onClick={() => { setKind(item); setPreview(false); }}>{item === 'program' ? t.program : t.rental}</Button>)}</div>
        {(error || message) && <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}
        <Card><CardContent className="flex flex-wrap items-center gap-2 py-4"><span className="mr-2 text-sm font-medium">{t.language}</span>{LANGUAGES.map((language) => <Button key={language.value} type="button" size="sm" variant={contentLocale === language.value ? 'default' : 'outline'} onClick={() => setContentLocale(language.value)}>{language.label}</Button>)}</CardContent></Card>
        {preview && <div className="overflow-hidden border bg-white shadow-sm"><PricingCatalogView catalog={localizeCatalog(catalog, contentLocale)} locale={contentLocale} preview /></div>}

        <Card><CardHeader><CardTitle>{t.catalog}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><label className="space-y-1"><span className="text-sm font-medium">{t.name}</span><Input value={localized(catalog, 'title', contentLocale)} onChange={(event) => setCatalog(setLocalized({ ...catalog, is_dirty: true }, 'title', event.target.value, contentLocale))} /></label><label className="space-y-1"><span className="text-sm font-medium">{t.description}</span><Textarea value={localized(catalog, 'subtitle', contentLocale)} onChange={(event) => setCatalog(setLocalized({ ...catalog, is_dirty: true }, 'subtitle', event.target.value, contentLocale))} /></label></CardContent></Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t.plans}</CardTitle>{kind === 'program' && <Button type="button" size="sm" variant="outline" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: [...catalog.plans, newPlan()] })}><Plus className="mr-2 h-4 w-4" />{t.addPlan}</Button>}</CardHeader>
          <CardContent className="space-y-4">
            {kind === 'rental' && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rentableRooms.filter((room) => !usedRoomIds.has(room.id)).map((room) => <Button key={room.id} type="button" variant="outline" className="h-auto justify-between py-3" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: [...catalog.plans, newPlan(room.id)] })}><span>{studios.find((studio) => studio.id === room.studio_id)?.name} · {room.name}</span><span className="text-xs text-amber-700">{t.pendingRoom}</span></Button>)}</div>}
            {kind === 'rental' && rentableRooms.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{t.noRentable}</p>}
            {catalog.plans.map((plan, index) => (
              <details key={plan.id || index} className="group border bg-white" open={index === 0}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3"><div><span className="font-semibold">{localized(plan, 'title', contentLocale) || plan.room_name || `${t.plans} ${index + 1}`}</span>{plan.is_featured && <span className="ml-2 text-xs text-fuchsia-700">{t.featured}</span>}</div><div className="flex items-center gap-2 text-xs text-muted-foreground">{plan.is_active ? t.active : t.draft}</div></summary>
                <div className="space-y-5 border-t p-4">
                  <div className="grid gap-3 lg:grid-cols-3">
                    {kind === 'program' ? <label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.programLink}</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={plan.program_id || ''} onChange={(event) => updatePlan(index, (item) => ({ ...item, program_id: event.target.value || null }))}><option value="">{t.general}</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label> : <label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.room}</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={plan.room_id || ''} onChange={(event) => updatePlan(index, (item) => ({ ...item, room_id: event.target.value || null }))}><option value="">—</option>{rentableRooms.map((room) => <option key={room.id} value={room.id}>{studios.find((studio) => studio.id === room.studio_id)?.name} · {room.name}</option>)}</select></label>}
                    <label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.name}</span><Input value={localized(plan, 'title', contentLocale)} onChange={(event) => updatePlan(index, (item) => setLocalized(item, 'title', event.target.value, contentLocale))} /></label>
                    <label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.badge}</span><Input value={localized(plan, 'badge', contentLocale)} onChange={(event) => updatePlan(index, (item) => setLocalized(item, 'badge', event.target.value, contentLocale))} /></label>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2"><label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.description}</span><Textarea value={localized(plan, 'description', contentLocale)} onChange={(event) => updatePlan(index, (item) => setLocalized(item, 'description', event.target.value, contentLocale))} /></label><label className="space-y-1"><span className="text-xs font-semibold uppercase text-muted-foreground">{t.details}</span><Textarea value={localizedList(plan, 'details', contentLocale).join('\n')} onChange={(event) => updatePlan(index, (item) => setLocalized(item, 'details', event.target.value.split(/\r?\n/).filter(Boolean), contentLocale))} /></label></div>
                  {kind === 'rental' && (
                    <section className="grid overflow-hidden border bg-slate-50 md:grid-cols-[240px_1fr]">
                      <div className="aspect-[4/3] bg-slate-100 md:aspect-auto md:min-h-[180px]">
                        {plan.image_url ? <img src={plan.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-sm text-slate-400"><ImagePlus className="h-7 w-7" /><span>{imageText[locale].empty}</span></div>}
                      </div>
                      <div className="space-y-4 p-4">
                        <div><h3 className="font-semibold text-slate-900">{imageText[locale].title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{imageText[locale].help}</p></div>
                        <Input value={plan.image_url} placeholder={imageText[locale].url} onChange={(event) => updatePlan(index, (item) => ({ ...item, image_url: event.target.value }))} />
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" disabled={uploading === index} onClick={() => document.getElementById(`pricing-image-${index}`)?.click()}>{uploading === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}{imageText[locale].upload}</Button>
                          {plan.image_url && <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updatePlan(index, (item) => ({ ...item, image_url: '' }))}><Trash2 className="mr-2 h-4 w-4" />{imageText[locale].remove}</Button>}
                          <input id={`pricing-image-${index}`} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadImage(index, event)} />
                        </div>
                      </div>
                    </section>
                  )}
                  <AiLocaleSyncPanel module="pricing" sourceLocale={contentLocale} uiLocale={locale} compact title={t.aiTitle} description={t.aiHelp} fields={{ title: localized(plan, 'title', contentLocale), description: localized(plan, 'description', contentLocale), badge: localized(plan, 'badge', contentLocale), body: localizedList(plan, 'details', contentLocale).join('\n') }} onApply={(drafts: AiDraft[]) => updatePlan(index, (item) => drafts.reduce((next, draft) => { const draftLocale = (draft.locale === 'fr' ? 'fr' : draft.locale === 'en' ? 'en' : 'zh') as LocaleCode; let value = setLocalizedIfMissing(next, 'title', draft.fields.title || '', draftLocale); value = setLocalizedIfMissing(value, 'description', draft.fields.description || '', draftLocale); value = setLocalizedIfMissing(value, 'badge', draft.fields.badge || '', draftLocale); return setLocalizedIfMissing(value, 'details', (draft.fields.body || '').split(/\r?\n/).filter(Boolean), draftLocale); }, item))} />
                  <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{t.options}</h3><Button type="button" size="sm" variant="outline" onClick={() => updatePlan(index, (item) => ({ ...item, options: [...item.options, newOption()] }))}><Plus className="mr-2 h-4 w-4" />{t.addOption}</Button></div><div className="space-y-2">{plan.options.map((option, optionIndex) => <div key={option.id || optionIndex} className="grid gap-2 border p-3 lg:grid-cols-[1.2fr_.7fr_.55fr_.8fr_1.2fr_40px]"><Input placeholder={t.priceLabel} value={localized(option, 'label', contentLocale)} onChange={(event) => updatePlan(index, (item) => ({ ...item, options: item.options.map((row, rowIndex) => rowIndex === optionIndex ? setLocalized(row, 'label', event.target.value, contentLocale) : row) }))} /><Input type="number" min="0" step="0.01" placeholder={t.amount} value={option.amount} onChange={(event) => updatePlan(index, (item) => ({ ...item, options: item.options.map((row, rowIndex) => rowIndex === optionIndex ? { ...row, amount: event.target.value } : row) }))} /><Input maxLength={3} placeholder="CAD" value={option.currency} onChange={(event) => updatePlan(index, (item) => ({ ...item, options: item.options.map((row, rowIndex) => rowIndex === optionIndex ? { ...row, currency: event.target.value.toUpperCase() } : row) }))} /><Input placeholder={t.unit} value={localized(option, 'unit', contentLocale)} onChange={(event) => updatePlan(index, (item) => ({ ...item, options: item.options.map((row, rowIndex) => rowIndex === optionIndex ? setLocalized(row, 'unit', event.target.value, contentLocale) : row) }))} /><Input placeholder={t.note} value={localized(option, 'note', contentLocale)} onChange={(event) => updatePlan(index, (item) => ({ ...item, options: item.options.map((row, rowIndex) => rowIndex === optionIndex ? setLocalized(row, 'note', event.target.value, contentLocale) : row) }))} /><Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={() => updatePlan(index, (item) => ({ ...item, options: item.options.filter((_, rowIndex) => rowIndex !== optionIndex) }))}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div>
                  <div className="flex flex-wrap items-center gap-4 border-t pt-4"><label className="flex items-center gap-2 text-sm"><Switch checked={plan.is_active} onCheckedChange={(checked) => updatePlan(index, (item) => ({ ...item, is_active: checked }))} />{t.active}</label><label className="flex items-center gap-2 text-sm"><Switch checked={plan.is_featured} onCheckedChange={(checked) => updatePlan(index, (item) => ({ ...item, is_featured: checked }))} />{t.featured}</label><div className="ml-auto flex gap-1"><Button type="button" size="icon" variant="ghost" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: move(catalog.plans, index, -1) })}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: move(catalog.plans, index, 1) })}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="sm" variant="ghost" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: [...catalog.plans.slice(0, index + 1), { ...plan, id: undefined, options: plan.options.map((option) => ({ ...option, id: undefined })) }, ...catalog.plans.slice(index + 1)] })}><Copy className="mr-2 h-4 w-4" />{t.duplicate}</Button><Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setCatalog({ ...catalog, is_dirty: true, plans: catalog.plans.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="mr-2 h-4 w-4" />{t.remove}</Button></div></div>
                </div>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t.blocks}</CardTitle><Button type="button" size="sm" variant="outline" onClick={() => setCatalog({ ...catalog, is_dirty: true, blocks: [...catalog.blocks, newBlock()] })}><Plus className="mr-2 h-4 w-4" />{t.addBlock}</Button></CardHeader>
          <CardContent className="space-y-4">{catalog.blocks.map((block, index) => (
            <div key={block.id || index} className="space-y-3 border bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[.7fr_1fr_1.5fr_1.5fr_auto]"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={block.block_type} onChange={(event) => updateBlock(index, (item) => ({ ...item, block_type: event.target.value as PricingContentBlock['block_type'] }))}><option value="info">{t.info}</option><option value="payment">{t.payment}</option><option value="notice">{t.notice}</option><option value="cta">{t.cta}</option></select><Input placeholder={t.name} value={localized(block, 'title', contentLocale)} onChange={(event) => updateBlock(index, (item) => setLocalized(item, 'title', event.target.value, contentLocale))} /><Textarea placeholder={t.body} value={localized(block, 'body', contentLocale)} onChange={(event) => updateBlock(index, (item) => setLocalized(item, 'body', event.target.value, contentLocale))} /><Textarea placeholder={t.items} value={localizedList(block, 'items', contentLocale).join('\n')} onChange={(event) => updateBlock(index, (item) => setLocalized(item, 'items', event.target.value.split(/\r?\n/).filter(Boolean), contentLocale))} /><div className="flex items-center gap-1"><Switch checked={block.is_active} onCheckedChange={(checked) => updateBlock(index, (item) => ({ ...item, is_active: checked }))} /><Button type="button" size="icon" variant="ghost" onClick={() => setCatalog({ ...catalog, is_dirty: true, blocks: move(catalog.blocks, index, -1) })}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => setCatalog({ ...catalog, is_dirty: true, blocks: move(catalog.blocks, index, 1) })}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={() => setCatalog({ ...catalog, is_dirty: true, blocks: catalog.blocks.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></Button></div></div>
              <AiLocaleSyncPanel module="pricing" sourceLocale={contentLocale} uiLocale={locale} compact fields={{ title: localized(block, 'title', contentLocale), description: localized(block, 'body', contentLocale), body: localizedList(block, 'items', contentLocale).join('\n') }} onApply={(drafts: AiDraft[]) => updateBlock(index, (item) => drafts.reduce((next, draft) => { const draftLocale = (draft.locale === 'fr' ? 'fr' : draft.locale === 'en' ? 'en' : 'zh') as LocaleCode; let value = setLocalizedIfMissing(next, 'title', draft.fields.title || '', draftLocale); value = setLocalizedIfMissing(value, 'body', draft.fields.description || '', draftLocale); return setLocalizedIfMissing(value, 'items', (draft.fields.body || '').split(/\r?\n/).filter(Boolean), draftLocale); }, item))} />
            </div>
          ))}</CardContent>
        </Card>
      </main>
    </div>
  );
}
