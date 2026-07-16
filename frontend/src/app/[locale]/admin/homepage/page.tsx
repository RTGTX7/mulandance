'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDown, ArrowUp, Check, Copy, Eye, GripVertical, ImagePlus, Laptop, Loader2,
  Plus, Save, Send, Smartphone, Tablet, Trash2, Upload, X,
} from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';
import { HomepageRenderer } from '@/components/homepage-v2/HomepageRenderer';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AiDraft, HomepageDocumentV2, HomepageV2Block, HomepageV2Item, HomepageV2LocalizedContent, LocaleCode } from '@/lib/api';
import { homepageV2Api, isAuthenticated, uploadApi, usersApi } from '@/lib/api';
import { createHomepageBlock, createHomepageItem, HOMEPAGE_BLOCK_CATALOG, HOMEPAGE_BLOCK_TYPES } from '@/lib/homepage-v2';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type EditorTab = 'content' | 'items' | 'design' | 'behavior' | 'visibility';
type Device = 'desktop' | 'tablet' | 'mobile';

const localeOptions: Array<{ value: LocaleCode; label: string }> = [
  { value: 'zh', label: '中文' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' },
];
const ITEM_FIRST_BLOCKS = new Set<HomepageV2Block['type']>(['hero_carousel', 'video_hero', 'video_player', 'image_marquee', 'masonry_gallery', 'awards_showcase', 'sponsor_wall', 'testimonials', 'statistics', 'feature_grid', 'timeline']);
function firstTabFor(type: HomepageV2Block['type']): EditorTab { return ITEM_FIRST_BLOCKS.has(type) ? 'items' : 'content'; }
const CONTENTLESS_BLOCKS = new Set<HomepageV2Block['type']>(['hero_carousel', 'statistics']);
const ITEMLESS_BLOCKS = new Set<HomepageV2Block['type']>(['program_directory', 'performances', 'latest_news', 'cta']);
const DESIGNLESS_BLOCKS = new Set<HomepageV2Block['type']>(['hero_carousel', 'program_directory', 'performances', 'latest_news']);
const BEHAVIORLESS_BLOCKS = new Set<HomepageV2Block['type']>(['program_directory', 'performances', 'latest_news']);
function editorTabsFor(type: HomepageV2Block['type']): EditorTab[] {
  return (['content', 'items', 'design', 'behavior', 'visibility'] as EditorTab[]).filter((tab) =>
    !(tab === 'content' && CONTENTLESS_BLOCKS.has(type))
    && !(tab === 'items' && ITEMLESS_BLOCKS.has(type))
    && !(tab === 'design' && DESIGNLESS_BLOCKS.has(type))
    && !(tab === 'behavior' && BEHAVIORLESS_BLOCKS.has(type)),
  );
}

type LocalizedField = keyof HomepageV2LocalizedContent;
type ContentEditorConfig = {
  fields: LocalizedField[];
  primaryLink?: boolean;
  secondaryLink?: boolean;
  dataSource?: boolean;
  optionalPrimaryLink?: boolean;
};
const CONTENT_EDITOR_CONFIG: Record<HomepageV2Block['type'], ContentEditorConfig> = {
  hero_carousel: { fields: [] },
  video_hero: { fields: ['eyebrow', 'title', 'subtitle', 'primary_label'], primaryLink: true },
  media_story: { fields: ['eyebrow', 'title', 'subtitle', 'body', 'link_label'], primaryLink: true, optionalPrimaryLink: true },
  video_player: { fields: ['eyebrow', 'title', 'subtitle'] },
  image_marquee: { fields: ['eyebrow', 'title', 'subtitle'] },
  masonry_gallery: { fields: ['eyebrow', 'title', 'subtitle'] },
  awards_showcase: { fields: ['eyebrow', 'title', 'subtitle'] },
  sponsor_wall: { fields: ['eyebrow', 'title', 'subtitle'] },
  campaign: { fields: ['title', 'subtitle', 'body', 'primary_label'], primaryLink: true },
  testimonials: { fields: ['eyebrow', 'title', 'subtitle'] },
  statistics: { fields: [] },
  feature_grid: { fields: ['eyebrow', 'title', 'subtitle'] },
  program_directory: { fields: ['title', 'subtitle', 'link_label'], dataSource: true },
  performances: { fields: ['title', 'subtitle', 'link_label'], dataSource: true },
  latest_news: { fields: ['title', 'subtitle', 'link_label'], dataSource: true },
  timeline: { fields: ['eyebrow', 'title', 'subtitle'] },
  editorial_quote: { fields: ['title', 'body', 'subtitle'] },
  cta: { fields: ['title', 'subtitle', 'body', 'primary_label', 'secondary_label'], primaryLink: true, secondaryLink: true },
};

const copy = {
  zh: {
    title: '首页设计工作区', subtitle: '使用可维护的模块构建、预览并发布三语首页。', blocks: '页面结构', add: '添加模块',
    save: '保存草稿', publish: '发布首页', preview: '预览', dirty: '有未发布修改', clean: '已发布', readOnly: '只读',
    content: '内容', items: '项目', design: '设计', behavior: '行为', visibility: '可见性', adminLabel: '后台名称',
    titleField: '标题', eyebrow: '小标题', subtitleField: '副标题', body: '正文', primary: '主按钮文字', secondary: '次按钮文字',
    linkLabel: '链接文字', primaryUrl: '主链接', secondaryUrl: '次链接', addItem: '添加项目', uploadMany: '批量上传', noItems: '这个模块还没有项目。',
    media: '媒体', mobileMedia: '手机媒体', poster: '视频海报', itemTitle: '项目标题', caption: '说明', alt: '替代文字', itemLink: '项目链接', value: '数字 / 年份',
    theme: '主题', width: '内容宽度', spacing: '上下留白', alignment: '文字对齐', ratio: '媒体比例', overlay: '媒体遮罩', animation: '进入动画', autoplay: '自动播放', loop: '循环', speed: '速度',
    enabled: '公开显示', starts: '开始时间', ends: '结束时间', timezone: '时区', moduleLibrary: '模块库', allModules: '所有模块都可重复添加；新模块默认关闭。',
    saved: '草稿已保存。', published: '首页已发布。', remove: '删除模块', duplicate: '复制模块', warnings: '发布检查', close: '关闭',
    aiTitle: 'AI 补齐当前内容的三语', aiHelp: '只翻译当前模块或当前项目的文字，不会修改媒体、链接、排期和设计。', item: '项目', block: '模块',
  },
  en: {
    title: 'Homepage Design Workspace', subtitle: 'Build, preview, and publish a maintainable multilingual homepage.', blocks: 'Page structure', add: 'Add module',
    save: 'Save draft', publish: 'Publish homepage', preview: 'Preview', dirty: 'Unpublished changes', clean: 'Published', readOnly: 'Read only',
    content: 'Content', items: 'Items', design: 'Design', behavior: 'Behavior', visibility: 'Visibility', adminLabel: 'Admin label',
    titleField: 'Title', eyebrow: 'Eyebrow', subtitleField: 'Subtitle', body: 'Body', primary: 'Primary button', secondary: 'Secondary button',
    linkLabel: 'Link label', primaryUrl: 'Primary link', secondaryUrl: 'Secondary link', addItem: 'Add item', uploadMany: 'Upload multiple', noItems: 'This module has no items yet.',
    media: 'Media', mobileMedia: 'Mobile media', poster: 'Video poster', itemTitle: 'Item title', caption: 'Caption', alt: 'Alt text', itemLink: 'Item link', value: 'Value / year',
    theme: 'Theme', width: 'Content width', spacing: 'Section spacing', alignment: 'Text alignment', ratio: 'Media ratio', overlay: 'Media overlay', animation: 'Entry animation', autoplay: 'Autoplay', loop: 'Loop', speed: 'Speed',
    enabled: 'Publicly visible', starts: 'Starts', ends: 'Ends', timezone: 'Timezone', moduleLibrary: 'Module library', allModules: 'Every module can be added more than once. New modules start disabled.',
    saved: 'Draft saved.', published: 'Homepage published.', remove: 'Remove module', duplicate: 'Duplicate module', warnings: 'Publish checks', close: 'Close',
    aiTitle: 'AI fill this content in three languages', aiHelp: 'Only the selected block or item copy is translated. Media, links, schedule, and design stay unchanged.', item: 'Item', block: 'Block',
  },
  fr: {
    title: 'Espace de conception de l’accueil', subtitle: 'Construisez, prévisualisez et publiez un accueil multilingue.', blocks: 'Structure de page', add: 'Ajouter un module',
    save: 'Enregistrer le brouillon', publish: 'Publier l’accueil', preview: 'Aperçu', dirty: 'Modifications non publiées', clean: 'Publié', readOnly: 'Lecture seule',
    content: 'Contenu', items: 'Éléments', design: 'Design', behavior: 'Comportement', visibility: 'Visibilité', adminLabel: 'Nom interne',
    titleField: 'Titre', eyebrow: 'Surtitre', subtitleField: 'Sous-titre', body: 'Texte', primary: 'Bouton principal', secondary: 'Bouton secondaire',
    linkLabel: 'Libellé du lien', primaryUrl: 'Lien principal', secondaryUrl: 'Lien secondaire', addItem: 'Ajouter un élément', uploadMany: 'Téléverser plusieurs', noItems: 'Ce module ne contient aucun élément.',
    media: 'Média', mobileMedia: 'Média mobile', poster: 'Affiche vidéo', itemTitle: 'Titre de l’élément', caption: 'Légende', alt: 'Texte alternatif', itemLink: 'Lien de l’élément', value: 'Valeur / année',
    theme: 'Thème', width: 'Largeur du contenu', spacing: 'Espacement', alignment: 'Alignement', ratio: 'Format média', overlay: 'Voile média', animation: 'Animation', autoplay: 'Lecture automatique', loop: 'Boucle', speed: 'Vitesse',
    enabled: 'Visible publiquement', starts: 'Début', ends: 'Fin', timezone: 'Fuseau horaire', moduleLibrary: 'Bibliothèque de modules', allModules: 'Chaque module peut être ajouté plusieurs fois. Les nouveaux modules sont désactivés.',
    saved: 'Brouillon enregistré.', published: 'Accueil publié.', remove: 'Supprimer le module', duplicate: 'Dupliquer le module', warnings: 'Contrôles de publication', close: 'Fermer',
    aiTitle: 'IA : compléter ce contenu en trois langues', aiHelp: 'Seul le texte du bloc ou de l’élément sélectionné est traduit. Médias, liens, calendrier et design restent inchangés.', item: 'Élément', block: 'Bloc',
  },
} as const;

function localeFromPath(pathname: string): LocaleCode {
  const value = pathname.split('/')[1]; return value === 'fr' ? 'fr' : value === 'en' ? 'en' : 'zh';
}
function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function replaceAt<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item); }
function inputDate(value: string | null) { return value ? value.slice(0, 16) : ''; }

