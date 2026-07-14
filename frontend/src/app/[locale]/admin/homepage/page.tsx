"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  ImagePlus,
  Laptop,
  Loader2,
  Plus,
  Save,
  Send,
  Smartphone,
  Trash2,
  Video,
} from "lucide-react";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { AiLocaleSyncPanel } from "@/components/admin/AiLocaleSyncPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type AiDraft,
  type AdminAccount,
  type HomepageBlock,
  type HomepageBlockType,
  type HomepageHeroSlide,
  type HomepageSettings,
  type HomepageSettingsBundle,
  type LocaleCode,
  homepageApi,
  isAuthenticated,
  uploadApi,
  usersApi,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";

const locales: Array<{ value: LocaleCode; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];
const ui = {
  zh: {
    title: "首页设计工作区",
    subtitle: "用品牌区块组织首页，编辑草稿、上传媒体、三语同步并预览后发布。",
    blocks: "页面区块",
    add: "添加区块",
    save: "保存草稿",
    publish: "发布首页",
    preview: "草稿预览",
    desktop: "桌面",
    mobile: "手机",
    dirty: "有未发布修改",
    published: "已发布",
    last: "最后发布",
    never: "尚未发布",
    editing: "内容语言",
    enabled: "显示",
    duplicate: "复制",
    remove: "删除",
    hero: "首页轮播",
    stats: "数据导览",
    performances: "演出与赛事",
    programs: "课程目录",
    news: "最新资讯",
    media: "图文 / 视频故事",
    cta: "结尾行动区",
    addMedia: "添加图文 / 视频",
    fixed: "业务区块",
    fixedHelp: "具体项目仍从对应的课程、演出或新闻后台读取。",
    titleLabel: "标题",
    subtitleLabel: "副标题",
    body: "正文",
    linkText: "按钮文字",
    linkUrl: "按钮链接",
    layout: "版式",
    mediaUrl: "媒体 URL",
    upload: "上传图片或视频",
    slides: "轮播内容",
    addSlide: "添加幻灯片",
    badge: "标签",
    overlay: "遮罩样式",
    primary: "主按钮",
    secondary: "次按钮",
    value: "数字",
    label: "说明",
    addStat: "添加数据",
    saved: "草稿已保存。",
    publishedDone: "首页已发布。",
    teacherPublish: "当前账号只有查看权限，不能修改或发布首页。",
    heroFirst: "Hero 必须是第一个启用区块。",
    aiTitle: "AI 补齐当前区块三语",
    aiHelp: "AI 只处理文字，不修改媒体、链接、顺序或显示状态。",
  },
  en: {
    title: "Homepage Design Workspace",
    subtitle:
      "Build the homepage with branded blocks, media, multilingual AI, draft preview, and controlled publishing.",
    blocks: "Page blocks",
    add: "Add block",
    save: "Save draft",
    publish: "Publish homepage",
    preview: "Draft preview",
    desktop: "Desktop",
    mobile: "Mobile",
    dirty: "Unpublished changes",
    published: "Published",
    last: "Last published",
    never: "Never",
    editing: "Content language",
    enabled: "Visible",
    duplicate: "Duplicate",
    remove: "Remove",
    hero: "Hero carousel",
    stats: "Statistics",
    performances: "Performances",
    programs: "Program directory",
    news: "Latest news",
    media: "Image / video story",
    cta: "Closing call-to-action",
    addMedia: "Add image / video block",
    fixed: "Connected content block",
    fixedHelp:
      "Items still come from the corresponding Programs, Performances, or News admin area.",
    titleLabel: "Title",
    subtitleLabel: "Subtitle",
    body: "Body",
    linkText: "Button text",
    linkUrl: "Button link",
    layout: "Layout",
    mediaUrl: "Media URL",
    upload: "Upload image or video",
    slides: "Slides",
    addSlide: "Add slide",
    badge: "Badge",
    overlay: "Overlay style",
    primary: "Primary button",
    secondary: "Secondary button",
    value: "Value",
    label: "Label",
    addStat: "Add statistic",
    saved: "Draft saved.",
    publishedDone: "Homepage published.",
    teacherPublish: "This account has view-only access and cannot edit or publish the homepage.",
    heroFirst: "Hero must be the first enabled block.",
    aiTitle: "AI fill this block’s languages",
    aiHelp:
      "AI only fills copy and never changes media, links, order, or visibility.",
  },
  fr: {
    title: "Espace de conception de l’accueil",
    subtitle:
      "Composez l’accueil avec des blocs de marque, des médias, l’IA multilingue, un aperçu et une publication contrôlée.",
    blocks: "Blocs de page",
    add: "Ajouter un bloc",
    save: "Enregistrer le brouillon",
    publish: "Publier l’accueil",
    preview: "Aperçu du brouillon",
    desktop: "Bureau",
    mobile: "Mobile",
    dirty: "Modifications non publiées",
    published: "Publié",
    last: "Dernière publication",
    never: "Jamais",
    editing: "Langue du contenu",
    enabled: "Visible",
    duplicate: "Dupliquer",
    remove: "Supprimer",
    hero: "Carrousel principal",
    stats: "Statistiques",
    performances: "Spectacles",
    programs: "Répertoire des programmes",
    news: "Actualités",
    media: "Récit image / vidéo",
    cta: "Appel à l’action final",
    addMedia: "Ajouter un bloc média",
    fixed: "Bloc de contenu connecté",
    fixedHelp:
      "Les éléments proviennent toujours des espaces Programmes, Spectacles ou Actualités.",
    titleLabel: "Titre",
    subtitleLabel: "Sous-titre",
    body: "Texte",
    linkText: "Texte du bouton",
    linkUrl: "Lien du bouton",
    layout: "Mise en page",
    mediaUrl: "URL du média",
    upload: "Téléverser une image ou vidéo",
    slides: "Diapositives",
    addSlide: "Ajouter une diapositive",
    badge: "Badge",
    overlay: "Style du voile",
    primary: "Bouton principal",
    secondary: "Bouton secondaire",
    value: "Valeur",
    label: "Libellé",
    addStat: "Ajouter une statistique",
    saved: "Brouillon enregistré.",
    publishedDone: "Accueil publié.",
    teacherPublish:
      "Ce compte dispose d’un accès en lecture seule et ne peut ni modifier ni publier l’accueil.",
    heroFirst: "Hero doit être le premier bloc visible.",
    aiTitle: "IA : compléter les langues du bloc",
    aiHelp:
      "L’IA ne modifie que les textes, jamais les médias, liens, ordre ou visibilité.",
  },
} as const;

