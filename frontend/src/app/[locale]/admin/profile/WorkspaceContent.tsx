"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, ImagePlus, Loader2, Save, UserRound } from "lucide-react";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { AiLocaleSyncPanel } from "@/components/admin/AiLocaleSyncPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminAccount,
  type AiDraft,
  type FacultyMember,
  type FacultyMemberBody,
  type LocaleCode,
  facultyApi,
  isAuthenticated,
  uploadApi,
  usersApi,
} from "@/lib/api";

const labels = {
  zh: {
    title: "个人资料",
    subtitle: "维护私人账户资料，以及公开教师页面上显示的个人简介。",
    account: "账户资料",
    nickname: "昵称",
    nicknameZh: "中文昵称",
    nicknameEn: "英文昵称",
    nicknameFr: "法文昵称",
    phone: "私人电话（不会公开）",
    security: "修改密码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    mismatch: "两次输入的新密码不一致",
    save: "保存资料",
    saving: "保存中…",
    saved: "资料已保存",
    publicProfile: "公开教师资料",
    publicHelp:
      "这些内容会对外显示在 Faculty 页面。首次建立或尚未启用时，需要管理员审核后才会公开。",
    role: "职位 / 教学方向",
    photo: "公开照片",
    upload: "上传或替换照片",
    bio: "个人简介",
    specialties: "专长",
    achievements: "成就（每行一项）",
    language: "内容语言",
    pending: "等待管理员启用",
    visible: "已在网站公开",
    adminOnly: "超级管理员账户不需要公开 Faculty 资料。",
    loadFailed: "无法加载个人资料。",
    saveFailed: "无法保存个人资料。",
  },
  en: {
    title: "My Profile",
    subtitle: "Manage private account details and your public faculty profile.",
    account: "Account details",
    nickname: "Nickname",
    nicknameZh: "Chinese nickname",
    nicknameEn: "English nickname",
    nicknameFr: "French nickname",
    phone: "Private phone (never public)",
    security: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    mismatch: "New passwords do not match",
    save: "Save profile",
    saving: "Saving…",
    saved: "Profile saved",
    publicProfile: "Public faculty profile",
    publicHelp:
      "This content appears on the public Faculty page. A new or hidden profile must be enabled by an administrator before it becomes public.",
    role: "Role / teaching focus",
    photo: "Public photo",
    upload: "Upload or replace photo",
    bio: "Biography",
    specialties: "Specialties",
    achievements: "Achievements (one per line)",
    language: "Content language",
    pending: "Waiting for administrator approval",
    visible: "Published on website",
    adminOnly:
      "A super administrator account does not need a public Faculty profile.",
    loadFailed: "Unable to load your profile.",
    saveFailed: "Unable to save your profile.",
  },
  fr: {
    title: "Mon profil",
    subtitle:
      "Gérez les données privées du compte et votre profil public de professeur.",
    account: "Données du compte",
    nickname: "Surnom",
    nicknameZh: "Surnom chinois",
    nicknameEn: "Surnom anglais",
    nicknameFr: "Surnom français",
    phone: "Téléphone privé (jamais public)",
    security: "Modifier le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    mismatch: "Les nouveaux mots de passe ne correspondent pas",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Profil enregistré",
    publicProfile: "Profil public du professeur",
    publicHelp:
      "Ce contenu apparaît sur la page publique Faculty. Un nouveau profil doit être activé par un administrateur avant publication.",
    role: "Rôle / domaine d’enseignement",
    photo: "Photo publique",
    upload: "Téléverser ou remplacer la photo",
    bio: "Biographie",
    specialties: "Spécialités",
    achievements: "Réalisations (une par ligne)",
    language: "Langue du contenu",
    pending: "En attente de l’administrateur",
    visible: "Publié sur le site",
    adminOnly:
      "Un compte super administrateur n’a pas besoin de profil Faculty public.",
    loadFailed: "Impossible de charger votre profil.",
    saveFailed: "Impossible d’enregistrer votre profil.",
  },
} as const;

