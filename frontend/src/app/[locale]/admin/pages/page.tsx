"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Eye,
  GripVertical,
  ImagePlus,
  Languages,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  pagesApi,
  uploadApi,
  aiApi,
  type SitePageBlock,
  type SitePageBlockType,
  type SitePageDocument,
  type SitePageLocalizedContent,
  type SitePageSlug,
} from "@/lib/api";
import { toPublicMediaUrl } from "@/lib/media";
import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";

type Locale = "zh" | "en" | "fr";
const emptyContent = (): SitePageLocalizedContent => ({
  eyebrow: "",
  title: "",
  subtitle: "",
  body: "",
  label: "",
  caption: "",
  alt_text: "",
  primary_label: "",
  secondary_label: "",
  placeholder: "",
  success_message: "",
  name_label: "",
  email_label: "",
  subject_label: "",
  message_label: "",
});
const emptyBlock = (type: SitePageBlockType, index: number): SitePageBlock => ({
  id: `block-${Date.now()}-${index}`,
  type,
  admin_label: type,
  is_enabled: true,
  content: { zh: emptyContent(), en: emptyContent(), fr: emptyContent() },
  items: [],
  image_url: "",
  mobile_image_url: "",
  focal_point: "50% 50%",
  decorative_image: false,
  href: "",
  design: {},
});
const MEDIA_BLOCKS = new Set<SitePageBlockType>([
  "hero",
  "rich_text",
  "media_story",
]);
const BODY_BLOCKS = new Set<SitePageBlockType>([
  "rich_text",
  "media_story",
  "values_grid",
  "office_hours",
  "map_link",
  "cta",
]);
const SUBTITLE_BLOCKS = new Set<SitePageBlockType>([
  "hero",
  "rich_text",
  "media_story",
  "office_hours",
]);
const FORM_DEFAULTS: Record<Locale, Pick<SitePageLocalizedContent, "name_label" | "email_label" | "subject_label" | "message_label" | "primary_label">> = {
  zh: { name_label: "姓名", email_label: "邮箱", subject_label: "主题", message_label: "留言", primary_label: "发送消息" },
  en: { name_label: "Name", email_label: "Email", subject_label: "Subject", message_label: "Message", primary_label: "Send message" },
  fr: { name_label: "Nom", email_label: "Courriel", subject_label: "Objet", message_label: "Message", primary_label: "Envoyer" },
};

function normalizePageDocument(page: SitePageDocument): SitePageDocument {
  const normalizeBlock = (block: SitePageBlock): SitePageBlock => {
    if (block.type !== "contact_form") return block;
    const content = { ...block.content };
    (["zh", "en", "fr"] as Locale[]).forEach((language) => {
      const current = content[language];
      const defaults = FORM_DEFAULTS[language];
      content[language] = {
        ...current,
        name_label: current.name_label || defaults.name_label,
        email_label: current.email_label || defaults.email_label,
        subject_label: current.subject_label || defaults.subject_label,
        message_label: current.message_label || defaults.message_label,
        primary_label: current.primary_label || current.label || defaults.primary_label,
      };
    });
    return { ...block, content };
  };
  return { ...page, hero: normalizeBlock(page.hero), blocks: page.blocks.map(normalizeBlock) };
}