const blockNames = (text: typeof ui.en): Record<HomepageBlockType, string> => ({
  hero: text.hero,
  stats: text.stats,
  performances: text.performances,
  programs: text.programs,
  news: text.news,
  media: text.media,
  cta: text.cta,
});
const defaultBlocks = (): HomepageBlock[] =>
  ["hero", "stats", "performances", "programs", "news", "cta"].map((type) => ({
    id: type,
    type: type as HomepageBlockType,
    title: "",
    subtitle: "",
    body: "",
    media_url: "",
    media_type: "auto",
    layout: "default",
    link: { label: "", href: "" },
    is_enabled: true,
  }));
const emptySlide = (): HomepageHeroSlide => ({
  badge: "",
  title: "",
  subtitle: "",
  primary: { label: "", href: "/programs" },
  secondary: { label: "", href: "/about/contact" },
  image_url: "",
  overlay: "from-primary/90 via-primary/70 to-primary/40",
  is_active: true,
});

function normalizeBundle(
  bundle: HomepageSettingsBundle,
): HomepageSettingsBundle {
  const reference = bundle.zh.blocks?.length
    ? bundle.zh.blocks
    : defaultBlocks();
  const normalize = (form: HomepageSettings) => ({
    ...form,
    blocks: reference.map(
      (block) =>
        form.blocks?.find((item) => item.id === block.id) || { ...block },
    ),
  });
  return {
    zh: normalize(bundle.zh),
    en: normalize(bundle.en),
    fr: normalize(bundle.fr),
  };
}
function videoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export default function HomepageBuilderPage() {
  const pathname = usePathname();
  const router = useRouter();
  const rawLocale = pathname.split("/")[1] || "zh";
  const locale: LocaleCode =
    rawLocale === "fr" ? "fr" : rawLocale === "en" ? "en" : "zh";
  const text = ui[locale];
  const [canManage, setCanManage] = useState(false);
  const [forms, setForms] = useState<HomepageSettingsBundle | null>(null);
  const [contentLocale, setContentLocale] = useState<LocaleCode>("zh");
  const [selectedId, setSelectedId] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [dirty, setDirty] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${rawLocale}/admin/login`);
      return;
    }
    Promise.all([usersApi.me(), homepageApi.draft()])
      .then(([account, result]) => {
        setCanManage(hasPermission(account, "content.homepage", "manage"));
        const bundle = normalizeBundle(result.bundle);
        setForms(bundle);
        setSelectedId(bundle.zh.blocks?.[0]?.id || "hero");
        setDirty(result.is_dirty);
        setPublishedAt(result.published_at || null);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load homepage draft",
        ),
      )
      .finally(() => setLoading(false));
  }, [rawLocale, router]);

  const form = forms?.[contentLocale];
  const blocks = form?.blocks || [];
  const selectedIndex = blocks.findIndex((block) => block.id === selectedId);
  const selected = selectedIndex >= 0 ? blocks[selectedIndex] : blocks[0];
  const aiFields = (): Record<string, string> => {
    if (!form || !selected) return {};
    if (selected.type === "hero") {
      const slide = form.hero_slides[0];
      return {
        badge: slide?.badge || "",
        title: slide?.title || "",
        subtitle: slide?.subtitle || "",
        primary_label: slide?.primary.label || "",
        secondary_label: slide?.secondary.label || "",
      };
    }
    if (selected.type === "stats") {
      return { stats_labels: form.stats.map((stat) => stat.label).filter(Boolean).join("\n") };
    }
    if (selected.type === "cta") {
      return {
        cta_title: form.cta.title,
        cta_subtitle: form.cta.subtitle,
        cta_note: form.cta.note,
        cta_primary_label: form.cta.primary.label,
        cta_secondary_label: form.cta.secondary.label,
      };
    }
    if (["programs", "performances", "news"].includes(selected.type)) {
      const section = form.sections[selected.type as "programs" | "performances" | "news"];
      return {
        title: section.title,
        subtitle: section.subtitle,
        primary_label: section.link_label,
      };
    }
    return {
      title: selected.title,
      subtitle: selected.subtitle,
      body: selected.body,
      primary_label: selected.link.label,
    };
  };
  const mutateLocale = (
    localeKey: LocaleCode,
    updater: (value: HomepageSettings) => HomepageSettings,
  ) =>
    setForms((current) =>
      current
        ? { ...current, [localeKey]: updater(current[localeKey]) }
        : current,
    );
  const mutateCurrent = (
    updater: (value: HomepageSettings) => HomepageSettings,
  ) => {
    mutateLocale(contentLocale, updater);
    setDirty(true);
  };
  const mutateBlock = (patch: Partial<HomepageBlock>) =>
    mutateCurrent((current) => ({
      ...current,
      blocks: current.blocks?.map((block) =>
        block.id === selected.id ? { ...block, ...patch } : block,
      ),
    }));
  const mutateStructure = (
    updater: (items: HomepageBlock[]) => HomepageBlock[],
  ) => {
    setForms((current) =>
      current
        ? {
            zh: { ...current.zh, blocks: updater(current.zh.blocks || []) },
            en: { ...current.en, blocks: updater(current.en.blocks || []) },
            fr: { ...current.fr, blocks: updater(current.fr.blocks || []) },
          }
        : current,
    );
    setDirty(true);
  };
  const moveBlock = (offset: number) =>
    mutateStructure((items) => {
      const index = items.findIndex((item) => item.id === selectedId);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const addMedia = () => {
    const id = `media-${Date.now()}`;
    mutateStructure((items) => [
      ...items,
      {
        id,
        type: "media",
        title: "",
        subtitle: "",
        body: "",
        media_url: "",
        media_type: "auto",
        layout: "media_left",
        link: { label: "", href: "" },
        is_enabled: true,
      },
    ]);
    setSelectedId(id);
  };
  const duplicate = () => {
    if (!selected) return;
    const id = `${selected.type}-${Date.now()}`;
    mutateStructure((items) => {
      const index = items.findIndex((item) => item.id === selected.id);
      const copy = { ...items[index], id };
      return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
    });
    setSelectedId(id);
  };
  const remove = () => {
    if (!selected || selected.type !== "media") return;
    mutateStructure((items) => items.filter((item) => item.id !== selected.id));
    setSelectedId("hero");
  };

  const updateSlide = (index: number, patch: Partial<HomepageHeroSlide>) =>
    mutateCurrent((current) => ({
      ...current,
      hero_slides: current.hero_slides.map((slide, itemIndex) =>
        itemIndex === index ? { ...slide, ...patch } : slide,
      ),
    }));
  const uploadMedia = async (
    target: "block" | number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const key = String(target);
    setUploading(key);
    setError("");
    try {
      const uploaded = file.type.startsWith("video/")
        ? await uploadApi.video(file, "homepage")
        : await uploadApi.image(file, "homepage");
      if (target === "block")
        mutateBlock({
          media_url: uploaded.url,
          media_type: file.type.startsWith("video/") ? "video" : "image",
        });
      else updateSlide(target, { image_url: uploaded.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const applyAi = (drafts: AiDraft[]) => {
    if (!forms || !selected) return;
    setForms((current) => {
      if (!current) return current;
      const next = { ...current };
      drafts.forEach((draft) => {
        const key =
          draft.locale === "fr" ? "fr" : draft.locale === "en" ? "en" : "zh";
        const fields = draft.fields || {};
        const localeForm = next[key];
        if (selected.type === "hero" && localeForm.hero_slides[0]) {
          next[key] = {
            ...localeForm,
            hero_slides: localeForm.hero_slides.map((slide, index) =>
              index === 0
                ? {
                    ...slide,
                    badge: slide.badge || fields.badge || "",
                    title: slide.title || fields.title || "",
                    subtitle: slide.subtitle || fields.subtitle || "",
                    primary: {
                      ...slide.primary,
                      label: slide.primary.label || fields.primary_label || "",
                    },
                    secondary: {
                      ...slide.secondary,
                      label:
                        slide.secondary.label || fields.secondary_label || "",
                    },
                  }
                : slide,
            ),
          };
          return;
        }
        if (selected.type === "stats") {
          const translatedLabels = (fields.stats_labels || "")
            .split(/\r?\n/)
            .map((value) => value.replace(/^\s*(?:[-*]|\d+[.)-]?)\s*/, "").trim())
            .filter(Boolean);
          next[key] = {
            ...localeForm,
            stats: localeForm.stats.map((stat, index) => ({
              ...stat,
              label: stat.label || translatedLabels[index] || "",
            })),
          };
          return;
        }
        if (selected.type === "cta") {
          next[key] = {
            ...localeForm,
            cta: {
              ...localeForm.cta,
              title: localeForm.cta.title || fields.cta_title || "",
              subtitle: localeForm.cta.subtitle || fields.cta_subtitle || "",
              note: localeForm.cta.note || fields.cta_note || "",
              primary: {
                ...localeForm.cta.primary,
                label: localeForm.cta.primary.label || fields.cta_primary_label || "",
              },
              secondary: {
                ...localeForm.cta.secondary,
                label: localeForm.cta.secondary.label || fields.cta_secondary_label || "",
              },
            },
          };
          return;
        }
        if (["programs", "performances", "news"].includes(selected.type)) {
          const sectionKey = selected.type as "programs" | "performances" | "news";
          const section = localeForm.sections[sectionKey];
          next[key] = {
            ...localeForm,
            sections: {
              ...localeForm.sections,
              [sectionKey]: {
                ...section,
                title: section.title || fields.title || "",
                subtitle: section.subtitle || fields.subtitle || "",
                link_label: section.link_label || fields.primary_label || "",
              },
            },
          };
          return;
        }
        next[key] = {
          ...localeForm,
          blocks: localeForm.blocks?.map((block) =>
            block.id === selected.id
              ? {
                  ...block,
                  title: block.title || fields.title || "",
                  subtitle: block.subtitle || fields.subtitle || "",
                  body: block.body || fields.body || "",
                  link: {
                    ...block.link,
                    label: block.link.label || fields.primary_label || "",
                  },
                }
              : block,
          ),
        };
      });
      return next;
    });
    setDirty(true);
  };

  const saveDraft = async () => {
    if (!forms) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await homepageApi.saveDraft(forms);
      setForms(normalizeBundle(result.bundle));
      setDirty(result.is_dirty);
      setPublishedAt(result.published_at || null);
      setMessage(text.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  };
  const publish = async () => {
    if (!forms) return;
    const first = forms.zh.blocks?.find((block) => block.is_enabled);
    if (first?.type !== "hero") {
      setError(text.heroFirst);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await homepageApi.saveDraft(forms);
      const result = await homepageApi.publish();
      setForms(normalizeBundle(result.bundle));
      setDirty(false);
      setPublishedAt(result.published_at || null);
      setMessage(text.publishedDone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !forms || !form || !selected)
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <AdminSectionTabs />
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  const names = blockNames(text as typeof ui.en);
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto max-w-[1500px] px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{text.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {text.subtitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {dirty ? text.dirty : text.published} · {text.last}:{" "}
              {publishedAt
                ? new Date(publishedAt).toLocaleString()
                : text.never}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setPreview((value) => !value)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {text.preview}
            </Button>
            {canManage && (
              <>
                <Button variant="outline" onClick={saveDraft} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {text.save}
                </Button>
                <Button onClick={publish} disabled={saving}>
                  <Send className="mr-2 h-4 w-4" />
                  {text.publish}
                </Button>
              </>
            )}
          </div>
        </div>
        {!canManage && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {text.teacherPublish}
          </div>
        )}
        {(error || message) && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {error || message}
          </div>
        )}
        <div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">{text.blocks}</CardTitle>
                <Button size="sm" variant="outline" onClick={addMedia}>
                  <Plus className="mr-1 h-4 w-4" />
                  {text.add}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {blocks.map((block, index) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setSelectedId(block.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors",
                      selected.id === block.id
                        ? "border-fuchsia-300 bg-fuchsia-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-slate-100 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {block.title || names[block.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {names[block.type]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        block.is_enabled ? "bg-emerald-500" : "bg-slate-300",
                      )}
                    />
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>
          <fieldset disabled={!canManage} className="space-y-4 disabled:opacity-80">
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2 py-4">
                <span className="mr-2 text-sm font-medium">{text.editing}</span>
                {locales.map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={
                      contentLocale === item.value ? "default" : "outline"
                    }
                    onClick={() => setContentLocale(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="ml-auto flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveBlock(-1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveBlock(1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={duplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    {text.duplicate}
                  </Button>
                  {selected.type === "media" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={remove}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {text.remove}
                    </Button>
                  )}
                  <label className="ml-2 flex items-center gap-2 text-sm">
                    <Switch
                      checked={selected.is_enabled}
                      onCheckedChange={(checked) =>
                        mutateBlock({ is_enabled: checked })
                      }
                    />
                    {text.enabled}
                  </label>
                </div>
              </CardContent>
            </Card>
            <AiLocaleSyncPanel
              module="homepage"
              sourceLocale={contentLocale}
              uiLocale={locale}
              title={text.aiTitle}
              description={text.aiHelp}
              fields={
                aiFields()
              }
              onApply={applyAi}
            />
            {selected.type === "hero" ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{text.slides}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      mutateCurrent((current) => ({
                        ...current,
                        hero_slides: [...current.hero_slides, emptySlide()],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {text.addSlide}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.hero_slides.map((slide, index) => (
                    <details
                      key={index}
                      className="border bg-white"
                      open={index === 0}
                    >
                      <summary className="cursor-pointer px-4 py-3 font-semibold">
                        {text.slides} {index + 1} ·{" "}
                        {slide.title || text.titleLabel}
                      </summary>
                      <div className="grid gap-4 border-t p-4 lg:grid-cols-[240px_1fr]">
                        <div className="space-y-3">
                          <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                            {slide.image_url ? (
                              videoUrl(slide.image_url) ? (
                                <video
                                  src={slide.image_url}
                                  className="h-full w-full object-cover"
                                  muted
                                  controls
                                />
                              ) : (
                                <img
                                  src={slide.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No media
                              </div>
                            )}
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            disabled={uploading === String(index)}
                          >
                            <label>
                              {uploading === String(index) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ImagePlus className="mr-2 h-4 w-4" />
                              )}
                              {text.upload}
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(event) => uploadMedia(index, event)}
                              />
                            </label>
                          </Button>
                          <Input
                            value={slide.image_url}
                            onChange={(event) =>
                              updateSlide(index, {
                                image_url: event.target.value,
                              })
                            }
                            placeholder={text.mediaUrl}
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            value={slide.badge}
                            onChange={(event) =>
                              updateSlide(index, { badge: event.target.value })
                            }
                            placeholder={text.badge}
                          />
                          <Input
                            value={slide.overlay}
                            onChange={(event) =>
                              updateSlide(index, {
                                overlay: event.target.value,
                              })
                            }
                            placeholder={text.overlay}
                          />
                          <Input
                            className="md:col-span-2"
                            value={slide.title}
                            onChange={(event) =>
                              updateSlide(index, { title: event.target.value })
                            }
                            placeholder={text.titleLabel}
                          />
                          <Textarea
                            className="md:col-span-2"
                            value={slide.subtitle}
                            onChange={(event) =>
                              updateSlide(index, {
                                subtitle: event.target.value,
                              })
                            }
                            placeholder={text.subtitleLabel}
                          />
                          <Input
                            value={slide.primary.label}
                            onChange={(event) =>
                              updateSlide(index, {
                                primary: {
                                  ...slide.primary,
                                  label: event.target.value,
                                },
                              })
                            }
                            placeholder={text.primary}
                          />
                          <Input
                            value={slide.primary.href}
                            onChange={(event) =>
                              updateSlide(index, {
                                primary: {
                                  ...slide.primary,
                                  href: event.target.value,
                                },
                              })
                            }
                            placeholder={text.linkUrl}
                          />
                          <Input
                            value={slide.secondary.label}
                            onChange={(event) =>
                              updateSlide(index, {
                                secondary: {
                                  ...slide.secondary,
                                  label: event.target.value,
                                },
                              })
                            }
                            placeholder={text.secondary}
                          />
                          <Input
                            value={slide.secondary.href}
                            onChange={(event) =>
                              updateSlide(index, {
                                secondary: {
                                  ...slide.secondary,
                                  href: event.target.value,
                                },
                              })
                            }
                            placeholder={text.linkUrl}
                          />
                          <div className="md:col-span-2 flex justify-between">
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={slide.is_active}
                                onCheckedChange={(checked) =>
                                  updateSlide(index, { is_active: checked })
                                }
                              />
                              {text.enabled}
                            </label>
                            {form.hero_slides.length > 1 && (
                              <Button
                                variant="ghost"
                                className="text-red-600"
                                onClick={() =>
                                  mutateCurrent((current) => ({
                                    ...current,
                                    hero_slides: current.hero_slides.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  }))
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {text.remove}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </CardContent>
              </Card>
            ) : selected.type === "stats" ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{text.stats}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      mutateCurrent((current) => ({
                        ...current,
                        stats: [...current.stats, { value: "", label: "" }],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {text.addStat}
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {form.stats.map((stat, index) => (
                    <div key={index} className="space-y-2 border p-3">
                      <Input
                        value={stat.value}
                        onChange={(event) =>
                          mutateCurrent((current) => ({
                            ...current,
                            stats: current.stats.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, value: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        placeholder={text.value}
                      />
                      <Input
                        value={stat.label}
                        onChange={(event) =>
                          mutateCurrent((current) => ({
                            ...current,
                            stats: current.stats.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        placeholder={text.label}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() =>
                          mutateCurrent((current) => ({
                            ...current,
                            stats: current.stats.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                      >
                        {text.remove}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : selected.type === "media" ? (
              <Card>
                <CardHeader>
                  <CardTitle>{text.media}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-[280px_1fr]">
                  <div className="space-y-3">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {selected.media_url ? (
                        videoUrl(selected.media_url) ||
                        selected.media_type === "video" ? (
                          <video
                            src={selected.media_url}
                            controls
                            muted
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={selected.media_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No media
                        </div>
                      )}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <label>
                        {uploading === "block" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Video className="mr-2 h-4 w-4" />
                        )}
                        {text.upload}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(event) => uploadMedia("block", event)}
                        />
                      </label>
                    </Button>
                    <Input
                      value={selected.media_url}
                      onChange={(event) =>
                        mutateBlock({ media_url: event.target.value })
                      }
                      placeholder={text.mediaUrl}
                    />
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={selected.title}
                      onChange={(event) =>
                        mutateBlock({ title: event.target.value })
                      }
                      placeholder={text.titleLabel}
                    />
                    <Input
                      value={selected.subtitle}
                      onChange={(event) =>
                        mutateBlock({ subtitle: event.target.value })
                      }
                      placeholder={text.subtitleLabel}
                    />
                    <Textarea
                      rows={7}
                      value={selected.body}
                      onChange={(event) =>
                        mutateBlock({ body: event.target.value })
                      }
                      placeholder={text.body}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={selected.link.label}
                        onChange={(event) =>
                          mutateBlock({
                            link: {
                              ...selected.link,
                              label: event.target.value,
                            },
                          })
                        }
                        placeholder={text.linkText}
                      />
                      <Input
                        value={selected.link.href}
                        onChange={(event) =>
                          mutateBlock({
                            link: {
                              ...selected.link,
                              href: event.target.value,
                            },
                          })
                        }
                        placeholder={text.linkUrl}
                      />
                    </div>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={selected.layout}
                      onChange={(event) =>
                        mutateBlock({
                          layout: event.target.value as HomepageBlock["layout"],
                        })
                      }
                    >
                      <option value="media_left">Media left</option>
                      <option value="media_right">Media right</option>
                      <option value="full_bleed">Full bleed</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ) : selected.type === "cta" ? (
              <Card>
                <CardHeader>
                  <CardTitle>{text.cta}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Input
                    className="md:col-span-2"
                    value={form.cta.title}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: { ...current.cta, title: event.target.value },
                      }))
                    }
                    placeholder={text.titleLabel}
                  />
                  <Input
                    className="md:col-span-2"
                    value={form.cta.subtitle}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: { ...current.cta, subtitle: event.target.value },
                      }))
                    }
                    placeholder={text.subtitleLabel}
                  />
                  <Textarea
                    className="md:col-span-2"
                    value={form.cta.note}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: { ...current.cta, note: event.target.value },
                      }))
                    }
                    placeholder={text.body}
                  />
                  <Input
                    value={form.cta.primary.label}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: {
                          ...current.cta,
                          primary: {
                            ...current.cta.primary,
                            label: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.primary}
                  />
                  <Input
                    value={form.cta.primary.href}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: {
                          ...current.cta,
                          primary: {
                            ...current.cta.primary,
                            href: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.linkUrl}
                  />
                  <Input
                    value={form.cta.secondary.label}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: {
                          ...current.cta,
                          secondary: {
                            ...current.cta.secondary,
                            label: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.secondary}
                  />
                  <Input
                    value={form.cta.secondary.href}
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        cta: {
                          ...current.cta,
                          secondary: {
                            ...current.cta.secondary,
                            href: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.linkUrl}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{names[selected.type]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-purple-100 bg-purple-50 p-3 text-sm text-purple-900">
                    <strong>{text.fixed}</strong>
                    <p className="mt-1">{text.fixedHelp}</p>
                  </div>
                  <Input
                    value={
                      form.sections[
                        selected.type as "programs" | "performances" | "news"
                      ].title
                    }
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        sections: {
                          ...current.sections,
                          [selected.type]: {
                            ...current.sections[
                              selected.type as
                                "programs" | "performances" | "news"
                            ],
                            title: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.titleLabel}
                  />
                  <Textarea
                    value={
                      form.sections[
                        selected.type as "programs" | "performances" | "news"
                      ].subtitle
                    }
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        sections: {
                          ...current.sections,
                          [selected.type]: {
                            ...current.sections[
                              selected.type as
                                "programs" | "performances" | "news"
                            ],
                            subtitle: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.subtitleLabel}
                  />
                  <Input
                    value={
                      form.sections[
                        selected.type as "programs" | "performances" | "news"
                      ].link_label
                    }
                    onChange={(event) =>
                      mutateCurrent((current) => ({
                        ...current,
                        sections: {
                          ...current.sections,
                          [selected.type]: {
                            ...current.sections[
                              selected.type as
                                "programs" | "performances" | "news"
                            ],
                            link_label: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={text.linkText}
                  />
                </CardContent>
              </Card>
            )}
          </fieldset>
        </div>
        {preview && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black/70 p-3 sm:p-6">
            <div className="mx-auto max-w-[1450px]">
              <div className="mb-3 flex justify-end gap-2">
                <Button
                  variant={device === "desktop" ? "default" : "secondary"}
                  onClick={() => setDevice("desktop")}
                >
                  <Laptop className="mr-2 h-4 w-4" />
                  {text.desktop}
                </Button>
                <Button
                  variant={device === "mobile" ? "default" : "secondary"}
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  {text.mobile}
                </Button>
                <Button variant="secondary" onClick={() => setPreview(false)}>
                  Close
                </Button>
              </div>
              <div
                className={cn(
                  "mx-auto overflow-hidden bg-white shadow-2xl transition-all",
                  device === "mobile" ? "w-[390px] max-w-full" : "w-full",
                )}
              >
                {blocks
                  .filter((block) => block.is_enabled)
                  .map((block) => (
                    <div
                      key={block.id}
                      className={cn(
                        "border-b",
                        block.type === "hero"
                          ? "flex min-h-[420px] items-end bg-slate-900 p-8 text-white"
                          : block.type === "stats"
                            ? "grid grid-cols-2 gap-4 p-8 md:grid-cols-4"
                            : "p-8",
                      )}
                    >
                      {block.type === "hero" ? (
                        <div>
                          <p className="text-sm uppercase">
                            {form.hero_slides[0]?.badge}
                          </p>
                          <h2 className="mt-2 text-4xl font-bold">
                            {form.hero_slides[0]?.title}
                          </h2>
                          <p className="mt-3">
                            {form.hero_slides[0]?.subtitle}
                          </p>
                        </div>
                      ) : block.type === "stats" ? (
                        form.stats.map((stat, index) => (
                          <div key={index} className="text-center">
                            <strong className="text-3xl text-fuchsia-700">
                              {stat.value}
                            </strong>
                            <p>{stat.label}</p>
                          </div>
                        ))
                      ) : block.type === "media" ? (
                        <div
                          className={cn(
                            "grid items-center gap-6",
                            device === "desktop" && "grid-cols-2",
                          )}
                        >
                          <div className="aspect-[4/3] bg-slate-100">
                            {block.media_url &&
                              (videoUrl(block.media_url) ? (
                                <video
                                  src={block.media_url}
                                  className="h-full w-full object-cover"
                                  muted
                                />
                              ) : (
                                <img
                                  src={block.media_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ))}
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold">
                              {block.title}
                            </h2>
                            <p className="mt-3 whitespace-pre-line text-slate-600">
                              {block.body}
                            </p>
                          </div>
                        </div>
                      ) : block.type === "cta" ? (
                        <div className="bg-fuchsia-950 p-8 text-white">
                          <h2 className="text-3xl font-bold">
                            {form.cta.title}
                          </h2>
                          <p className="mt-3">{form.cta.note}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs uppercase text-fuchsia-700">
                            {names[block.type]}
                          </span>
                          <h2 className="mt-2 text-3xl font-bold">
                            {
                              form.sections[
                                block.type as
                                  "programs" | "performances" | "news"
                              ].title
                            }
                          </h2>
                          <p className="mt-2 text-slate-600">
                            {
                              form.sections[
                                block.type as
                                  "programs" | "performances" | "news"
                              ].subtitle
                            }
                          </p>
                          <div className="mt-6 grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((item) => (
                              <div key={item} className="h-24 bg-slate-100" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
