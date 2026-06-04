'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "@/components/ui/i18n-client";
import {
  aiApi,
  isAuthenticated,
  newsApi,
  performanceApi,
  uploadApi,
  type AiArticleImportItem,
  type AiDraft,
  type NewsArticleGroup,
  type PerformanceBody,
} from "@/lib/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { dateLocaleFor } from "@/lib/i18n";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  Save,
  Eye,
  List,
  ListOrdered,
  Underline,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Sparkles,
  Wand2,
} from "lucide-react";

// Simple vertical divider component (replaces Separator)
const VDivider = () => <div className="w-px h-6 bg-border mx-1" />;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderCarouselMarkdown = (content: string) => {
  const slides: string[] = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match = imagePattern.exec(content);

  while (match) {
    const alt = escapeHtml(match[1] || `Image ${slides.length + 1}`);
    const url = escapeHtml(match[2]);
    const caption = match[1] ? `<figcaption>${escapeHtml(match[1])}</figcaption>` : "";
    slides.push(`<figure class="article-carousel-slide"><img src="${url}" alt="${alt}" loading="lazy" />${caption}</figure>`);
    match = imagePattern.exec(content);
  }

  if (slides.length === 0) return "";
  return `<div class="article-carousel" role="region" aria-label="Image carousel"><div class="article-carousel-track">${slides.join("")}</div></div>`;
};

function PublishSwitch({
  checked,
  onCheckedChange,
  publishedLabel = "Published",
  draftLabel = "Draft",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  publishedLabel?: string;
  draftLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-8 min-w-[116px] items-center gap-2 rounded-full border px-2.5 text-sm font-medium transition-colors ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
      <span className="leading-none">{checked ? publishedLabel : draftLabel}</span>
    </button>
  );
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  name_zh?: string;
  color?: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  name_zh?: string;
}

export interface ArticleData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover_image: string;
  category_slugs: string[];
  tag_slugs: string[];
  locale: string;
  is_published: boolean;
  published_at?: string;
}

const SUPPORTED_LOCALES = [
  { code: "zh", label: "中文", name: "简体中文" },
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "French" },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", slug: "announcements", name: "Announcements", name_zh: "公告", color: "#6366f1" },
  { id: "2", slug: "performances", name: "Performances", name_zh: "演出", color: "#ec4899" },
  { id: "3", slug: "classes", name: "Classes", name_zh: "课程", color: "#10b981" },
  { id: "4", slug: "studio", name: "Studio", name_zh: "工作室", color: "#f59e0b" },
  { id: "5", slug: "general", name: "General", name_zh: "综合", color: "#8b5cf6" },
];

const DEFAULT_TAGS: Tag[] = [
  { id: "1", slug: "summer-camp", name: "Summer Camp", name_zh: "暑期夏令营" },
  { id: "2", slug: "registration", name: "Registration", name_zh: "报名" },
  { id: "3", slug: "competition", name: "Competition", name_zh: "比赛" },
  { id: "4", slug: "performance", name: "Performance", name_zh: "演出" },
  { id: "5", slug: "schedule", name: "Schedule", name_zh: "课表" },
  { id: "6", slug: "announcement", name: "Announcement", name_zh: "公告" },
  { id: "7", slug: "chinese-dance", name: "Chinese Dance", name_zh: "中国舞" },
  { id: "8", slug: "classical-dance", name: "Classical Dance", name_zh: "古典舞" },
  { id: "9", slug: "folk-dance", name: "Folk Dance", name_zh: "民族民间舞" },
  { id: "10", slug: "ballet", name: "Ballet", name_zh: "芭蕾舞" },
  { id: "11", slug: "jazz", name: "Jazz", name_zh: "爵士舞" },
  { id: "12", slug: "hip-hop", name: "Hip-Hop", name_zh: "街舞" },
  { id: "13", slug: "contemporary", name: "Contemporary", name_zh: "现代舞" },
  { id: "14", slug: "children", name: "Children", name_zh: "少儿" },
  { id: "15", slug: "adult", name: "Adult", name_zh: "成人" },
  { id: "16", slug: "workshop", name: "Workshop", name_zh: "工作坊" },
  { id: "17", slug: "exam", name: "Exam", name_zh: "考级" },
  { id: "18", slug: "notice", name: "Notice", name_zh: "通知" },
  { id: "19", slug: "other", name: "Other", name_zh: "其他" },
];