export default function HomepageBuilderPage() {
  const pathname = usePathname(); const router = useRouter(); const locale = localeFromPath(pathname); const text = copy[locale];
  const [document, setDocument] = useState<HomepageDocumentV2 | null>(null);
  const [selectedId, setSelectedId] = useState(''); const [selectedItem, setSelectedItem] = useState(0);
  const [contentLocale, setContentLocale] = useState<LocaleCode>('zh'); const [tab, setTab] = useState<EditorTab>('items');
  const [canManage, setCanManage] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false); const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [warnings, setWarnings] = useState<string[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false); const [previewOpen, setPreviewOpen] = useState(false); const [device, setDevice] = useState<Device>('desktop');
  const [uploading, setUploading] = useState(''); const [dragId, setDragId] = useState(''); const [aiTarget, setAiTarget] = useState<'block' | 'item'>('block');

  useEffect(() => {
    if (!isAuthenticated()) { router.push(`/${locale}/admin/login`); return; }
    Promise.all([usersApi.me(), homepageV2Api.draft()]).then(([account, result]) => {
      setCanManage(hasPermission(account, 'content.homepage', 'manage')); setDocument(result.document);
      setSelectedId(result.document.blocks[0]?.id || ''); setDirty(result.is_dirty); setPublishedAt(result.published_at || null); setWarnings(result.warnings || []);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load homepage.')).finally(() => setLoading(false));
  }, [locale, router]);

  const blocks = document?.blocks || []; const selectedIndex = blocks.findIndex((block) => block.id === selectedId);
  const selected = selectedIndex >= 0 ? blocks[selectedIndex] : blocks[0]; const item = selected?.items[selectedItem];
  const selectedCopy = selected?.content[contentLocale]; const itemCopy = item?.content[contentLocale];
  const blockAiAvailable = Boolean(selected && CONTENT_EDITOR_CONFIG[selected.type].fields.length > 0);
  const itemAiAvailable = Boolean(selected && item && ITEM_EDITOR_CONFIG[selected.type].fields.length > 0);

  useEffect(() => {
    if (aiTarget === 'item' && !itemAiAvailable && blockAiAvailable) setAiTarget('block');
    if (aiTarget === 'block' && !blockAiAvailable && itemAiAvailable) setAiTarget('item');
  }, [aiTarget, blockAiAvailable, itemAiAvailable, selected?.id]);

  function mutateBlock(updater: (block: HomepageV2Block) => HomepageV2Block) {
    if (!document || !selected || !canManage) return;
    setDocument({ ...document, blocks: replaceAt(document.blocks, selectedIndex, updater(selected)) }); setDirty(true); setMessage('');
  }
  function patchBlock(patch: Partial<HomepageV2Block>) { mutateBlock((block) => ({ ...block, ...patch })); }
  function patchLocalized(patch: Partial<HomepageV2LocalizedContent>) {
    mutateBlock((block) => ({ ...block, content: { ...block.content, [contentLocale]: { ...block.content[contentLocale], ...patch } } }));
  }
  function patchItem(index: number, patch: Partial<HomepageV2Item>) { mutateBlock((block) => ({ ...block, items: replaceAt(block.items, index, { ...block.items[index], ...patch }) })); }
  function patchItemLocalized(index: number, patch: Partial<HomepageV2LocalizedContent>) {
    mutateBlock((block) => { const current = block.items[index]; return { ...block, items: replaceAt(block.items, index, { ...current, content: { ...current.content, [contentLocale]: { ...current.content[contentLocale], ...patch } } }) }; });
  }
  function moveBlock(from: number, to: number) {
    if (!document || !canManage || from === to || to < 0 || to >= blocks.length) return;
    const next = [...document.blocks]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); setDocument({ ...document, blocks: next }); setDirty(true);
  }
  function addBlock(type: HomepageV2Block['type']) {
    if (!document || !canManage) return; const block = createHomepageBlock(type, contentLocale);
    setDocument({ ...document, blocks: [...document.blocks, block] }); setSelectedId(block.id); setSelectedItem(0); setTab(firstTabFor(type)); setLibraryOpen(false); setDirty(true);
  }
  function duplicateBlock() {
    if (!document || !selected || !canManage) return; const duplicate = deepClone(selected); const suffix = `${Date.now().toString(36)}`;
    duplicate.id = `${selected.type}-${suffix}`; duplicate.admin_label = `${selected.admin_label} copy`; duplicate.items = duplicate.items.map((entry, index) => ({ ...entry, id: `${duplicate.id}-item-${index + 1}` }));
    const next = [...blocks]; next.splice(selectedIndex + 1, 0, duplicate); setDocument({ ...document, blocks: next }); setSelectedId(duplicate.id); setDirty(true);
  }
  function removeBlock() {
    if (!document || !selected || !canManage) return; const next = blocks.filter((block) => block.id !== selected.id); setDocument({ ...document, blocks: next }); setSelectedId(next[Math.max(0, selectedIndex - 1)]?.id || ''); setDirty(true);
  }
  function addItem() { if (!selected) return; const next = createHomepageItem(selected.type === 'statistics' ? 'stat' : 'item'); if (selected.type === 'statistics') { next.media_type = 'none'; next.meta = { value: '0' }; } mutateBlock((block) => ({ ...block, items: [...block.items, next] })); setSelectedItem(selected.items.length); }
  function removeItem(index: number) { mutateBlock((block) => ({ ...block, items: block.items.filter((_, itemIndex) => itemIndex !== index) })); setSelectedItem(Math.max(0, index - 1)); }
  function moveItem(index: number, offset: number) { const target = index + offset; if (!selected || target < 0 || target >= selected.items.length) return; mutateBlock((block) => { const items = [...block.items]; [items[index], items[target]] = [items[target], items[index]]; return { ...block, items }; }); setSelectedItem(target); }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>, target: 'new' | 'media' | 'mobile' | 'poster') {
    const files = Array.from(event.target.files || []); if (!files.length || !selected) return; setUploading(target); setError('');
    try {
      if (target === 'new') {
        const additions: HomepageV2Item[] = [];
        for (const file of files) { const result = file.type.startsWith('video/') ? await uploadApi.video(file, 'homepage') : await uploadApi.image(file, 'homepage'); const entry = createHomepageItem('media'); entry.media_url = result.url; entry.media_type = file.type.startsWith('video/') ? 'video' : 'image'; additions.push(entry); }
        mutateBlock((block) => ({ ...block, items: [...block.items, ...additions] }));
      } else if (item) {
        const file = files[0]; const result = file.type.startsWith('video/') ? await uploadApi.video(file, 'homepage') : await uploadApi.image(file, 'homepage');
        if (target === 'media') patchItem(selectedItem, { media_url: result.url, media_type: file.type.startsWith('video/') ? 'video' : 'image' });
        else if (target === 'mobile') patchItem(selectedItem, { mobile_url: result.url }); else patchItem(selectedItem, { poster_url: result.url });
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Upload failed'); } finally { setUploading(''); event.target.value = ''; }
  }

  async function save() {
    if (!document || !canManage) return; setSaving(true); setError(''); setMessage('');
    try { const result = await homepageV2Api.saveDraft(document); setDocument(result.document); setDirty(result.is_dirty); setWarnings(result.warnings || []); setMessage(text.saved); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save.'); } finally { setSaving(false); }
  }
  async function publish() {
    if (!document || !canManage) return; setSaving(true); setError(''); setMessage('');
    try { if (dirty) await homepageV2Api.saveDraft(document); const result = await homepageV2Api.publish(); setDocument(result.document); setDirty(false); setPublishedAt(result.published_at || null); setWarnings(result.warnings || []); setMessage(text.published); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to publish.'); } finally { setSaving(false); }
  }

  const aiFields = useMemo<Record<string, string>>(() => {
    const value = aiTarget === 'item' && itemCopy ? itemCopy : selectedCopy; if (!value) return {};
    const fields: Record<string, string> = { eyebrow: value.eyebrow, title: value.title, subtitle: value.subtitle, body: value.body, label: value.label, caption: value.caption, alt_text: value.alt_text, primary_label: value.primary_label, secondary_label: value.secondary_label, link_label: value.link_label };
    return fields;
  }, [aiTarget, itemCopy, selectedCopy]);
  function applyAi(drafts: AiDraft[]) {
    if (!selected) return; mutateBlock((block) => {
      if (aiTarget === 'item' && block.items[selectedItem]) {
        const items = [...block.items]; const current = items[selectedItem]; const content = { ...current.content };
        drafts.forEach((draft) => { const key: LocaleCode = draft.locale === 'fr' ? 'fr' : draft.locale === 'en' ? 'en' : 'zh'; const fields = draft.fields as Partial<HomepageV2LocalizedContent>; content[key] = { ...content[key], ...Object.fromEntries(Object.entries(fields).filter(([field, value]) => value && !content[key][field as keyof HomepageV2LocalizedContent])) }; });
        items[selectedItem] = { ...current, content }; return { ...block, items };
      }
      const content = { ...block.content }; drafts.forEach((draft) => { const key: LocaleCode = draft.locale === 'fr' ? 'fr' : draft.locale === 'en' ? 'en' : 'zh'; const fields = draft.fields as Partial<HomepageV2LocalizedContent>; content[key] = { ...content[key], ...Object.fromEntries(Object.entries(fields).filter(([field, value]) => value && !content[key][field as keyof HomepageV2LocalizedContent])) }; }); return { ...block, content };
    });
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!document) return <div className="p-8 text-destructive">{error || 'Homepage draft unavailable.'}</div>;

  return <div className="min-h-screen bg-[#f7f5f8]">
    <AdminSectionTabs />
    <header className="border-b bg-white px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">{text.title}</h1><span className={cn('rounded-md px-2 py-1 text-xs font-semibold', dirty ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900')}>{dirty ? text.dirty : text.clean}</span>{!canManage && <span className="rounded-md bg-muted px-2 py-1 text-xs">{text.readOnly}</span>}</div><p className="mt-1 text-sm text-muted-foreground">{text.subtitle}{publishedAt ? ` · ${new Date(publishedAt).toLocaleString(locale)}` : ''}</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />{text.preview}</Button><Button variant="outline" onClick={save} disabled={!canManage || saving}><Save className="mr-2 h-4 w-4" />{text.save}</Button><Button onClick={publish} disabled={!canManage || saving}><Send className="mr-2 h-4 w-4" />{text.publish}</Button></div>
      </div>
    </header>

    {(message || error || warnings.length > 0) && <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6">{message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div>}{error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>}{warnings.length > 0 && <details className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><summary className="cursor-pointer font-semibold">{text.warnings} ({warnings.length})</summary><ul className="mt-2 space-y-1">{warnings.map((warning, index) => <li key={`${warning}-${index}`}>• {warning}</li>)}</ul></details>}</div>}

    <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="self-start rounded-md border bg-white xl:sticky xl:top-4">
        <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">{text.blocks}</h2><p className="mt-1 text-xs text-muted-foreground">{blocks.length} modules</p></div><Button size="sm" onClick={() => setLibraryOpen(true)} disabled={!canManage}><Plus className="mr-1 h-4 w-4" />{text.add}</Button></div>
        <div className="max-h-[70vh] overflow-y-auto p-2">{blocks.map((block, index) => <button key={block.id} draggable={canManage} onDragStart={() => setDragId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { const from = blocks.findIndex((entry) => entry.id === dragId); moveBlock(from, index); setDragId(''); }} onClick={() => { setSelectedId(block.id); setSelectedItem(0); setTab(firstTabFor(block.type)); }} className={cn('mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-3 text-left transition-colors', selected?.id === block.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/60', !block.is_enabled && 'opacity-55')}>
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{block.admin_label || HOMEPAGE_BLOCK_CATALOG[block.type].name[locale]}</span><span className="block truncate text-xs text-muted-foreground">{HOMEPAGE_BLOCK_CATALOG[block.type].name[locale]}</span></span><span className={cn('h-2 w-2 rounded-full', block.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30')} /></button>)}</div>
      </aside>

      {selected ? <section className="min-w-0 rounded-md border bg-white">
        <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="text-xs font-semibold text-primary">{HOMEPAGE_BLOCK_CATALOG[selected.type].name[locale]}</p><Input className="mt-1 max-w-xl border-0 px-0 text-xl font-semibold shadow-none focus-visible:ring-0" value={selected.admin_label} onChange={(event) => patchBlock({ admin_label: event.target.value })} disabled={!canManage} aria-label={text.adminLabel} /></div><div className="flex flex-wrap gap-1"><Button size="icon" variant="ghost" onClick={() => moveBlock(selectedIndex, selectedIndex - 1)} disabled={!canManage || selectedIndex === 0} title="Move up"><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => moveBlock(selectedIndex, selectedIndex + 1)} disabled={!canManage || selectedIndex === blocks.length - 1} title="Move down"><ArrowDown className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={duplicateBlock} disabled={!canManage}><Copy className="mr-1 h-4 w-4" />{text.duplicate}</Button><Button variant="outline" size="sm" className="text-destructive" onClick={removeBlock} disabled={!canManage}><Trash2 className="mr-1 h-4 w-4" />{text.remove}</Button></div></div>
        <div className="flex overflow-x-auto border-b px-3">{editorTabsFor(selected.type).map((value) => <button key={value} onClick={() => { setTab(value); if (value === 'content') setAiTarget('block'); if (value === 'items') setAiTarget('item'); }} className={cn('min-h-12 whitespace-nowrap border-b-2 px-4 text-sm font-semibold', tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>{value === 'items' && selected.type === 'media_story' ? (locale === 'fr' ? 'Images et médias' : locale === 'en' ? 'Images & media' : '图片与媒体') : text[value]}</button>)}</div>
        <div className="p-4 sm:p-6">
          {tab === 'content' && <ContentEditor selected={selected} locale={contentLocale} setLocale={setContentLocale} text={text} value={selectedCopy} patch={patchLocalized} patchBlock={patchBlock} disabled={!canManage} />}
          {tab === 'items' && <><ItemsEditor selected={selected} selectedItem={selectedItem} setSelectedItem={setSelectedItem} locale={contentLocale} setLocale={setContentLocale} text={text} item={item} value={itemCopy} patchItem={patchItem} patchLocalized={patchItemLocalized} addItem={addItem} removeItem={removeItem} moveItem={moveItem} upload={uploadFiles} uploading={uploading} disabled={!canManage} />{item && <ItemAdvancedEditor type={selected.type} item={item} index={selectedItem} patchItem={patchItem} text={text} disabled={!canManage} />}</>}
          {tab === 'design' && <DesignEditor selected={selected} patch={patchBlock} text={text} disabled={!canManage} />}
          {tab === 'behavior' && <BehaviorEditor selected={selected} patch={patchBlock} text={text} disabled={!canManage} />}
          {tab === 'visibility' && <VisibilityEditor selected={selected} patch={patchBlock} text={text} disabled={!canManage} />}
          {((tab === 'content' && blockAiAvailable) || (tab === 'items' && itemAiAvailable)) && <div className="mt-8 border-t pt-6"><AiLocaleSyncPanel module={`homepage.${selected.type}.${aiTarget}`} sourceLocale={contentLocale} uiLocale={locale} fields={aiFields} onApply={applyAi} title={text.aiTitle} description={text.aiHelp} compact /></div>}
        </div>
      </section> : <div className="rounded-md border bg-white p-10 text-center text-muted-foreground">{text.add}</div>}
    </main>

    {libraryOpen && <ModuleLibrary locale={locale} text={text} onClose={() => setLibraryOpen(false)} onAdd={addBlock} />}
    {previewOpen && <Preview document={document} locale={contentLocale} device={device} setDevice={setDevice} text={text} onClose={() => setPreviewOpen(false)} />}
  </div>;
}

function LocaleTabs({ value, onChange }: { value: LocaleCode; onChange: (value: LocaleCode) => void }) { return <div className="mb-5 flex gap-1 border-b">{localeOptions.map((option) => <button key={option.value} onClick={() => onChange(option.value)} className={cn('min-h-11 border-b-2 px-4 text-sm font-semibold', value === option.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>{option.label}</button>)}</div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <label className={cn('block min-w-0', className)}><span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>{children}</label>; }

function contentFieldLabel(field: LocalizedField, text: any) {
  const labels: Partial<Record<LocalizedField, string>> = {
    eyebrow: text.eyebrow, title: text.titleField, subtitle: text.subtitleField,
    body: text.body, caption: text.caption, primary_label: text.primary,
    secondary_label: text.secondary, link_label: text.linkLabel,
  };
  return labels[field] || field.replaceAll('_', ' ');
}

function ContentEditor({ selected, locale, setLocale, text, value, patch, patchBlock, disabled }: any) {
  const config = CONTENT_EDITOR_CONFIG[selected.type as HomepageV2Block['type']];
  const hasLocalizedLinkLabel = (['zh', 'en', 'fr'] as const).some((language) => Boolean(selected.content[language].link_label?.trim()));
  const primaryLinkEnabled = !config.optionalPrimaryLink || selected.config.show_primary_link === true || (selected.config.show_primary_link !== false && (hasLocalizedLinkLabel || selected.primary_link.href));
  const visibleFields = config.fields.filter((field) => field !== 'link_label' || primaryLinkEnabled);
  const dataCopy = locale === 'fr'
    ? { limit: 'Nombre maximum', category: 'Filtre de catégorie', sort: 'Ordre' }
    : locale === 'en'
      ? { limit: 'Maximum items', category: 'Category filter', sort: 'Sort order' }
      : { limit: '最多显示数量', category: '分类筛选', sort: '排序方式' };
  return <div>
    <LocaleTabs value={locale} onChange={setLocale} />
    {selected.type === 'media_story' && <div className="mb-5 rounded-md border border-primary/20 bg-primary/[0.04] p-4"><p className="text-sm font-semibold text-foreground">{locale === 'fr' ? 'Contenu éditorial' : locale === 'en' ? 'Editorial content' : '图文内容'}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{locale === 'fr' ? 'Rédigez le texte ici. Ajoutez l’image principale et son texte alternatif dans Images et médias.' : locale === 'en' ? 'Write the story here. Add the primary image and its alt text under Images & media.' : '在这里填写文字；主图片、手机图片和替代文字请在“图片与媒体”中设置。'}</p></div>}
    {config.optionalPrimaryLink && <label className="mb-5 flex min-h-14 items-center justify-between rounded-md border bg-muted/20 px-4 text-sm font-semibold"><span>{locale === 'fr' ? 'Afficher le lien d’action' : locale === 'en' ? 'Show action link' : '显示行动链接'}</span><Switch checked={primaryLinkEnabled} onCheckedChange={(enabled) => patchBlock({ config: { ...selected.config, show_primary_link: enabled } })} disabled={disabled} /></label>}
    <div className="grid gap-5 md:grid-cols-2">
      {visibleFields.map((field) => {
        const multiline = field === 'body' || field === 'caption' || field === 'subtitle';
        return <Field key={field} label={contentFieldLabel(field, text)} className={field === 'body' || field === 'subtitle' ? 'md:col-span-2' : undefined}>
          {multiline
            ? <Textarea className="bg-white" rows={field === 'body' ? 5 : 3} value={value?.[field] || ''} onChange={(event) => patch({ [field]: event.target.value })} disabled={disabled} />
            : <Input className="bg-white" value={value?.[field] || ''} onChange={(event) => patch({ [field]: event.target.value })} disabled={disabled} />}
        </Field>;
      })}
      {config.primaryLink && primaryLinkEnabled && <Field label={text.primaryUrl}><Input className="bg-white" value={selected.primary_link.href} onChange={(event) => patchBlock({ primary_link: { ...selected.primary_link, href: event.target.value } })} disabled={disabled} /></Field>}
      {config.secondaryLink && <Field label={text.secondaryUrl}><Input className="bg-white" value={selected.secondary_link.href} onChange={(event) => patchBlock({ secondary_link: { ...selected.secondary_link, href: event.target.value } })} disabled={disabled} /></Field>}
      {config.dataSource && <>
        <Field label={dataCopy.limit}><Input className="bg-white" type="number" min={1} max={24} value={selected.data_source.limit} onChange={(event) => patchBlock({ data_source: { ...selected.data_source, limit: Math.max(1, Math.min(24, Number(event.target.value) || 1)) } })} disabled={disabled} /></Field>
        {selected.type !== 'performances' && <Field label={dataCopy.category}><Input className="bg-white" value={selected.data_source.category} onChange={(event) => patchBlock({ data_source: { ...selected.data_source, category: event.target.value } })} disabled={disabled} /></Field>}
        {selected.type !== 'performances' && <SelectField label={dataCopy.sort} value={selected.data_source.sort} values={['default', 'newest', 'oldest', 'manual']} onChange={(sort) => patchBlock({ data_source: { ...selected.data_source, sort } })} disabled={disabled} />}
      </>}
    </div>
  </div>;
}
type ItemEditorConfig = {
  media?: boolean;
  mobile?: boolean;
  poster?: boolean;
  fields: LocalizedField[];
  link?: boolean;
  captionTrack?: boolean;
  secondaryHref?: boolean;
  meta?: 'value' | 'year';
  maxItems?: number;
  mediaAccept?: 'image' | 'video' | 'media';
  buttonControls?: boolean;
};

const ITEM_EDITOR_CONFIG: Record<HomepageV2Block['type'], ItemEditorConfig> = {
  hero_carousel: { media: true, mobile: true, poster: true, fields: ['eyebrow', 'title', 'subtitle', 'alt_text', 'primary_label', 'secondary_label'], link: true, secondaryHref: true, mediaAccept: 'media', buttonControls: true },
  video_hero: { media: true, mobile: true, poster: true, fields: [], maxItems: 1, mediaAccept: 'video' },
  media_story: { media: true, mobile: true, poster: true, fields: ['alt_text'], maxItems: 1, mediaAccept: 'media' },
  video_player: { media: true, mobile: true, poster: true, fields: [], captionTrack: true, maxItems: 1, mediaAccept: 'video' },
  image_marquee: { media: true, mobile: true, fields: ['alt_text'], link: true, mediaAccept: 'image' },
  masonry_gallery: { media: true, mobile: true, fields: ['caption', 'alt_text'], link: true, mediaAccept: 'image' },
  awards_showcase: { media: true, fields: ['title', 'subtitle', 'body', 'alt_text'], meta: 'year', mediaAccept: 'image' },
  sponsor_wall: { media: true, fields: ['title', 'alt_text'], link: true, mediaAccept: 'image' },
  campaign: { media: true, mobile: true, poster: true, fields: ['alt_text'], maxItems: 1, mediaAccept: 'media' },
  testimonials: { fields: ['title', 'subtitle', 'body', 'caption'] },
  statistics: { fields: ['label', 'title'], meta: 'value' },
  feature_grid: { media: true, mobile: true, fields: ['title', 'subtitle', 'body', 'alt_text'], mediaAccept: 'image' },
  program_directory: { fields: [], link: false },
  performances: { fields: [], link: false },
  latest_news: { fields: [], link: false },
  timeline: { fields: ['eyebrow', 'title', 'subtitle', 'body'], meta: 'year' },
  editorial_quote: { media: true, mobile: true, fields: ['alt_text'], maxItems: 1, mediaAccept: 'image' },
  cta: { fields: [] },
};

function ItemsEditor({ selected, selectedItem, setSelectedItem, locale, setLocale, text, item, value, patchItem, patchLocalized, addItem, removeItem, moveItem, upload, uploading, disabled }: any) {
  const config = ITEM_EDITOR_CONFIG[selected.type as HomepageV2Block['type']];
  const localizedLabel = (field: LocalizedField) => contentFieldLabel(field, text);
  const mediaTargets = (['media', 'mobile', 'poster'] as const).filter((target) => config[target]);
  const hasEditorFields = config.fields.length > 0 || Boolean(config.link || config.captionTrack || config.secondaryHref || config.meta);
  const canAddItems = mediaTargets.length > 0 || hasEditorFields;
  const canAddMore = canAddItems && (!config.maxItems || selected.items.length < config.maxItems);
  const mediaAccept = config.mediaAccept === 'video' ? 'video/*' : config.mediaAccept === 'image' ? 'image/*' : 'image/*,video/*';
  const hasLocalizedValue = (field: 'primary_label' | 'secondary_label') => item && (['zh', 'en', 'fr'] as const).some((language) => Boolean(item.content[language][field]?.trim()));
  const primaryButtonEnabled = Boolean(item && (item.meta.show_primary_button === true || (item.meta.show_primary_button !== false && (hasLocalizedValue('primary_label') || item.link.href))));
  const secondaryButtonEnabled = Boolean(item && (item.meta.show_secondary_button === true || (item.meta.show_secondary_button !== false && (hasLocalizedValue('secondary_label') || item.meta.secondary_href))));
  const visibleFields = config.fields.filter((field) => !config.buttonControls || (field !== 'primary_label' && field !== 'secondary_label') || (field === 'primary_label' ? primaryButtonEnabled : secondaryButtonEnabled));
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{selected.items.map((entry: HomepageV2Item, index: number) => <button key={entry.id} onClick={() => setSelectedItem(index)} className={cn('min-h-11 min-w-12 rounded-md border px-3 text-sm font-semibold', selectedItem === index && 'border-primary bg-primary/5 text-primary')}>{index + 1}</button>)}</div>
      <div className="flex gap-2">{mediaTargets.length > 0 && canAddMore && <label className={cn('inline-flex min-h-10 cursor-pointer items-center rounded-md border px-3 text-sm font-semibold', disabled && 'pointer-events-none opacity-50')}><Upload className="mr-2 h-4 w-4" />{uploading === 'new' ? '...' : config.maxItems === 1 ? text.media : text.uploadMany}<input type="file" className="sr-only" accept={mediaAccept} multiple={config.maxItems !== 1} onChange={(e) => upload(e, 'new')} /></label>}{canAddMore && <Button size="sm" variant="outline" onClick={addItem} disabled={disabled}><Plus className="mr-1 h-4 w-4" />{text.addItem}</Button>}</div>
    </div>
    {!item ? <p className="rounded-md border border-dashed bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">{!canAddItems ? (locale === 'fr' ? 'Les éléments de ce module sont chargés automatiquement depuis les données publiques.' : locale === 'en' ? 'Items for this module are loaded automatically from public data.' : '此模块项目由公开数据自动加载，无需手动添加。') : text.noItems}</p> : <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3"><label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={item.is_enabled} onCheckedChange={(checked) => patchItem(selectedItem, { is_enabled: checked })} disabled={disabled} />{text.enabled}</label><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => moveItem(selectedItem, -1)} disabled={disabled || selectedItem === 0}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => moveItem(selectedItem, 1)} disabled={disabled || selectedItem === selected.items.length - 1}><ArrowDown className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(selectedItem)} disabled={disabled}><Trash2 className="mr-1 h-4 w-4" />{text.remove}</Button></div></div>
      {mediaTargets.length > 0 && <div className="grid gap-3 sm:grid-cols-3">{mediaTargets.map((target) => <label key={target} className={cn('flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-3 text-center text-sm font-semibold', disabled && 'pointer-events-none opacity-50')}><ImagePlus className="mb-2 h-5 w-5 text-primary" />{target === 'media' ? text.media : target === 'mobile' ? text.mobileMedia : text.poster}<span className="mt-1 max-w-full truncate text-xs font-normal text-muted-foreground">{target === 'media' ? item.media_url : target === 'mobile' ? item.mobile_url : item.poster_url}</span><input type="file" className="sr-only" accept={target === 'poster' ? 'image/*' : mediaAccept} onChange={(e) => upload(e, target)} /></label>)}</div>}
      {!hasEditorFields && mediaTargets.length === 0 && <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">{locale === 'fr' ? 'Cet élément est fourni automatiquement par les données publiques.' : locale === 'en' ? 'This item is supplied automatically from public data.' : '此项目由公开数据自动提供，无需在此编辑。'}</p>}
      {hasEditorFields && <>{config.buttonControls && <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="flex min-h-14 items-center justify-between rounded-md border bg-muted/20 px-4 text-sm font-semibold"><span>{locale === 'fr' ? 'Bouton principal' : locale === 'en' ? 'Primary button' : '主按钮'}</span><Switch checked={primaryButtonEnabled} onCheckedChange={(enabled) => patchItem(selectedItem, { meta: { ...item.meta, show_primary_button: enabled } })} disabled={disabled} /></label><label className="flex min-h-14 items-center justify-between rounded-md border bg-muted/20 px-4 text-sm font-semibold"><span>{locale === 'fr' ? 'Bouton secondaire' : locale === 'en' ? 'Secondary button' : '次按钮'}</span><Switch checked={secondaryButtonEnabled} onCheckedChange={(enabled) => patchItem(selectedItem, { meta: { ...item.meta, show_secondary_button: enabled } })} disabled={disabled} /></label></div>}<LocaleTabs value={locale} onChange={setLocale} /><div className="grid gap-4 md:grid-cols-2">{visibleFields.map((field) => { const multiline = field === 'body' || field === 'caption' || field === 'subtitle'; return <Field key={field} label={localizedLabel(field)} className={field === 'body' ? 'md:col-span-2' : undefined}>{multiline ? <Textarea rows={field === 'body' ? 5 : 3} value={value?.[field] || ''} onChange={(e) => patchLocalized(selectedItem, { [field]: e.target.value })} disabled={disabled} /> : <Input value={value?.[field] || ''} onChange={(e) => patchLocalized(selectedItem, { [field]: e.target.value })} disabled={disabled} />}</Field>; })}{config.captionTrack && <Field label={locale === 'fr' ? 'URL des sous-titres' : locale === 'en' ? 'Caption track URL' : '字幕文件 URL'}><Input value={String(item.meta[`caption_${locale}`] || '')} onChange={(e) => patchItem(selectedItem, { meta: { ...item.meta, [`caption_${locale}`]: e.target.value } })} disabled={disabled} /></Field>}{config.link && (!config.buttonControls || primaryButtonEnabled) && <Field label={text.itemLink}><Input value={item.link.href} onChange={(e) => patchItem(selectedItem, { link: { ...item.link, href: e.target.value } })} disabled={disabled} /></Field>}{config.secondaryHref && (!config.buttonControls || secondaryButtonEnabled) && <Field label={locale === 'fr' ? 'Lien du bouton secondaire' : locale === 'en' ? 'Secondary button link' : '次按钮链接'}><Input value={String(item.meta.secondary_href || '')} onChange={(e) => patchItem(selectedItem, { meta: { ...item.meta, secondary_href: e.target.value } })} disabled={disabled} /></Field>}{config.meta && <Field label={config.meta === 'value' ? text.value : locale === 'fr' ? 'Année' : locale === 'en' ? 'Year' : '年份'}><Input value={String(item.meta[config.meta] || '')} onChange={(e) => patchItem(selectedItem, { meta: { ...item.meta, [config.meta as string]: e.target.value } })} disabled={disabled} /></Field>}</div></>}
    </div>}
  </div>;
}
function ItemAdvancedEditor({ type, item, index, patchItem, text, disabled }: { type: HomepageV2Block['type']; item: HomepageV2Item; index: number; patchItem: (index: number, patch: Partial<HomepageV2Item>) => void; text: any; disabled: boolean }) {
  const hasVisualMedia = Boolean(ITEM_EDITOR_CONFIG[type].media);
  return <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-2">
    {hasVisualMedia && <><Field label="Focal point X (%)"><Input type="number" min={0} max={100} value={item.focal_x} onChange={(event) => patchItem(index, { focal_x: Number(event.target.value) })} disabled={disabled} /></Field>
    <Field label="Focal point Y (%)"><Input type="number" min={0} max={100} value={item.focal_y} onChange={(event) => patchItem(index, { focal_y: Number(event.target.value) })} disabled={disabled} /></Field></>}
    <Field label={text.starts}><Input type="datetime-local" value={inputDate(item.schedule.start_at)} onChange={(event) => patchItem(index, { schedule: { ...item.schedule, start_at: event.target.value || null } })} disabled={disabled} /></Field>
    <Field label={text.ends}><Input type="datetime-local" value={inputDate(item.schedule.end_at)} onChange={(event) => patchItem(index, { schedule: { ...item.schedule, end_at: event.target.value || null } })} disabled={disabled} /></Field>
  </div>;
}
function SelectField({ label, value, values, onChange, disabled }: { label: string; value: string; values: string[]; onChange: (value: string) => void; disabled: boolean }) { return <Field label={label}><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>{values.map((entry) => <option key={entry} value={entry}>{entry.replaceAll('_', ' ')}</option>)}</select></Field>; }
function DesignEditor({ selected, patch, text, disabled }: any) {
  const design = selected.design; const set = (value: any) => patch({ design: { ...design, ...value } });
  if (selected.type === 'video_hero') return <div className="grid gap-4 md:grid-cols-2"><SelectField label={text.overlay} value={design.overlay} values={['light', 'medium', 'dark']} onChange={(overlay) => set({ overlay })} disabled={disabled} /></div>;
  const headingAligned = ['video_player', 'image_marquee', 'masonry_gallery', 'awards_showcase', 'sponsor_wall', 'testimonials', 'feature_grid', 'timeline'].includes(selected.type);
  const mediaSized = ['media_story', 'video_player'].includes(selected.type);
  return <div className="grid gap-4 md:grid-cols-2">
    <SelectField label={text.theme} value={design.theme} values={['white', 'soft_lilac', 'dark_plum', 'transparent']} onChange={(theme) => set({ theme })} disabled={disabled} />
    <SelectField label={text.width} value={design.width} values={['contained', 'wide', 'full']} onChange={(width) => set({ width })} disabled={disabled} />
    <SelectField label={text.spacing} value={design.spacing} values={['compact', 'normal', 'spacious']} onChange={(spacing) => set({ spacing })} disabled={disabled} />
    {headingAligned && <SelectField label={text.alignment} value={design.alignment} values={['left', 'center', 'right']} onChange={(alignment) => set({ alignment })} disabled={disabled} />}
    {mediaSized && <SelectField label={text.ratio} value={design.media_ratio} values={['auto', 'square', 'portrait', 'landscape', 'cinematic']} onChange={(media_ratio) => set({ media_ratio })} disabled={disabled} />}
    {selected.type === 'media_story' && <SelectField label="Media position" value={String(selected.config.media_position || 'left')} values={['left', 'right']} onChange={(media_position) => patch({ config: { ...selected.config, media_position } })} disabled={disabled} />}
  </div>;
}
function BehaviorEditor({ selected, patch, text, disabled }: any) {
  const behavior = selected.behavior; const set = (value: any) => patch({ behavior: { ...behavior, ...value } });
  const usesLoopSpeed = selected.type === 'image_marquee' || selected.type === 'sponsor_wall';
  return <div className="grid gap-4 md:grid-cols-2"><SelectField label={text.animation} value={behavior.animation} values={['none', 'fade_up', 'soft_zoom']} onChange={(animation) => set({ animation })} disabled={disabled} />{usesLoopSpeed && <SelectField label={text.speed} value={behavior.speed} values={['slow', 'normal', 'fast']} onChange={(speed) => set({ speed })} disabled={disabled} />}</div>;
}
function VisibilityEditor({ selected, patch, text, disabled }: any) { const schedule = selected.schedule; return <div className="grid gap-4 md:grid-cols-2"><label className="flex min-h-12 items-center justify-between rounded-md border p-3 text-sm font-semibold md:col-span-2">{text.enabled}<Switch checked={selected.is_enabled} onCheckedChange={(is_enabled) => patch({ is_enabled })} disabled={disabled} /></label><Field label={text.starts}><Input type="datetime-local" value={inputDate(schedule.start_at)} onChange={(e) => patch({ schedule: { ...schedule, start_at: e.target.value || null } })} disabled={disabled} /></Field><Field label={text.ends}><Input type="datetime-local" value={inputDate(schedule.end_at)} onChange={(e) => patch({ schedule: { ...schedule, end_at: e.target.value || null } })} disabled={disabled} /></Field><Field label={text.timezone}><Input value={schedule.timezone} onChange={(e) => patch({ schedule: { ...schedule, timezone: e.target.value } })} disabled={disabled} /></Field></div>; }
function ModuleLibrary({ locale, text, onClose, onAdd }: { locale: LocaleCode; text: any; onClose: () => void; onAdd: (type: HomepageV2Block['type']) => void }) { const groups = ['brand', 'media', 'trust', 'connected', 'action'] as const; return <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4"><div className="mx-auto my-6 max-w-5xl rounded-md bg-white shadow-xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5"><div><h2 className="text-2xl font-semibold">{text.moduleLibrary}</h2><p className="mt-1 text-sm text-muted-foreground">{text.allModules}</p></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="space-y-7 p-5">{groups.map((group) => <section key={group}><h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{group}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{HOMEPAGE_BLOCK_TYPES.filter((type) => HOMEPAGE_BLOCK_CATALOG[type].category === group).map((type) => { const entry = HOMEPAGE_BLOCK_CATALOG[type]; return <button key={type} onClick={() => onAdd(type)} className="min-h-32 rounded-md border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"><div className="flex items-start justify-between gap-3"><span className="text-lg font-semibold">{entry.name[locale]}</span><Plus className="h-5 w-5 text-primary" /></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.description[locale]}</p></button>; })}</div></section>)}</div></div></div>; }
function Preview({ document, locale, device, setDevice, text, onClose }: { document: HomepageDocumentV2; locale: LocaleCode; device: Device; setDevice: (device: Device) => void; text: any; onClose: () => void }) { const width = device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%'; return <div className="fixed inset-0 z-[110] flex flex-col bg-[#ece9ee]"><header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-3"><div className="flex items-center gap-1"><Button size="icon" variant={device === 'desktop' ? 'default' : 'ghost'} onClick={() => setDevice('desktop')}><Laptop className="h-4 w-4" /></Button><Button size="icon" variant={device === 'tablet' ? 'default' : 'ghost'} onClick={() => setDevice('tablet')}><Tablet className="h-4 w-4" /></Button><Button size="icon" variant={device === 'mobile' ? 'default' : 'ghost'} onClick={() => setDevice('mobile')}><Smartphone className="h-4 w-4" /></Button></div><Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />{text.close}</Button></header><div className="flex-1 overflow-auto p-3"><div className="mx-auto min-h-full overflow-hidden bg-white shadow-sm transition-[width]" style={{ width, maxWidth: '100%' }}><HomepageRenderer document={document} locale={locale} preview /></div></div></div>; }
