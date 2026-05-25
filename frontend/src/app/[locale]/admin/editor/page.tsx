"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "@/components/ui/i18n-client";
import { clearAuthToken, isAuthenticated, newsApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  Separator as SeparatorIcon,
  Quote,
  Save,
  Eye,
  ArrowLeft,
  LogOut,
  Circle,
  CircleCheck,
} from "lucide-react";

interface Category {
  slug: string;
  name: string;
  name_zh?: string;
  color?: string;
}

interface ArticleData {
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

export default function EditorPage() {
  return <EditorContent editSlug={null} />;
}

export function ArticleEditorPage({ slug }: { slug: string }) {
  return <EditorContent editSlug={slug} />;
}

function EditorContent({ editSlug }: { editSlug: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(!editSlug);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

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

  const insertMarkdown = useCallback(
    (before: string, after: string = "") => {
      const textarea = editorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      const replacement = before + (selected || "text") + after;
      const newValue =
        textarea.value.substring(0, start) +
        replacement +
        textarea.value.substring(end);
      setForm((f) => ({ ...f, body: newValue }));
      setTimeout(() => {
        textarea.focus();
        if (selected) {
          textarea.setSelectionRange(start, start + selected.length);
        } else {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + 4
          );
        }
      }, 0);
    },
    [setForm]
  );

  useEffect(() => {
    if (!editSlug && !isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    const loadCategories = async () => {
      try {
        const data = await newsApi.categories();
        setCategories(data as Category[]);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();

    if (editSlug) {
      loadArticle();
    } else {
      loadDraft();
      setLoading(false);
    }

    autoSave();
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [editSlug, router, locale]);

  const loadArticle = async () => {
    try {
      const data = await newsApi.get(editSlug);
      if (data) {
        const article = data as ArticleData;
        setForm({
          ...article,
          category_slugs:
            article.categories?.map((c: Category) => c.slug) || [],
          tag_slugs: article.tags?.map((t: { slug: string }) => t.slug) || [],
        });
        setTagsInput(
          (article.tags as Array<{ slug: string }>)
            .map((t) => t.slug)
            .join(", ")
        );
      }
    } catch {}
    setLoading(false);
  };

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(`draft_${editSlug || "new"}`);
      if (saved) {
        const draft = JSON.parse(saved);
        setForm(draft);
        setTagsInput(
          (draft.tag_slugs || []).join(", ")
        );
      }
    } catch {}
  };

  const autoSave = () => {
    try {
      localStorage.setItem(
        `draft_${editSlug || "new"}`,
        JSON.stringify(form)
      );
      setLastSaved(new Date().toLocaleTimeString());
    } catch {}
  };

  const handleSave = async (published: boolean = false) => {
    setSaving(true);
    try {
      const body = form.body || editorRef.current?.value || "";
      const data = {
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        body,
        cover_image: form.cover_image,
        category_slugs: form.category_slugs,
        tag_slugs: form.tag_slugs,
        locale: form.locale,
        is_published: published,
      };

      if (editSlug) {
        await newsApi.update(editSlug, data);
      } else {
        await newsApi.create(data);
      }

      setSaving(false);
    } catch (err: unknown) {
      setSaving(false);
      alert(err instanceof Error ? err.message : "Save failed");
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      !form.category_slugs.includes(c.slug) &&
      (c.name.toLowerCase().includes(form.title.toLowerCase()) ||
        (c.name_zh || "").includes(form.title))
  );

  const toggleCategory = (slug: string) => {
    setForm((f) => ({
      ...f,
      category_slugs: f.category_slugs.includes(slug)
        ? f.category_slugs.filter((s) => s !== slug)
        : [...f.category_slugs, slug],
    }));
  };

  const wordCount = form.body.replace(/\s/g, "").length;
  const charCount = form.body.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/admin/articles`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-semibold">
              {editSlug
                ? t("admin.editor.editArticle")
                : t("admin.editor.newArticle")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && <span className="text-xs text-muted-foreground">
              {t("admin.editor.lastSaved")}: {lastSaved}
            </span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="h-3 w-3 mr-1" />
              {t("admin.editor.saveDraft")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              <CircleCheck className="h-3 w-3 mr-1" />
              {t("admin.editor.publish")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearAuthToken();
                router.push(`/${locale}/admin/login`);
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Title */}
        <Input
          placeholder={t("admin.editor.articleTitle")}
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => ({ ...f, title }));
            if (!editSlug) {
              setForm((f) => ({
                ...f,
                slug: title
                  .toLowerCase()
                  .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              }));
            }
          }}
          className="text-xl font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0"
        />

        {/* Slug & Meta Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="slug"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
            />
          </div>
          <select
            value={form.locale}
            onChange={(e) =>
              setForm((f) => ({ ...f, locale: e.target.value }))
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            {t("admin.editor.published")}
          </label>
        </div>

        {/* Summary */}
        <Input
          placeholder={t("admin.editor.summary")}
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />

        {/* Cover Image URL */}
        <Input
          placeholder={t("admin.editor.coverImage")}
          value={form.cover_image}
          onChange={(e) =>
            setForm((f) => ({ ...f, cover_image: e.target.value }))
          }
        />

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
                className="cursor-pointer"
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

        {/* Tags Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.editor.tags")}</label>
          <Input
            placeholder={t("admin.editor.tags")}
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              const tags = e.target.value
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);
              setForm((f) => ({ ...f, tag_slugs: tags }));
            }}
          />
        </div>

        {/* Toolbar & Editor */}
        <Card>
          <div className="flex items-center gap-1 border-b p-1 bg-muted/30">
            {[
              { icon: Bold, action: () => insertMarkdown("**", "**") },
              { icon: Italic, action: () => insertMarkdown("*", "*") },
              { icon: Heading1, action: () => insertMarkdown("# ") },
              { icon: Heading2, action: () => insertMarkdown("## ") },
              { icon: Heading3, action: () => insertMarkdown("### ") },
              { icon: SeparatorIcon, action: () => insertMarkdown("---\n") },
              { icon: Link, action: () => insertMarkdown("[", "](url)") },
              { icon: Image, action: () => insertMarkdown("![alt](", ")") },
              { icon: Code, action: () => insertMarkdown("`", "`") },
              { icon: Quote, action: () => insertMarkdown("> ") },
            ].map(({ icon: Icon, action }, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={action}
                className="h-7 w-7 p-0"
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
            <Separator className="mx-1" orientation="vertical" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((p) => !p)}
              className="h-7 px-2"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {showPreview
                ? t("admin.editor.source")
                : t("admin.editor.preview")}
            </Button>
          </div>
          {showPreview ? (
            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">HTML Preview</TabsTrigger>
                <TabsTrigger value="raw">Raw HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <div
                  className="p-4 prose max-w-none prose-sm"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </TabsContent>
              <TabsContent value="raw">
                <pre className="p-4 text-xs bg-muted rounded overflow-auto max-h-96">
                  {preview}
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <textarea
              ref={editorRef}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full min-h-[400px] p-4 resize-y font-mono text-sm border-none bg-transparent focus-visible:ring-0"
              placeholder={t("admin.editor.body")}
            />
          )}
          <div className="border-t p-2 flex justify-between text-xs text-muted-foreground">
            <span>
              {wordCount} {t("admin.editor.wordCount")} / {charCount}{" "}
              {t("admin.editor.charCount")}
            </span>
            <span>{lastSaved ? `${t("admin.editor.lastSaved")}: ${lastSaved}` : ""}</span>
          </div>
        </Card>
      </main>
    </div>
  );
}