// Markdown toolbar button config
const TOOLBAR_BUTTONS = [
  { icon: Bold, action: (v: string) => wrapText("**", "**", v), label: "Bold" },
  { icon: Italic, action: (v: string) => wrapText("*", "*", v), label: "Italic" },
  { icon: Underline, action: (v: string) => wrapText("<u>", "</u>", v), label: "Underline" },
  { icon: Heading1, action: (v: string) => insertAtLineStart("# ", v), label: "H1" },
  { icon: Heading2, action: (v: string) => insertAtLineStart("## ", v), label: "H2" },
  { icon: Heading3, action: (v: string) => insertAtLineStart("### ", v), label: "H3" },
  { icon: List, action: (v: string) => insertAtLineStart("- ", v), label: "Bullet List" },
  { icon: ListOrdered, action: (v: string) => insertAtLineStart("1. ", v), label: "Numbered List" },
  { icon: Code, action: (v: string) => wrapText("`", "`", v), label: "Inline Code" },
  { icon: Quote, action: (v: string) => insertAtLineStart("> ", v), label: "Quote" },
  { icon: LinkIcon, action: (v: string) => wrapText("[", "](url)", v), label: "Link" },
];

function wrapText(before: string, after: string, text: string): string {
  return before + text + after;
}

function insertAtLineStart(prefix: string, text: string): string {
  const lines = text.split("\n");
  lines[0] = prefix + lines[0];
  return lines.join("\n");
}

