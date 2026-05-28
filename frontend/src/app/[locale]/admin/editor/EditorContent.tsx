'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "@/components/ui/i18n-client";
import { isAuthenticated, newsApi, uploadApi, NewsArticleGroup } from "@/lib/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image,
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
} from "lucide-react";

// Simple vertical divider component (replaces Separator)
const VDivider = () => <div className="w-px h-6 bg-border mx-1" />;

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
  { code: "en", label: "EN", name: "English" },
  { code: "zh", label: "简体", name: "简体中文" },
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

  const [form, setForm] = useState<ArticleData>({
    id: "",
    slug: "",
    title: "",
    summary: "",
    body: "",
    cover_image: "",
    category_slugs: [],
    tag_slugs: [],
    locale: "en",
    is_published: false,
  });

  // Defensive: ensure body is always a string (never undefined)
  const bodyText = form.body ?? "";
  const isVersionedArticle = Boolean(articleGroup || baseSlug || editSlug);
  const sharedArticleSlug = articleGroup?.shared_slug || baseSlug || editSlug || form.slug;

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
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links and Images
        .replace(/!\[(.+?)\]\((.+?)\)/g, '<img alt="$1" src="$2" class="rounded-lg max-w-full">')
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
      loadDraft();
      if (baseSlug || requestedLocale) {
        setForm((prev) => ({
          ...prev,
          slug: baseSlug || prev.slug,
          locale: requestedLocale || prev.locale,
        }));
        if (baseSlug) loadArticleGroup(baseSlug);
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

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(`draft_${editSlug || "new"}`);
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
          locale: draft.locale ?? "en",
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
        `draft_${editSlug || "new"}`,
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
        locale: form.locale || "en",
        is_published: published || form.is_published,
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

      console.log("[Save] Success:", result);

      setSaveStatus("saved");
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
                    ? `Missing ${missingVersions.map((item) => item.label).join(", ")} version`
                    : "所有主要语言版本已创建"}
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
                <Image className="h-3.5 w-3.5" />
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
              className="min-h-[400px] p-6 prose max-w-none prose-sm prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full min-h-[400px] p-4 resize-y font-mono text-sm border-none bg-transparent focus-visible:ring-0 leading-relaxed"
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