export default function PagesWorkspace({
  params,
}: {
  params: { locale: string };
}) {
  const uiLocale =
    params.locale === "fr"
      ? "fr"
      : params.locale.startsWith("zh")
        ? "zh"
        : "en";
  const [slug, setSlug] = useState<SitePageSlug>("about");
  const [page, setPage] = useState<SitePageDocument | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [contentLocale, setContentLocale] = useState<Locale>("zh");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const selected = useMemo(
    () =>
      (page &&
        (page.hero.id === selectedId
          ? page.hero
          : page.blocks.find((item) => item.id === selectedId))) ||
      page?.hero ||
      null,
    [page, selectedId],
  );

  async function load(nextSlug = slug) {
    setLoading(true);
    setError("");
    try {
      const result = await pagesApi.draft(nextSlug);
      const normalized = normalizePageDocument(result.page);
      setPage(normalized);
      setSelectedId(normalized.hero.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load page");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [slug]);

  function updateSelected(update: (block: SitePageBlock) => SitePageBlock) {
    if (!page || !selected) return;
    const next = update(selected);
    setPage({
      ...page,
      hero: page.hero.id === selected.id ? next : page.hero,
      blocks: page.blocks.map((item) =>
        item.id === selected.id ? next : item,
      ),
    });
  }
  function updateContent(
    key: keyof SitePageBlock["content"]["zh"],
    value: string,
  ) {
    updateSelected((block) => ({
      ...block,
      content: {
        ...block.content,
        [contentLocale]: { ...block.content[contentLocale], [key]: value },
      },
    }));
  }
  function reorder(delta: number) {
    if (!page || !selected || selected.id === page.hero.id) return;
    const index = page.blocks.findIndex((item) => item.id === selected.id);
    const target = index + delta;
    if (target < 0 || target >= page.blocks.length) return;
    const blocks = [...page.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setPage({ ...page, blocks });
  }
  function duplicateSelected() {
    if (!page || !selected || selected.id === page.hero.id) return;
    const clone = {
      ...selected,
      id: `${selected.id}-copy-${Date.now()}`,
      admin_label: `${selected.admin_label} copy`,
    };
    const index = page.blocks.findIndex((item) => item.id === selected.id);
    const blocks = [...page.blocks];
    blocks.splice(index + 1, 0, clone);
    setPage({ ...page, blocks });
    setSelectedId(clone.id);
  }
  function removeSelected() {
    if (!page || !selected || selected.id === page.hero.id) return;
    setPage({
      ...page,
      blocks: page.blocks.filter((item) => item.id !== selected.id),
    });
    setSelectedId(page.hero.id);
  }
  function addBlock(type: SitePageBlockType) {
    if (!page || type === "hero") return;
    const block = emptyBlock(type, page.blocks.length);
    setPage({ ...page, blocks: [...page.blocks, block] });
    setSelectedId(block.id);
  }
  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
    mobile = false,
  ) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    setBusy(true);
    try {
      const result = await uploadApi.image(file, "pages");
      updateSelected((block) => ({
        ...block,
        [mobile ? "mobile_image_url" : "image_url"]: result.url,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }
  async function translateSelected() {
    if (!selected) return;
    const zh = selected.content.zh;
    if (!zh.title.trim() && !zh.body.trim() && !zh.subtitle.trim()) {
      setError(
        uiLocale === "zh"
          ? "请先填写中文内容"
          : "Please enter Chinese content first",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await aiApi.translate({
        module: "pages",
        source_locale: "zh",
        target_locales: ["en", "fr"],
        fields: {
          eyebrow: zh.eyebrow,
          title: zh.title,
          subtitle: zh.subtitle,
          body: zh.body,
          label: zh.label,
          primary_label: zh.primary_label,
          placeholder: zh.placeholder,
          success_message: zh.success_message,
          name_label: zh.name_label,
          email_label: zh.email_label,
          subject_label: zh.subject_label,
          message_label: zh.message_label,
          alt_text: zh.alt_text,
        },
        tone: "clear and welcoming",
      });
      const drafts = Object.fromEntries(
        result.drafts.map((draft) => [draft.locale, draft.fields]),
      );
      setPage((current) => {
        if (!current) return current;
        const updateLocale = (
          existing: SitePageLocalizedContent,
          draft?: Record<string, string>,
        ): SitePageLocalizedContent => {
          if (!draft) return existing;
          const next = { ...existing };
          Object.entries(draft).forEach(([key, value]) => {
            if (
              key in next &&
              !String(
                next[key as keyof SitePageLocalizedContent] || "",
              ).trim() &&
              String(value || "").trim()
            )
              next[key as keyof SitePageLocalizedContent] = value;
          });
          return next;
        };
        const update = (block: SitePageBlock) =>
          block.id !== selected.id
            ? block
            : {
                ...block,
                content: {
                  ...block.content,
                  en: updateLocale(block.content.en, drafts.en),
                  fr: updateLocale(block.content.fr, drafts.fr),
                },
              };
        return {
          ...current,
          hero: update(current.hero),
          blocks: current.blocks.map(update),
        };
      });
      setMessage(
        uiLocale === "zh"
          ? "当前区块英法文已生成，请检查后保存。"
          : "English and French drafts are ready. Review and save.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI translation failed");
    } finally {
      setBusy(false);
    }
  }
  async function save(publish = false) {
    if (!page) return;
    setBusy(true);
    setError("");
    try {
      await pagesApi.saveDraft(slug, page);
      if (publish) {
        await pagesApi.publish(slug);
        setMessage(uiLocale === "zh" ? "页面已发布" : "Page published");
      } else setMessage(uiLocale === "zh" ? "草稿已保存" : "Draft saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const labels =
    uiLocale === "zh"
      ? {
          about: "关于我们",
          contact: "联系我们",
          blocks: "页面区块",
          content: "内容",
          media: "媒体",
          display: "显示",
          save: "保存草稿",
          publish: "发布",
          translate: "AI 补齐英法文",
          add: "添加区块",
          image: "上传图片",
          mobile: "上传手机图片",
          alt: "替代文字",
          title: "标题",
          subtitle: "副标题",
          body: "正文",
          label: "按钮文字",
          href: "链接",
          enabled: "显示区块",
        }
      : uiLocale === "fr"
        ? {
            about: "À propos",
            contact: "Nous contacter",
            blocks: "Blocs de page",
            content: "Contenu",
            media: "Média",
            display: "Affichage",
            save: "Enregistrer le brouillon",
            publish: "Publier",
            translate: "Compléter anglais/français",
            add: "Ajouter un bloc",
            image: "Téléverser une image",
            mobile: "Image mobile",
            alt: "Texte alternatif",
            title: "Titre",
            subtitle: "Sous-titre",
            body: "Texte",
            label: "Libellé du bouton",
            href: "Lien",
            enabled: "Afficher le bloc",
          }
        : {
            about: "About Us",
            contact: "Contact Us",
            blocks: "Page blocks",
            content: "Content",
            media: "Media",
            display: "Display",
            save: "Save draft",
            publish: "Publish",
            translate: "Complete English/French",
            add: "Add block",
            image: "Upload image",
            mobile: "Upload mobile image",
            alt: "Alt text",
            title: "Title",
            subtitle: "Subtitle",
            body: "Body",
            label: "Button label",
            href: "Link",
            enabled: "Show block",
          };

  return (
    <>
      <AdminSectionTabs />
      <main className="container py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Website Content</p>
          <h1 className="heading-lg">Page Content</h1>
          <p className="text-sm text-muted-foreground">
            Draft, translate, preview, and publish About and Contact pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy || !page}
            onClick={() => setPreview((value) => !value)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !page}
            onClick={() => void translateSelected()}
          >
            <Languages className="mr-2 h-4 w-4" />
            {labels.translate}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !page}
            onClick={() => void save()}
          >
            <Save className="mr-2 h-4 w-4" />
            {labels.save}
          </Button>
          <Button disabled={busy || !page} onClick={() => void save(true)}>
            <Send className="mr-2 h-4 w-4" />
            {labels.publish}
          </Button>
        </div>
      </div>
      {message && (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-5 flex gap-2 border-b">
        <Button
          variant={slug === "about" ? "default" : "ghost"}
          onClick={() => setSlug("about")}
        >
          {labels.about}
        </Button>
        <Button
          variant={slug === "contact" ? "default" : "ghost"}
          onClick={() => setSlug("contact")}
        >
          {labels.contact}
        </Button>
      </div>
      {loading || !page ? (
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">{labels.blocks}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <BlockOutline
                  block={page.hero}
                  active={selectedId === page.hero.id}
                  onClick={() => setSelectedId(page.hero.id)}
                  hero
                />
                <div className="space-y-2">
                  {page.blocks.map((block) => (
                    <BlockOutline
                      key={block.id}
                      block={block}
                      active={selectedId === block.id}
                      onClick={() => setSelectedId(block.id)}
                    />
                  ))}
                </div>
                <Select
                  onValueChange={(value) =>
                    addBlock(value as SitePageBlockType)
                  }
                >
                  <SelectTrigger>
                    <Plus className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={labels.add} />
                  </SelectTrigger>
                  <SelectContent>
                    {(slug === "about"
                      ? ["rich_text", "bullet_list", "media_story", "values_grid", "cta"]
                      : ["rich_text", "contact_details", "office_hours", "contact_form", "map_link", "cta"]
                    ).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-col gap-4 border-b md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base">
                  {selected?.admin_label || selected?.type}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={contentLocale}
                    onValueChange={(value) => setContentLocale(value as Locale)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                  {selected && selected.id !== page.hero.id && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Move up"
                        onClick={() => reorder(-1)}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Duplicate"
                        onClick={duplicateSelected}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        onClick={removeSelected}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {selected && <PageBlockEditor block={selected} locale={contentLocale} labels={labels} busy={busy} updateContent={updateContent} updateBlock={updateSelected} uploadImage={uploadImage} />}
              </CardContent>
            </Card>
          </div>
          {preview && (
            <DraftPreview
              page={page}
              locale={contentLocale}
              device={previewDevice}
              setDevice={setPreviewDevice}
            />
          )}
        </>
      )}
      </main>
    </>
  );
}

function PageBlockEditor({ block, locale, labels, busy, updateContent, updateBlock, uploadImage }: {
  block: SitePageBlock;
  locale: Locale;
  labels: Record<string, string>;
  busy: boolean;
  updateContent: (key: keyof SitePageLocalizedContent, value: string) => void;
  updateBlock: (update: (block: SitePageBlock) => SitePageBlock) => void;
  uploadImage: (event: ChangeEvent<HTMLInputElement>, mobile?: boolean) => Promise<void>;
}) {
  const content = block.content[locale];
  const buttonBlock = block.type === "cta" || block.type === "map_link";
  const listBlock = block.type === "bullet_list" || block.type === "values_grid";
  const formBlock = block.type === "contact_form";
  const contactCopy = locale === "fr" ? "Les coordonnées proviennent de Système > Contact et réseaux sociaux." : locale === "en" ? "Contact details come from System > Contact & social media." : "地址、电话和邮箱统一读取“系统设置 > 联系与社交媒体”。";
  const field = (key: keyof SitePageLocalizedContent, label: string, multiline = false) => <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span>{multiline ? <Textarea rows={key === "body" ? 7 : 3} value={String(content[key] || "")} onChange={(event) => updateContent(key, event.target.value)} /> : <Input value={String(content[key] || "")} onChange={(event) => updateContent(key, event.target.value)} />}</label>;
  const updateItem = (index: number, value: string) => updateBlock((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [locale]: value } : item) }));
  return <>
    <div className="rounded-md border bg-muted/20 p-4"><p className="text-xs font-semibold uppercase text-primary">{block.type.replaceAll("_", " ")}</p><label className="mt-3 block space-y-1.5 text-sm"><span className="font-medium">{locale === "fr" ? "Nom interne" : locale === "en" ? "Admin label" : "后台名称"}</span><Input value={block.admin_label} onChange={(event) => updateBlock((current) => ({ ...current, admin_label: event.target.value }))} /></label></div>
    <div className="grid gap-4 md:grid-cols-2">
      {(block.type === "hero" || block.type === "media_story") && field("eyebrow", locale === "fr" ? "Surtitre" : locale === "en" ? "Eyebrow" : "小标题")}
      {field("title", labels.title)}
    </div>
    {SUBTITLE_BLOCKS.has(block.type) && field("subtitle", labels.subtitle, true)}
    {BODY_BLOCKS.has(block.type) && field("body", labels.body, true)}
    {block.type === "contact_details" && <div className="rounded-md border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-6 text-muted-foreground">{contactCopy}</div>}
    {listBlock && <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{locale === "fr" ? "Éléments" : locale === "en" ? "List items" : "列表项目"}</p><Button type="button" size="sm" variant="outline" onClick={() => updateBlock((current) => ({ ...current, items: [...current.items, { zh: "", en: "", fr: "" }] }))}><Plus className="mr-1 h-4 w-4" />{locale === "fr" ? "Ajouter" : locale === "en" ? "Add item" : "添加项目"}</Button></div>{block.items.map((item, index) => <div key={index} className="flex gap-2"><Input value={String(item[locale] || "")} onChange={(event) => updateItem(index, event.target.value)} /><Button type="button" size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => updateBlock((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
    {formBlock && <div className="grid gap-4 md:grid-cols-2">{field("name_label", locale === "fr" ? "Libellé du nom" : locale === "en" ? "Name field" : "姓名字段")}{field("email_label", locale === "fr" ? "Libellé du courriel" : locale === "en" ? "Email field" : "邮箱字段")}{field("subject_label", locale === "fr" ? "Libellé de l’objet" : locale === "en" ? "Subject field" : "主题字段")}{field("message_label", locale === "fr" ? "Libellé du message" : locale === "en" ? "Message field" : "留言字段")}{field("placeholder", locale === "fr" ? "Texte indicatif du message" : locale === "en" ? "Message placeholder" : "留言提示文字")}{field("primary_label", labels.label)}<div className="md:col-span-2">{field("success_message", locale === "fr" ? "Message de confirmation" : locale === "en" ? "Confirmation message" : "提交后提示", true)}</div></div>}
    {buttonBlock && <div className="grid gap-4 md:grid-cols-2">{field("primary_label", labels.label)}<label className="space-y-1.5 text-sm"><span className="font-medium">{labels.href}</span><Input value={block.href} onChange={(event) => updateBlock((current) => ({ ...current, href: event.target.value }))} /></label></div>}
    {MEDIA_BLOCKS.has(block.type) && <div className="space-y-4 border-t pt-5"><div className="grid gap-4 md:grid-cols-2"><label className="rounded-md border border-dashed p-4 text-sm font-medium"><ImagePlus className="mb-2 h-5 w-5 text-primary" />{labels.image}<Input className="mt-3" type="file" accept="image/*" disabled={busy} onChange={(event) => void uploadImage(event)} />{block.image_url && <img src={toPublicMediaUrl(block.image_url)} alt="" className="mt-3 aspect-[16/9] w-full rounded object-cover" />}</label><label className="rounded-md border border-dashed p-4 text-sm font-medium"><ImagePlus className="mb-2 h-5 w-5 text-primary" />{labels.mobile}<Input className="mt-3" type="file" accept="image/*" disabled={busy} onChange={(event) => void uploadImage(event, true)} />{block.mobile_image_url && <img src={toPublicMediaUrl(block.mobile_image_url)} alt="" className="mt-3 aspect-[9/12] h-36 rounded object-cover" />}</label></div>{!block.decorative_image && field("alt_text", labels.alt)}<div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span className="font-medium">{locale === "fr" ? "Point focal" : locale === "en" ? "Focal point" : "图片焦点"}</span><Input value={block.focal_point} placeholder="50% 50%" onChange={(event) => updateBlock((current) => ({ ...current, focal_point: event.target.value }))} /></label>{block.type !== "hero" && <label className="space-y-1.5 text-sm"><span className="font-medium">{locale === "fr" ? "Position de l’image" : locale === "en" ? "Image position" : "图片位置"}</span><Select value={String(block.design.media_side || "right")} onValueChange={(media_side) => updateBlock((current) => ({ ...current, design: { ...current.design, media_side } }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="left">{locale === "fr" ? "Gauche" : locale === "en" ? "Left" : "左侧"}</SelectItem><SelectItem value="right">{locale === "fr" ? "Droite" : locale === "en" ? "Right" : "右侧"}</SelectItem></SelectContent></Select></label>}</div><label className="flex min-h-11 items-center gap-3 rounded-md border px-4 text-sm font-medium"><input type="checkbox" checked={block.decorative_image} onChange={(event) => updateBlock((current) => ({ ...current, decorative_image: event.target.checked }))} />{locale === "fr" ? "Image décorative" : locale === "en" ? "Decorative image" : "装饰图片（无需替代文字）"}</label></div>}
    <label className="flex min-h-12 items-center justify-between rounded-md border px-4 text-sm font-semibold"><span>{labels.enabled}</span><input type="checkbox" checked={block.is_enabled} onChange={(event) => updateBlock((current) => ({ ...current, is_enabled: event.target.checked }))} /></label>
  </>;
}

function BlockOutline({
  block,
  active,
  onClick,
  hero = false,
}: {
  block: SitePageBlock;
  active: boolean;
  onClick: () => void;
  hero?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${active ? "border-primary bg-primary/10" : "hover:bg-muted"} ${!block.is_enabled ? "opacity-50" : ""}`}
    >
      <span className="text-xs text-muted-foreground">{hero ? "H" : "•"}</span>
      <span className="min-w-0 flex-1 truncate">
        {block.admin_label || block.type}
      </span>
    </button>
  );
}

function DraftPreview({
  page,
  locale,
  device,
  setDevice,
}: {
  page: SitePageDocument;
  locale: Locale;
  device: "desktop" | "mobile";
  setDevice: (value: "desktop" | "mobile") => void;
}) {
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Draft preview</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={device === "desktop" ? "default" : "outline"}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </Button>
          <Button
            size="sm"
            variant={device === "mobile" ? "default" : "outline"}
            onClick={() => setDevice("mobile")}
          >
            Mobile
          </Button>
        </div>
      </CardHeader>
      <CardContent>
          <div className={`mx-auto overflow-hidden rounded-lg border bg-background ${device === "mobile" ? "max-w-[390px]" : "max-w-5xl"}`}>
            <SitePageRenderer slug={page.slug} locale={locale} document={page} />
          </div>
      </CardContent>
    </Card>
  );
}