const languages: Array<{ value: LocaleCode; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const emptyFaculty: FacultyMemberBody = {
  name: "",
  role: "",
  bio: "",
  photo_url: "",
  specialties: "",
  achievements: "",
  is_active: false,
  order_index: 0,
  translations: { zh: {}, en: {}, fr: {} },
};

export function ProfileWorkspaceContent({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const rawLocale = pathname.split("/")[1] || "zh";
  const locale: LocaleCode =
    rawLocale === "fr" ? "fr" : rawLocale === "en" ? "en" : "zh";
  const text = labels[locale];
  const [profile, setProfile] = useState<AdminAccount | null>(null);
  const [faculty, setFaculty] = useState<FacultyMember | null>(null);
  const [facultyForm, setFacultyForm] =
    useState<FacultyMemberBody>(emptyFaculty);
  const [contentLocale, setContentLocale] = useState<LocaleCode>("zh");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${rawLocale}/admin/login`);
      return;
    }
    usersApi
      .me()
      .then(async (account) => {
        setProfile(account);
        if (account.role === "admin") {
          const member = await facultyApi.myProfile();
          setFaculty(member);
          setFacultyForm({
            name: member.name,
            role: member.role || "",
            bio: member.bio || "",
            photo_url: member.photo_url || "",
            specialties: member.specialties || "",
            achievements: member.achievements || "",
            is_active: member.is_active,
            order_index: member.order_index,
            translations: member.translations || { zh: {}, en: {}, fr: {} },
          });
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : text.loadFailed),
      );
  }, [rawLocale, router, text.loadFailed]);

  const value = (field: keyof FacultyMemberBody) =>
    contentLocale === "zh"
      ? String(facultyForm[field] || "")
      : facultyForm.translations?.[contentLocale]?.[String(field)] || "";
  const setValue = (field: keyof FacultyMemberBody, nextValue: string) =>
    setFacultyForm((current) =>
      contentLocale === "zh"
        ? { ...current, [field]: nextValue }
        : {
            ...current,
            translations: {
              ...(current.translations || {}),
              [contentLocale]: {
                ...(current.translations?.[contentLocale] || {}),
                [String(field)]: nextValue,
              },
            },
          },
    );

  const applyAi = (drafts: AiDraft[]) =>
    setFacultyForm((current) => {
      let next = {
        ...current,
        translations: { ...(current.translations || {}) },
      };
      drafts.forEach((draft) => {
        const draftLocale =
          draft.locale === "fr" ? "fr" : draft.locale === "en" ? "en" : "zh";
        const fields = draft.fields || {};
        if (draftLocale === "zh")
          next = {
            ...next,
            name: next.name || fields.name || "",
            role: next.role || fields.role || "",
            bio: next.bio || fields.bio || "",
            specialties: next.specialties || fields.specialties || "",
            achievements: next.achievements || fields.achievements || "",
          };
        else
          next.translations = {
            ...(next.translations || {}),
            [draftLocale]: {
              ...(next.translations?.[draftLocale] || {}),
              ...(fields.name && !next.translations?.[draftLocale]?.name
                ? { name: fields.name }
                : {}),
              ...(fields.role && !next.translations?.[draftLocale]?.role
                ? { role: fields.role }
                : {}),
              ...(fields.bio && !next.translations?.[draftLocale]?.bio
                ? { bio: fields.bio }
                : {}),
              ...(fields.specialties &&
              !next.translations?.[draftLocale]?.specialties
                ? { specialties: fields.specialties }
                : {}),
              ...(fields.achievements &&
              !next.translations?.[draftLocale]?.achievements
                ? { achievements: fields.achievements }
                : {}),
            },
          };
      });
      return next;
    });

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadApi.image(file, "profile");
      setFacultyForm((current) => ({ ...current, photo_url: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveFailed);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const account = await usersApi.updateMe({
        first_name: profile.nickname_zh || profile.first_name,
        last_name: profile.last_name,
        nickname_zh: profile.nickname_zh || profile.first_name,
        nickname_en: profile.nickname_en || "",
        nickname_fr: profile.nickname_fr || "",
        phone: profile.phone || "",
      });
      setProfile(account);
      if (profile.role === "admin") {
        const member = await facultyApi.updateMyProfile({
          name:
            facultyForm.name.trim() || profile.first_name.trim() || "Teacher",
          role: facultyForm.role,
          bio: facultyForm.bio,
          photo_url: facultyForm.photo_url,
          specialties: facultyForm.specialties,
          achievements: facultyForm.achievements,
          translations: facultyForm.translations,
        });
        setFaculty(member);
        setFacultyForm((current) => ({
          ...current,
          is_active: member.is_active,
        }));
      }
      setMessage(text.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveFailed);
    } finally {
      setSaving(false);
    }
  }
  const Content = embedded ? "section" : "main";

  return (
    <div className={embedded ? "" : "min-h-screen bg-muted/30"}>
      {!embedded && (
        <header className="sticky top-0 z-10 border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <AdminSectionTabs />
          </div>
        </header>
      )}
      <Content
        className={
          embedded ? "space-y-6" : "mx-auto max-w-5xl space-y-6 px-4 py-6"
        }
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <UserRound className="h-6 w-6 text-primary" />
            {text.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {profile && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{text.account}</CardTitle>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium">
                      {text.nicknameZh}
                    </span>
                    <Input
                      value={profile.nickname_zh || profile.first_name}
                      onChange={(event) => {
                        setProfile({
                          ...profile,
                          first_name: event.target.value,
                          nickname_zh: event.target.value,
                        });
                        if (profile.role === "admin" && !facultyForm.name)
                          setFacultyForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }));
                      }}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">
                      {text.nicknameEn}
                    </span>
                    <Input
                      value={profile.nickname_en || ""}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          nickname_en: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">
                      {text.nicknameFr}
                    </span>
                    <Input
                      value={profile.nickname_fr || ""}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          nickname_fr: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium">{text.phone}</span>
                    <Input
                      value={profile.phone || ""}
                      onChange={(event) =>
                        setProfile({ ...profile, phone: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="border-t pt-4">
                  <h2 className="mb-3 text-sm font-semibold">
                    {text.security}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild type="button" variant="outline">
                      <a href={`/auth/account?section=password&locale=${encodeURIComponent(rawLocale)}`}>
                        {locale === "zh" ? "在 Logto 修改密码" : locale === "fr" ? "Modifier le mot de passe dans Logto" : "Change password in Logto"}
                      </a>
                    </Button>
                    <Button asChild type="button" variant="outline">
                      <a href={`/auth/account?section=security&locale=${encodeURIComponent(rawLocale)}`}>
                        {locale === "zh" ? "管理登录与安全" : locale === "fr" ? "Gérer la connexion et la sécurité" : "Manage sign-in and security"}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {profile.role === "admin" ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{text.publicProfile}</CardTitle>
                      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                        {text.publicHelp}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${faculty?.is_active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {faculty?.is_active ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {faculty?.is_active ? text.visible : text.pending}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="mr-1 self-center text-sm font-medium">
                      {text.language}
                    </span>
                    {languages.map((language) => (
                      <Button
                        key={language.value}
                        type="button"
                        size="sm"
                        variant={
                          contentLocale === language.value
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setContentLocale(language.value)}
                      >
                        {language.label}
                      </Button>
                    ))}
                  </div>
                  <AiLocaleSyncPanel
                    module="faculty"
                    sourceLocale={contentLocale}
                    uiLocale={locale}
                    fields={{
                      name: value("name"),
                      role: value("role"),
                      bio: value("bio"),
                      specialties: value("specialties"),
                      achievements: value("achievements"),
                    }}
                    onApply={applyAi}
                  />
                  <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                    <div className="space-y-3">
                      <div className="aspect-[4/5] overflow-hidden border bg-slate-100">
                        {facultyForm.photo_url ? (
                          <img
                            src={facultyForm.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            {text.photo}
                          </div>
                        )}
                      </div>
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                      >
                        <label className="cursor-pointer">
                          {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ImagePlus className="mr-2 h-4 w-4" />
                          )}
                          {text.upload}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadPhoto}
                          />
                        </label>
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <label className="block space-y-1">
                        <span className="text-sm font-medium">
                          {text.nickname}
                        </span>
                        <Input
                          value={value("name")}
                          onChange={(event) =>
                            setValue("name", event.target.value)
                          }
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium">{text.role}</span>
                        <Input
                          value={value("role")}
                          onChange={(event) =>
                            setValue("role", event.target.value)
                          }
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium">{text.bio}</span>
                        <Textarea
                          rows={5}
                          value={value("bio")}
                          onChange={(event) =>
                            setValue("bio", event.target.value)
                          }
                        />
                      </label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-sm font-medium">
                            {text.specialties}
                          </span>
                          <Textarea
                            rows={4}
                            value={value("specialties")}
                            onChange={(event) =>
                              setValue("specialties", event.target.value)
                            }
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium">
                            {text.achievements}
                          </span>
                          <Textarea
                            rows={4}
                            value={value("achievements")}
                            onChange={(event) =>
                              setValue("achievements", event.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  {text.adminOnly}
                </CardContent>
              </Card>
            )}
            <Button type="button" onClick={save} disabled={saving || uploading}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? text.saving : text.save}
            </Button>
          </>
        )}
      </Content>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileWorkspaceContent />;
}