export function EditorContent({ editSlug }: { editSlug: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const requestedLocale = searchParams.get("locale") || "";
  const baseSlug = searchParams.get("baseSlug") || "";
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [loading, setLoading] = useState(!editSlug);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [articleGroup, setArticleGroup] = useState<NewsArticleGroup | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBatchSaving, setAiBatchSaving] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [aiImportItems, setAiImportItems] = useState<AiArticleImportItem[]>([]);
  const [pendingAiDrafts, setPendingAiDrafts] = useState<Record<string, AiDraft>>({});
  const [aiUrls, setAiUrls] = useState("");
  const [aiManualText, setAiManualText] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");

  const [form, setForm] = useState<ArticleData>({
    id: "",
    slug: "",
    title: "",
    summary: "",
    body: "",
    cover_image: "",
    category_slugs: [],
    tag_slugs: [],
    locale: "zh",
    is_published: false,
  });

  // Defensive: ensure body is always a string (never undefined)
  const bodyText = form.body ?? "";
  const isVersionedArticle = Boolean(articleGroup || baseSlug || editSlug);
  const sharedArticleSlug = articleGroup?.shared_slug || baseSlug || editSlug || form.slug;

  const draftStorageKey = (localeCode?: string) => {
    const scope = editSlug || baseSlug || "new";
    const language = localeCode || requestedLocale || form.locale || "zh";
    return `draft_${scope}_${language}`;
  };

  const loadTaxonomy = useCallback(async () => {
    try {
      const [categoryData, tagData] = await Promise.all([
        newsApi.categories(),
        newsApi.tags(),
      ]);
      if (categoryData.length > 0) setCategories(categoryData as Category[]);
      if (tagData.length > 0) setTags(tagData as Tag[]);
    } catch (err) {
      console.warn("[Editor] Failed to load categories/tags, using defaults:", err);
    }
  }, []);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInsertImage(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  // Update markdown preview
  useEffect(() => {
    if (showPreview && form.body) {
      // Simple markdown to HTML conversion
      let html = form.body
        // Image carousel
        .replace(/:::\s*carousel\s*\n([\s\S]*?)\n:::/g, (_match, content: string) => renderCarouselMarkdown(content))
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links and Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="rounded-lg max-w-full">')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
        // Code
        .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted pl-4 italic">$1</blockquote>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-4">')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        // Underline
        .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
        // Paragraphs
        .replace(/\n\n([^<\n][^\n]*)/g, '\n<p>$1</p>')
        .replace(/^\n([^<\n][^\n]*)/g, '<p>$1</p>');
      
      setPreviewHtml(html);
    }
  }, [form.body, showPreview]);

  // Auto-load on mount
  useEffect(() => {
    loadTaxonomy();

    if (!editSlug && !isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    if (editSlug) {
      loadArticle();
    } else {
      if (baseSlug || requestedLocale) {
        setForm((prev) => ({
          ...prev,
          slug: baseSlug || prev.slug,
          locale: requestedLocale || prev.locale,
        }));
        loadDraft(requestedLocale || "zh");
        if (baseSlug) loadArticleGroup(baseSlug);
      } else {
        loadDraft("zh");
      }
      setLoading(false);
    }

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (form.title || form.body) {
        autoSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [editSlug, router, locale, baseSlug, requestedLocale, loadTaxonomy]);

  const loadArticleGroup = async (sharedSlug: string) => {
    try {
      const groups = await newsApi.adminGroups({ search: sharedSlug, limit: 20 });
      const found = groups.find((group) => group.shared_slug === sharedSlug);
      setArticleGroup(found || null);
    } catch {
      setArticleGroup(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInsertFile(file);
    }
    e.target.value = "";
  };

  const loadArticle = async () => {
    if (!editSlug) return;
    try {
      console.log("[Editor] Loading article with slug:", editSlug);
      const data = await newsApi.get(editSlug, requestedLocale || undefined);
      console.log("[Editor] Raw API response:", JSON.stringify(data, null, 2));
      
      if (data) {
        const article = data as any;
        // Defensive: normalize all fields, ensure body and cover_image are strings
        const bodyVal = (article as any).content ?? article.body ?? "";
        const coverVal = article.cover_image ?? article.coverImage ?? "";
        const cats = article.categories ?? [];
        const tags = article.tags ?? [];
        
        console.log("[Editor] Normalized values:", {
          body: typeof bodyVal,
          bodyLength: bodyVal?.length ?? 0,
          cover_image: typeof coverVal,
          categories: cats.length,
          tags: tags.length,
          category_slugs: cats.map((c: any) => c.slug),
          tag_slugs: tags.map((t: any) => t.slug),
        });
        
        // Guard: reject base64 data URLs for cover_image
        if (typeof coverVal === "string" && coverVal.startsWith("data:image/")) {
          console.warn("Cover image is a base64 data URL, ignoring it. Please upload images via the editor instead.");
        }
        
        setForm({
          id: article.id ?? "",
          slug: article.slug ?? "",
          title: article.title ?? "",
          summary: article.summary ?? "",
          body: typeof bodyVal === "string" ? bodyVal : "",
          cover_image: typeof coverVal === "string" && !coverVal.startsWith("data:image/") ? coverVal : "",
          category_slugs: Array.isArray(cats) ? cats.map((c: any) => c.slug) : [],
          tag_slugs: Array.isArray(tags) ? tags.map((t: any) => t.slug) : [],
          locale: article.locale ?? "en",
          is_published: article.is_published ?? false,
          published_at: article.published_at,
        });
        await loadArticleGroup(article.slug ?? editSlug);
        
        console.log("[Editor] Form state after setForm:", {
          bodyLength: (form as any)?.body?.length ?? 0,
        });
      }
    } catch (err) {
      console.error("[Editor] Failed to load article:", err);
    }
    setLoading(false);
  };

  const loadDraft = (localeCode?: string) => {
    try {
      const saved = localStorage.getItem(draftStorageKey(localeCode));
      if (saved) {
        const draft: ArticleData = JSON.parse(saved);
        // Defensive: normalize draft fields
        const bodyVal = draft.body ?? "";
        const coverVal = draft.cover_image ?? "";
        setForm({
          id: draft.id ?? "",
          slug: draft.slug ?? "",
          title: draft.title ?? "",
          summary: draft.summary ?? "",
          body: typeof bodyVal === "string" ? bodyVal : "",
          cover_image: typeof coverVal === "string" && !coverVal.startsWith("data:image/") ? coverVal : "",
          category_slugs: draft.category_slugs || [],
          tag_slugs: draft.tag_slugs || [],
          locale: draft.locale ?? localeCode ?? "zh",
          is_published: draft.is_published ?? false,
          published_at: draft.published_at,
        });
      }
    } catch {}
  };

  const handleInsertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadApi.image(file);
      const markdown = `![${file.name}](${result.url})`;
      
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newBody = bodyText.substring(0, start) + markdown + bodyText.substring(start);
        setForm((f) => ({ ...f, body: newBody }));
      } else {
        setForm((f) => ({ ...f, body: bodyText + "\n" + markdown }));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const autoSave = () => {
    try {
      localStorage.setItem(
        draftStorageKey(form.locale),
        JSON.stringify(form)
      );
      setLastSaved(new Date().toLocaleTimeString());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {}
  };

  const handleSave = async (published: boolean = false) => {
    setSaving(true);
    setSaveStatus("saving");
    
    // Defensive: ensure form fields are never undefined
    const titleText = form.title ?? "";
    const summaryText = form.summary ?? "";
    const slugText = form.slug ?? "";
    
    // Guard: reject base64 data URLs for cover_image
    const coverImageText = form.cover_image ?? "";
    if (typeof coverImageText === "string" && coverImageText.startsWith("data:image/")) {
      setSaveStatus("error");
      alert("Cover image cannot be a base64 data URL. Please upload images via the editor instead.");
      setSaving(false);
      return;
    }
    
    // Validate required fields
    if (!titleText.trim()) {
      setSaveStatus("error");
      alert("Please enter a title for the article.");
      setSaving(false);
      return;
    }
    
    try {
      // Ensure slug is always present (required by backend)
      let slugValue = (articleGroup?.shared_slug || baseSlug || (editSlug ? editSlug : slugText))?.trim();
      if (!slugValue) {
        // Generate slug from title if empty
        slugValue = titleText
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const hasLatin = /[a-z0-9]/.test(slugValue);
        if (!hasLatin) {
          slugValue = "article-" + Date.now().toString(36);
        }
      }
      // Sync slug back to form if it was auto-generated (helps user see it)
      if (!slugText && slugValue) {
        setForm((f) => ({ ...f, slug: slugValue }));
      }
      
      const data = {
        title: titleText,
        slug: slugValue,
        summary: summaryText || undefined,
        body: bodyText,
        cover_image: coverImageText || undefined,
        category_slugs: form.category_slugs,
        tag_slugs: form.tag_slugs,
        locale: form.locale || "zh",
        is_published: published || form.is_published,
        published_at: form.published_at || undefined,
      };

      console.log("[Save] URL endpoint:", editSlug ? `/v1/news/${editSlug}` : `/v1/news`);
      console.log("[Save] Method:", editSlug ? "PUT" : "POST");
      console.log("[Save] Payload:", JSON.stringify(data, null, 2));

      let result;
      if (editSlug) {
        result = await newsApi.updateArticle(sharedArticleSlug || editSlug, data);
      } else {
        result = await newsApi.createArticle(data);
      }

      const siblingDrafts = Object.values(pendingAiDrafts).filter((draft) => draft.locale !== data.locale);
      for (const draft of siblingDrafts) {
        const draftTitle = draft.fields.title || titleText;
        await newsApi.createArticle({
          ...data,
          title: draftTitle,
          summary: draft.fields.summary || summaryText || undefined,
          body: draft.fields.body || bodyText,
          slug: slugValue,
          locale: draft.locale,
        });
      }

      if (published) {
        await newsApi.togglePublish(slugValue, true);
      }

      console.log("[Save] Success:", result);

      setSaveStatus("saved");
      setPendingAiDrafts({});
      setLastSaved(new Date().toLocaleTimeString());
      
      // If new article created, navigate to it
      if (!editSlug && result && typeof result === "object" && "slug" in result) {
        const newSlug = (result as { slug: string }).slug;
        setTimeout(() => {
          router.push(`/${locale}/admin/editor/${newSlug}?locale=${data.locale}`);
        }, 1000);
      } else {
        await loadArticleGroup(slugValue);
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (err: unknown) {
      setSaveStatus("error");
      
      // Better error handling: show actual error without backend URL message
      let errorMsg = "Save failed";
      if (err instanceof Error) {
        const msg = err.message;
        // If it's a network error, show the full message
        if (msg.includes("Network error")) {
          errorMsg = msg;
        } else {
          // It's an HTTP error (400/401/422/500) - show the detail
          errorMsg = msg;
        }
      }
      
      console.error("[Save] Error:", err);
      alert(`Save failed: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToolbarAction = (action: (v: string) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback: just update the form
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = bodyText.substring(start, end);
    const newText = action(selected || "text");
    
    const newBody = 
      bodyText.substring(0, start) + 
      newText + 
      bodyText.substring(end);
    
    setForm((f) => ({ ...f, body: newBody }));
    
    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start, start + selected.length);
      } else {
        textarea.setSelectionRange(
          start + newText.length,
          start + newText.length
        );
      }
    }, 0);
  };

  const toggleCategory = (slug: string) => {
    setForm((f) => ({
      ...f,
      category_slugs: f.category_slugs.includes(slug)
        ? f.category_slugs.filter((s) => s !== slug)
        : [...f.category_slugs, slug],
    }));
  };

  const toggleTag = (slug: string) => {
    setForm((f) => ({
      ...f,
      tag_slugs: f.tag_slugs.includes(slug)
        ? f.tag_slugs.filter((s) => s !== slug)
        : [...f.tag_slugs, slug],
    }));
  };

  const wordCount = bodyText.replace(/\s/g, "").length;
  const charCount = bodyText.length;

  const handleDelete = async () => {
    if (!editSlug || !(typeof window !== "undefined" && confirm("Are you sure you want to delete this article?"))) return;
    try {
      if (!editSlug) return;
      await newsApi.removeArticle(editSlug);
      router.push(`/${locale}/admin/articles`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleInsertFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const result = await uploadApi.file(file);
      const markdown = `[${file.name}](${result.url})`;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newBody = bodyText.substring(0, start) + markdown + bodyText.substring(start);
        setForm((f) => ({ ...f, body: newBody }));
      } else {
        setForm((f) => ({ ...f, body: bodyText + "\n" + markdown }));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const slugifyTitle = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return /[a-z0-9]/.test(slug) ? slug : `article-${Date.now().toString(36)}`;
  };

  const importedMediaUrls = (item?: AiArticleImportItem) =>
    (item?.source.media || [])
      .map((media) => media.url)
      .filter((url): url is string => Boolean(url));

  const formatSourceDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(dateLocaleFor(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const bodyWithImportedImages = (body: string, item: AiArticleImportItem | undefined, title: string) => {
    const urls = importedMediaUrls(item);
    if (urls.length === 0) return body;

    const missingUrls = urls.filter((url) => !body.includes(url));
    if (missingUrls.length === 0) return body;

    const altText = title || item?.source.title || "Imported image";
    const imageMarkdown =
      missingUrls.length > 1
        ? [":::carousel", ...missingUrls.map((url, index) => `![${altText} ${index + 1}](${url})`), ":::"].join("\n")
        : `![${altText}](${missingUrls[0]})`;

    return body.trim() ? `${body.trim()}\n\n${imageMarkdown}` : imageMarkdown;
  };

  const itemTitleFallback = (item?: AiArticleImportItem) => item?.source.title || "Imported image";

  const draftForLocale = (drafts: AiDraft[], localeCode: string) =>
    drafts.find((draft) => draft.locale === localeCode);

  const applyAiDrafts = (drafts: AiDraft[], importItem?: AiArticleImportItem) => {
    const usableDrafts = drafts.filter((draft) =>
      SUPPORTED_LOCALES.some((item) => item.code === draft.locale)
    );
    if (usableDrafts.length === 0) {
      setAiMessage("AI did not return usable language drafts.");
      return;
    }

    const activeDraft =
      draftForLocale(usableDrafts, form.locale || "zh") ||
      draftForLocale(usableDrafts, "zh") ||
      usableDrafts[0];
    const title = activeDraft.fields.title ?? form.title;
    const importedCover = importedMediaUrls(importItem)[0];
    const sourcePublishedAt = importItem?.source.source_published_at;
    const nextPending = usableDrafts.reduce<Record<string, AiDraft>>((acc, draft) => {
      const draftTitle = draft.fields.title || title || itemTitleFallback(importItem);
      acc[draft.locale] = {
        ...draft,
        fields: {
          ...draft.fields,
          body: bodyWithImportedImages(draft.fields.body ?? "", importItem, draftTitle),
        },
      };
      return acc;
    }, {});

    setPendingAiDrafts(nextPending);
    setForm((prev) => ({
      ...prev,
      locale: activeDraft.locale,
      title,
      summary: activeDraft.fields.summary ?? prev.summary,
      body: nextPending[activeDraft.locale]?.fields.body || activeDraft.fields.body || prev.body,
      cover_image: importedCover || prev.cover_image,
      published_at: sourcePublishedAt || prev.published_at,
      category_slugs: importItem?.suggested_category_slugs?.length ? importItem.suggested_category_slugs : prev.category_slugs,
      tag_slugs: importItem?.suggested_tag_slugs?.length ? importItem.suggested_tag_slugs : prev.tag_slugs,
      slug: prev.slug || slugifyTitle(title),
    }));
      setAiMessage(`已应用 ${usableDrafts.map((draft) => draft.locale.toUpperCase()).join(", ")} 草稿。点击保存会先保存当前语言，并同步创建/更新其它语言版本。`);
  };

  const applyAiDraft = (draft: AiDraft, importItem?: AiArticleImportItem) => {
    const title = draft.fields.title ?? form.title;
    const importedCover = importedMediaUrls(importItem)[0];
    const sourcePublishedAt = importItem?.source.source_published_at;
    setForm((prev) => ({
      ...prev,
      locale: draft.locale,
      title,
      summary: draft.fields.summary ?? prev.summary,
      body: bodyWithImportedImages(draft.fields.body ?? prev.body, importItem, title),
      cover_image: importedCover || prev.cover_image,
      published_at: sourcePublishedAt || prev.published_at,
      category_slugs: importItem?.suggested_category_slugs?.length ? importItem.suggested_category_slugs : prev.category_slugs,
      tag_slugs: importItem?.suggested_tag_slugs?.length ? importItem.suggested_tag_slugs : prev.tag_slugs,
      slug: prev.slug || slugifyTitle(title),
    }));
    setAiMessage(`已应用 ${draft.locale.toUpperCase()} 草稿，检查后点击保存该语言版本。`);
  };

  const firstDraftTitle = (item: AiArticleImportItem, index: number) =>
    draftForLocale(item.drafts, "zh")?.fields.title ||
    item.drafts[0]?.fields.title ||
    item.source.title ||
    `imported-${index + 1}`;

  const uniqueBatchSlug = (item: AiArticleImportItem, index: number) => {
    const title = firstDraftTitle(item, index);
    const base = slugifyTitle(title);
    const sourceDate = item.source.source_published_at ? new Date(item.source.source_published_at) : null;
    const suffix = sourceDate && !Number.isNaN(sourceDate.getTime())
      ? sourceDate.toISOString().slice(0, 10)
      : Date.now().toString(36);
    return `${base}-${suffix}-${index + 1}`.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  };

  const saveImportedNewsItem = async (item: AiArticleImportItem, index: number) => {
    const slug = uniqueBatchSlug(item, index);
    const cover = importedMediaUrls(item)[0] || form.cover_image || undefined;
    const categorySlugs = item.suggested_category_slugs?.length ? item.suggested_category_slugs : form.category_slugs;
    const tagSlugs = item.suggested_tag_slugs?.length ? item.suggested_tag_slugs : form.tag_slugs;
    const publishedAt = item.source.source_published_at || form.published_at || undefined;

    for (const draft of item.drafts) {
      const title = draft.fields.title || firstDraftTitle(item, index);
      await newsApi.createArticle({
        title,
        slug,
        summary: draft.fields.summary || undefined,
        body: bodyWithImportedImages(draft.fields.body || "", item, title),
        cover_image: cover,
        category_slugs: categorySlugs,
        tag_slugs: tagSlugs,
        locale: draft.locale,
        is_published: false,
        published_at: publishedAt,
      });
    }
  };

  const saveImportedPerformanceItem = async (item: AiArticleImportItem, index: number) => {
    const zhDraft = draftForLocale(item.drafts, "zh") || item.drafts[0];
    const startDate = zhDraft?.fields.start_date || item.drafts.find((draft) => draft.fields.start_date)?.fields.start_date;
    if (!zhDraft || !startDate) {
      throw new Error(`${firstDraftTitle(item, index)}: AI classified as performance but did not provide a start date.`);
    }

    const endDate = zhDraft.fields.end_date || item.drafts.find((draft) => draft.fields.end_date)?.fields.end_date || startDate;
    const translations: PerformanceBody["translations"] = {};
    for (const draft of item.drafts) {
      if (draft.locale === "zh") continue;
      translations[draft.locale as "en" | "fr"] = {
        ...(draft.fields.title ? { title: draft.fields.title } : {}),
        ...(draft.fields.description ? { description: draft.fields.description } : {}),
        ...(draft.fields.venue ? { venue: draft.fields.venue } : {}),
      };
    }

    await performanceApi.create({
      slug: uniqueBatchSlug(item, index),
      title: zhDraft.fields.title || firstDraftTitle(item, index),
      description: zhDraft.fields.description || zhDraft.fields.summary || "",
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      venue: zhDraft.fields.venue || "",
      cover_image: importedMediaUrls(item)[0] || form.cover_image || undefined,
      is_current: true,
      translations,
    });
  };

  const handleBatchSaveAiImports = async () => {
    if (aiImportItems.length === 0) return;
    setAiBatchSaving(true);
    setAiMessage("");
    let newsCount = 0;
    let performanceCount = 0;
    const failures: string[] = [];

    for (let index = 0; index < aiImportItems.length; index += 1) {
      const item = aiImportItems[index];
      try {
        if ((item.content_type || "news") === "performance") {
          await saveImportedPerformanceItem(item, index);
          performanceCount += 1;
        } else {
          await saveImportedNewsItem(item, index);
          newsCount += 1;
        }
      } catch (err) {
        failures.push(err instanceof Error ? err.message : `${firstDraftTitle(item, index)}: save failed`);
      }
    }

    setAiMessage(
    `批量保存完成：文章 ${newsCount} 条，演出 ${performanceCount} 条。${failures.length ? `失败 ${failures.length} 条：${failures.join("；")}` : ""}`
    );
    setAiBatchSaving(false);
  };

  const handleAiTranslate = async () => {
    const fields = {
      title: form.title,
      summary: form.summary,
      body: bodyText,
    };
    if (!fields.title.trim() && !fields.body.trim()) {
      alert("请先填写标题或正文，再生成翻译。");
      return;
    }
    const targets = SUPPORTED_LOCALES
      .map((item) => item.code)
      .filter((code) => code !== form.locale);
    setAiLoading(true);
    setAiMessage("");
    setAiImportItems([]);
    try {
      const result = await aiApi.translate({
        module: "articles",
        source_locale: form.locale || "zh",
        target_locales: targets,
        fields,
      });
      const sourceDraft: AiDraft = {
        locale: form.locale || "zh",
        fields,
        warnings: [],
      };
      setAiDrafts([sourceDraft, ...(result.drafts || [])]);
      setAiMessage(result.warnings?.length ? result.warnings.join("；") : "翻译草稿已生成。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI translation failed";
      setAiMessage(message);
      alert(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImportUrls = async () => {
    const urls = aiUrls
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (urls.length === 0 && !aiManualText.trim()) {
      alert("请至少输入一个链接，或粘贴原始文字。");
      return;
    }
    setAiLoading(true);
    setAiMessage("");
    try {
      const result = await aiApi.importArticleUrls({
        urls,
        source_locale: "zh",
        target_locales: ["zh", "en", "fr"],
        manual_text: aiManualText || undefined,
        extra_instruction: aiInstruction || undefined,
        category_slugs: form.category_slugs,
        tag_slugs: form.tag_slugs,
        available_category_slugs: categories.map((category) => category.slug),
        available_tag_slugs: tags.map((tag) => tag.slug),
      });
      setAiImportItems(result.items || []);
      setAiDrafts(result.items?.[0]?.drafts || []);
      setAiMessage(result.warnings?.length ? result.warnings.join("；") : "链接草稿已生成。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI import failed";
      setAiMessage(message);
      alert(message);
    } finally {
      setAiLoading(false);
    }
  };

  const currentVersions = articleGroup?.translations || [];
  const missingVersions = SUPPORTED_LOCALES.filter(
    (item) => !currentVersions.some((translation) => translation.locale === item.code)
  );

  const goToVersion = (localeCode: string) => {
    const sharedSlug = sharedArticleSlug;
    if (!sharedSlug) return;
    const existing = currentVersions.find((item) => item.locale === localeCode);
    if (existing) {
      router.push(`/${locale}/admin/editor/${sharedSlug}?locale=${localeCode}`);
    } else {
      router.push(`/${locale}/admin/editor?baseSlug=${sharedSlug}&locale=${localeCode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton fallbackRoute={`/${locale}/admin/articles`} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editSlug
                  ? t("admin.editor.editArticle")
                  : t("admin.editor.newArticle")}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground animate-pulse">
                {t("admin.editor.autoSaving")}
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Error
              </span>
            )}
            {lastSaved && saveStatus === "idle" && (
              <span className="text-xs text-muted-foreground hidden md:block">
                {t("admin.editor.lastSaved")}: {lastSaved}
              </span>
            )}
            
            <VDivider />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t("admin.editor.saveDraft")}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t("admin.editor.publish")}</span>
            </Button>
            {editSlug && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Enter article title..."
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title }));
              if (!editSlug && !baseSlug) {
                // Generate slug: try to use pinyin/English, fallback to timestamp
                let slug = (title ?? "")
                  .toLowerCase()
                  .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                // If slug is empty or only has CJK chars, strip them and use timestamp fallback
                const hasLatin = /[a-z0-9]/.test(slug);
                if (!hasLatin) {
                  slug = "article-" + Date.now().toString(36);
                }
                setForm((f) => ({ ...f, slug }));
              }
            }}
            className="text-2xl font-bold border-b-2 border-border focus:border-primary py-2 px-0 h-auto outline-none"
            style={{ background: 'transparent' }}
          />
        </div>

        {/* Meta Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/</span>
            <input
              type="text"
              placeholder="slug"
              value={baseSlug || form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
              disabled={Boolean(baseSlug)}
              className="h-8 w-48 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          
          {!isVersionedArticle && (
            <div className="inline-flex h-8 rounded-md border border-slate-200 bg-white p-0.5">
              {SUPPORTED_LOCALES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, locale: item.code }))}
                  className={`rounded px-3 text-sm font-medium transition-colors ${
                    form.locale === item.code
                      ? "bg-purple-700 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          
          <PublishSwitch
            checked={form.is_published}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, is_published: checked }))}
            publishedLabel={t("admin.editor.published")}
            draftLabel={t("admin.editor.draft")}
          />
        </div>

        {(articleGroup || baseSlug || editSlug) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">语言版本</p>
                <p className="text-xs text-slate-500">
                  {missingVersions.length > 0
                    ? `下一步：用 AI 翻译或手动创建 ${missingVersions.map((item) => item.label).join(", ")} 版本`
                    : "中文、英文、法文版本已创建"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LOCALES.map((item) => {
                  const existing = currentVersions.find((version) => version.locale === item.code);
                  const active = form.locale === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => goToVersion(item.code)}
                      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                        active
                          ? "border-purple-700 bg-purple-700 text-white"
                          : existing
                            ? "border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50"
                            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {item.label}
                      <span className="ml-2 text-[10px] opacity-80">
                        {existing ? (existing.is_published ? "已发布" : "草稿") : "Missing"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Card className="border-purple-100 bg-white/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-purple-700" />
                  AI 草稿助手
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  先创建当前语言文章；然后用 AI 翻译或手动切换语言补齐另外两个版本。AI 只生成草稿，不会自动发布。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {aiDrafts.length > 0 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => applyAiDrafts(aiDrafts, aiImportItems[0])}
                    className="shrink-0"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    同步三语草稿
                  </Button>
                )}
                {aiImportItems.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBatchSaveAiImports}
                    disabled={aiBatchSaving}
                    className="shrink-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {aiBatchSaving ? "保存中..." : "批量保存全部"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiTranslate}
                  disabled={aiLoading}
                  className="shrink-0"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {aiLoading ? "生成中..." : "翻译当前文章"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Textarea
                value={aiUrls}
                onChange={(event) => setAiUrls(event.target.value)}
                placeholder="粘贴链接，一行一个。例：小红书帖子链接"
                className="min-h-[96px]"
              />
              <Textarea
                value={aiManualText}
                onChange={(event) => setAiManualText(event.target.value)}
                placeholder="如果链接无法读取，可把帖子文字粘贴到这里"
                className="min-h-[96px]"
              />
              <div className="flex flex-col gap-2">
                <input
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder="额外要求"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="button" onClick={handleAiImportUrls} disabled={aiLoading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成并分类
                </Button>
              </div>
            </div>

            {aiMessage && (
              <div className="rounded-md border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-900">
                {aiMessage}
              </div>
            )}

            {aiDrafts.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <div>
                    <div className="text-sm font-medium text-slate-800">AI 生成草稿预览</div>
                    <p className="text-xs text-slate-500">确认三种语言内容后，点击右上角“同步三语草稿”，再用普通保存按钮保存。</p>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {aiDrafts.map((draft) => {
                    return (
                      <div key={`${draft.locale}-${draft.fields.title || "draft"}`} className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="text-sm font-semibold">{draft.locale.toUpperCase()}</span>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">{draft.fields.title || "未生成标题"}</p>
                        {draft.fields.summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{draft.fields.summary}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {aiImportItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-800">导入来源</div>
                <div className="grid gap-2 md:grid-cols-2">
                  {aiImportItems.slice(0, 4).map((item) => (
                    <div key={item.source.url} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          (item.content_type || "news") === "performance"
                            ? "bg-pink-100 text-pink-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(item.content_type || "news") === "performance" ? "演出" : "文章"}
                        </span>
                        <div className="truncate font-medium">{item.source.title || item.source.url}</div>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.source.url}</div>
                      {((item.suggested_category_slugs?.length || 0) > 0 || (item.suggested_tag_slugs?.length || 0) > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-600">
                          {(item.suggested_category_slugs || []).map((slug) => (
                            <span key={`cat-${slug}`} className="rounded-full bg-white px-2 py-0.5">分类: {slug}</span>
                          ))}
                          {(item.suggested_tag_slugs || []).map((slug) => (
                            <span key={`tag-${slug}`} className="rounded-full bg-white px-2 py-0.5">标签: {slug}</span>
                          ))}
                        </div>
                      )}
                      {item.source.source_published_at && (
                        <div className="mt-1 text-xs font-medium text-slate-600">
                          Source date: {formatSourceDate(item.source.source_published_at)}
                        </div>
                      )}
                      {(item.source.media?.length || 0) > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {(item.source.media || []).slice(0, 4).map((media) => (
                            <img
                              key={media.url}
                              src={media.url}
                              alt={item.source.title || "Imported image"}
                              className="aspect-square w-full rounded-md border border-white object-cover shadow-sm"
                            />
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-600">
                        已下载图片：{item.source.media?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Cover Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder={t("admin.editor.summary")}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            type="text"
            placeholder={t("admin.editor.coverImage")}
            value={form.cover_image}
            onChange={(e) =>
              setForm((f) => ({ ...f, cover_image: e.target.value }))
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.editor.categories")}</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat.slug}
                variant={
                  form.category_slugs.includes(cat.slug) ? "default" : "outline"
                }
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleCategory(cat.slug)}
                style={
                  form.category_slugs.includes(cat.slug)
                    ? { backgroundColor: cat.color || "#6366f1" }
                    : undefined
                }
              >
                {cat.name_zh ? `${cat.name} (${cat.name_zh})` : cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.editor.tags")}</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.slug}
                variant={
                  form.tag_slugs.includes(tag.slug) ? "secondary" : "outline"
                }
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleTag(tag.slug)}
              >
                {tag.name_zh ? `${tag.name} (${tag.name_zh})` : tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <Card className="flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 border-b p-1.5 bg-muted/20 flex-wrap">
            {TOOLBAR_BUTTONS.map(({ icon: Icon, action, label }, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={() => handleToolbarAction(action)}
                className="h-7 w-7 p-0"
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
            <VDivider />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              className="h-7 w-7 p-0"
              title={uploadingImage ? "Uploading..." : "Insert Image"}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
            </Button>
            {/* Hidden file input for image upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 w-7 p-0"
              title={uploadingFile ? "Uploading..." : "Insert File"}
              disabled={uploadingFile}
            >
              {uploadingFile ? (
                <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              className="hidden"
              onChange={handleFileSelect}
            />
            <VDivider />
            <Button
              variant={showPreview ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPreview((p) => !p)}
              className="h-7 px-2.5"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {showPreview ? t("admin.editor.source") : t("admin.editor.preview")}
            </Button>
          </div>

          {/* Content Area */}
          {showPreview ? (
            <div 
              className="min-h-[280px] p-4 prose max-w-none prose-sm prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg md:min-h-[400px] md:p-6"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full min-h-[280px] p-4 resize-y font-mono text-sm border-none bg-transparent focus-visible:ring-0 leading-relaxed md:min-h-[400px]"
              placeholder={t("admin.editor.body")}
            />
          )}
          
          {/* Status Bar */}
          <div className="border-t p-2 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-3">
              <span>{wordCount} {t("admin.editor.wordCount")}</span>
              <span>{charCount} {t("admin.editor.charCount")}</span>
            </span>
            <span>Markdown supported</span>
          </div>
        </Card>
      </main>
    </div>
  );
}
