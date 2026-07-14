"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isAuthenticated,
  usersApi,
  type AdminAccount,
  type PermissionCatalogItem,
  type PermissionGrant,
  type PermissionPreset,
  type LogtoBindingRequest,
  type AccountTypeDefault,
} from "@/lib/api";
import { hasPermission, firstAllowedAdminRoute } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  Check,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const permissionText = {
  zh: {
    title: "账户权限",
    help: "查看允许进入功能；管理允许新增、修改、删除、发布或审核。主功能关闭时子权限会暂时失效，但选择会保留。",
    view: "查看",
    manage: "管理",
    baseline: "教师基础权限",
    readOnly: "全部只读",
    clear: "清空业务权限",
    copy: "复制其他账户",
    choose: "选择账户",
    save: "保存权限",
    close: "关闭",
    saved: "账户权限已保存",
    permissions: "权限设置",
    content: "网站内容",
    teaching: "教学管理",
    classrooms: "教室使用",
    system: "系统设置",
    presetTitle: "自定义权限组",
    choosePreset: "选择权限组",
    applyCustomPreset: "套用权限组",
    presetName: "权限组名称",
    presetDescription: "用途说明（可选）",
    createPreset: "保存为新权限组",
    updatePreset: "更新权限组",
    deletePreset: "删除权限组",
    presetSaved: "权限组已保存",
    presetDeleted: "权限组已删除",
    confirmDeletePreset: "确认删除这个权限组吗？",
  },
  en: {
    title: "Account permissions",
    help: "View grants access. Manage allows create, edit, delete, publish, or review. Child selections are retained while a parent is off.",
    view: "View",
    manage: "Manage",
    baseline: "Teacher baseline",
    readOnly: "All read-only",
    clear: "Clear business access",
    copy: "Copy another account",
    choose: "Choose account",
    save: "Save permissions",
    close: "Close",
    saved: "Account permissions saved",
    permissions: "Permissions",
    content: "Website content",
    teaching: "Teaching",
    classrooms: "Classroom use",
    system: "System settings",
    presetTitle: "Custom permission groups",
    choosePreset: "Choose a permission group",
    applyCustomPreset: "Apply group",
    presetName: "Group name",
    presetDescription: "Purpose or notes (optional)",
    createPreset: "Save as new group",
    updatePreset: "Update group",
    deletePreset: "Delete group",
    presetSaved: "Permission group saved",
    presetDeleted: "Permission group deleted",
    confirmDeletePreset: "Delete this permission group?",
  },
  fr: {
    title: "Autorisations du compte",
    help: "Voir donne acces. Gerer autorise la creation, la modification, la suppression, la publication ou la validation.",
    view: "Voir",
    manage: "Gerer",
    baseline: "Base professeur",
    readOnly: "Lecture seule",
    clear: "Effacer les acces",
    copy: "Copier un compte",
    choose: "Choisir un compte",
    save: "Enregistrer",
    close: "Fermer",
    saved: "Autorisations enregistrees",
    permissions: "Autorisations",
    content: "Contenu du site",
    teaching: "Enseignement",
    classrooms: "Utilisation des salles",
    system: "Parametres systeme",
    presetTitle: "Groupes d’autorisations",
    choosePreset: "Choisir un groupe",
    applyCustomPreset: "Appliquer le groupe",
    presetName: "Nom du groupe",
    presetDescription: "Description (facultative)",
    createPreset: "Enregistrer comme nouveau groupe",
    updatePreset: "Mettre à jour",
    deletePreset: "Supprimer le groupe",
    presetSaved: "Groupe d’autorisations enregistré",
    presetDeleted: "Groupe d’autorisations supprimé",
    confirmDeletePreset: "Supprimer ce groupe d’autorisations ?",
  },
} as const;

const permissionNames: Record<string, { zh: string; en: string; fr: string }> =
  {
    content: { zh: "网站内容", en: "Website content", fr: "Contenu du site" },
    "content.homepage": {
      zh: "首页管理",
      en: "Homepage",
      fr: "Page d accueil",
    },
    "content.news": { zh: "新闻管理", en: "News", fr: "Actualites" },
    "content.news.articles": {
      zh: "新闻文章",
      en: "News articles",
      fr: "Articles",
    },
    "content.news.categories": {
      zh: "分类",
      en: "Categories",
      fr: "Categories",
    },
    "content.news.tags": { zh: "标签", en: "Tags", fr: "Etiquettes" },
    "content.performances": {
      zh: "演出与赛事",
      en: "Performances",
      fr: "Spectacles",
    },
    teaching: { zh: "教学管理", en: "Teaching", fr: "Enseignement" },
    "teaching.programs": { zh: "开设课程", en: "Programs", fr: "Programmes" },
    "teaching.schedules": {
      zh: "统一课程安排",
      en: "Unified scheduling",
      fr: "Planification unifiee",
    },
    "teaching.schedules.calendar": {
      zh: "课程表",
      en: "Calendar",
      fr: "Calendrier",
    },
    "teaching.schedules.fixed": {
      zh: "固定课程",
      en: "Fixed courses",
      fr: "Cours fixes",
    },
    "teaching.schedules.bookings": {
      zh: "内部预约",
      en: "Internal booking",
      fr: "Reservation interne",
    },
    "teaching.schedules.ai": {
      zh: "AI 批量导入",
      en: "AI bulk import",
      fr: "Import IA",
    },
    "teaching.pricing": { zh: "价格管理", en: "Pricing", fr: "Tarification" },
    "teaching.pricing.program": {
      zh: "课程价格",
      en: "Program pricing",
      fr: "Tarifs des programmes",
    },
    "teaching.pricing.rental": {
      zh: "租赁价格",
      en: "Rental pricing",
      fr: "Tarifs de location",
    },
    "teaching.faculty": { zh: "教师资料", en: "Faculty", fr: "Professeurs" },
    "teaching.registration": {
      zh: "报名设置",
      en: "Registration",
      fr: "Inscription",
    },
    classrooms: {
      zh: "教室使用",
      en: "Classroom use",
      fr: "Utilisation des salles",
    },
    "classrooms.rentals": {
      zh: "外部租借申请",
      en: "Rental requests",
      fr: "Demandes de location",
    },
    system: { zh: "系统设置", en: "System settings", fr: "Parametres systeme" },
    "system.brand": {
      zh: "品牌与页头",
      en: "Branding and header",
      fr: "Marque et en-tete",
    },
    "system.announcement": { zh: "公告栏", en: "Announcement", fr: "Annonce" },
    "system.footer": { zh: "页脚内容", en: "Footer", fr: "Pied de page" },
    "system.contact": {
      zh: "联系与社交媒体",
      en: "Contact and social",
      fr: "Contact et reseaux",
    },
    "system.studio": {
      zh: "Studio 资源",
      en: "Studio resources",
      fr: "Ressources du studio",
    },
    "system.policy": {
      zh: "学校规章与退费",
      en: "Policies and refunds",
      fr: "Reglement et remboursements",
    },
    "system.email": {
      zh: "邮件与申请规则",
      en: "Email and request rules",
      fr: "Courriel et demandes",
    },
    "system.ai": { zh: "AI 连接", en: "AI connection", fr: "Connexion IA" },
    "system.backup": {
      zh: "备份与恢复",
      en: "Backup and restore",
      fr: "Sauvegarde",
    },
    "system.accounts": {
      zh: "账号管理",
      en: "Account management",
      fr: "Gestion des comptes",
    },
  };

function permissionLabel(key: string, locale: string) {
  const language = locale === "fr" ? "fr" : locale === "en" ? "en" : "zh";
  return permissionNames[key]?.[language] || key;
}
const accountText = {
  zh: {
    title: "老师账号管理",
    subtitle:
      "拥有账号管理权限的管理员可以创建和维护普通管理员账号，但不能修改自己、超级管理员或授予超过自身的权限。",
    refresh: "刷新",
    profile: "我的基本信息",
    nickname: "昵称",
    phone: "电话",
    saveProfile: "保存基本信息",
    saving: "保存中...",
    create: "创建老师账号",
    email: "邮箱",
    password: "初始密码",
    firstName: "名字",
    lastName: "姓氏",
    createButton: "创建老师账号",
    list: "老师账号列表",
    listHelp: "这里不会显示学生账号，也不会显示超级管理员账号。",
    search: "搜索邮箱",
    all: "全部状态",
    active: "启用",
    disabled: "停用",
    filter: "筛选",
    empty: "没有符合条件的老师账号。",
    previous: "上一页",
    next: "下一页",
    edit: "编辑",
    collapse: "收起",
    save: "保存",
    newPassword: "新密码，留空不改",
    phonePlaceholder: "电话",
  },
  en: {
    title: "Teacher Accounts",
    subtitle:
      "Administrators with account management access can maintain ordinary admin accounts, but cannot modify themselves, super administrators, or grant permissions they do not hold.",
    refresh: "Refresh",
    profile: "My Profile",
    nickname: "Nickname",
    phone: "Phone",
    saveProfile: "Save Profile",
    saving: "Saving...",
    create: "Create Teacher Account",
    email: "Email",
    password: "Initial password",
    firstName: "First name",
    lastName: "Last name",
    createButton: "Create Teacher Account",
    list: "Teacher Accounts",
    listHelp: "Student and super administrator accounts are not shown here.",
    search: "Search email",
    all: "All statuses",
    active: "Active",
    disabled: "Disabled",
    filter: "Filter",
    empty: "No teacher accounts match.",
    previous: "Previous",
    next: "Next",
    edit: "Edit",
    collapse: "Collapse",
    save: "Save",
    newPassword: "New password, leave blank to keep",
    phonePlaceholder: "Phone",
  },
  fr: {
    title: "Comptes enseignants",
    subtitle:
      "Les administrateurs autorisés peuvent gérer les comptes ordinaires, sans pouvoir modifier leur propre compte, un super administrateur, ni accorder des droits qu’ils ne possèdent pas.",
    refresh: "Actualiser",
    profile: "Mon profil",
    nickname: "Surnom",
    phone: "Telephone",
    saveProfile: "Enregistrer le profil",
    saving: "Enregistrement...",
    create: "Creer un compte enseignant",
    email: "E-mail",
    password: "Mot de passe initial",
    firstName: "Prenom",
    lastName: "Nom",
    createButton: "Creer un compte enseignant",
    list: "Comptes enseignants",
    listHelp:
      "Les comptes eleves et super administrateurs ne sont pas affiches ici.",
    search: "Rechercher un e-mail",
    all: "Tous les statuts",
    active: "Actif",
    disabled: "Desactive",
    filter: "Filtrer",
    empty: "Aucun compte enseignant correspondant.",
    previous: "Precedent",
    next: "Suivant",
    edit: "Modifier",
    collapse: "Reduire",
    save: "Enregistrer",
    newPassword: "Nouveau mot de passe, laisser vide pour conserver",
    phonePlaceholder: "Telephone",
  },
} as const;

export function AccountsWorkspaceContent({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const text =
    accountText[locale === "fr" ? "fr" : locale === "en" ? "en" : "zh"];
  const permissionCopy =
    permissionText[locale === "fr" ? "fr" : locale === "en" ? "en" : "zh"];

  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [permissionTarget, setPermissionTarget] = useState<AdminAccount | null>(
    null,
  );
  const [grants, setGrants] = useState<PermissionGrant[]>([]);
  const [copyAccountId, setCopyAccountId] = useState("");
  const [permissionPresets, setPermissionPresets] = useState<
    PermissionPreset[]
  >([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [bindingRequests, setBindingRequests] = useState<LogtoBindingRequest[]>([]);
  const [accountTypeDefaults, setAccountTypeDefaults] = useState<AccountTypeDefault[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [newAccount, setNewAccount] = useState({
    email: "",
    account_type: "teacher" as "teacher" | "staff_admin",
    first_name: "",
    last_name: "",
    nickname_zh: "",
    nickname_en: "",
    nickname_fr: "",
    phone: "",
  });

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const loadData = (nextOffset = offset) => {
    setLoading(true);
    setError("");
    Promise.all([
      usersApi.me(),
      usersApi.adminAccounts({
        search,
        status: statusFilter,
        limit,
        offset: nextOffset,
      }),
      usersApi.permissionCatalog(),
      usersApi.permissionPresets(),
      usersApi.accountTypeDefaults(),
    ])
      .then(([me, accountPage, nextCatalog, nextPresets, nextTypeDefaults]) => {
        setCurrentUser(me);
        if (!hasPermission(me, "system.accounts")) {
          router.push(`/${locale}${firstAllowedAdminRoute(me)}`);
          return;
        }
        setAccounts(accountPage.items);
        setTotal(accountPage.total);
        setCatalog(nextCatalog);
        setPermissionPresets(nextPresets);
        setAccountTypeDefaults(nextTypeDefaults);
        if (me.role === "super_admin") {
          void usersApi.logtoBindingRequests().then(setBindingRequests).catch(() => setBindingRequests([]));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadData();
    // Filters are applied explicitly with the Filter button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, locale, offset, limit]);

  const runSearch = () => {
    setOffset(0);
    loadData(0);
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving("new-account");
    setError("");
    setSuccess("");
    try {
      await usersApi.createAdminAccount(newAccount);
      setNewAccount({
        email: "",
        account_type: "teacher",
        first_name: "",
        last_name: "",
        nickname_zh: "",
        nickname_en: "",
        nickname_fr: "",
        phone: "",
      });
      setSuccess("老师账号已创建");
      setOffset(0);
      loadData(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建老师账号失败");
    } finally {
      setSaving("");
    }
  };

  const reviewBinding = async (request: LogtoBindingRequest, accountType?: "teacher" | "staff_admin") => {
    setSaving(`binding-${request.id}`);
    setError("");
    try {
      if (accountType) await usersApi.approveLogtoBinding(request.id, accountType);
      else await usersApi.rejectLogtoBinding(request.id);
      setBindingRequests((items) => items.filter((item) => item.id !== request.id));
      setSuccess(locale === "fr" ? "Demande d’identité traitée" : locale === "en" ? "Identity request reviewed" : "身份绑定申请已处理");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review identity request");
    } finally {
      setSaving("");
    }
  };

  const updateTypePreset = async (accountType: "teacher" | "staff_admin", presetId: string, sync = false) => {
    setSaving(`type-${accountType}`);
    setError("");
    try {
      await usersApi.updateAccountTypeDefault(accountType, presetId || null);
      if (sync && window.confirm(locale === "fr" ? "Appliquer ce groupe aux comptes existants ?" : locale === "en" ? "Apply this group to existing accounts?" : "将此权限组同步到现有账号？")) {
        await usersApi.syncAccountTypeDefault(accountType);
      }
      setAccountTypeDefaults((items) => items.map((item) => item.account_type === accountType ? { ...item, preset_id: presetId || null } : item));
      setSuccess(locale === "fr" ? "Préréglage enregistré" : locale === "en" ? "Account type preset saved" : "账号类型权限预设已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save account type preset");
    } finally {
      setSaving("");
    }
  };

  const updateAccount = (
    id: string,
    updater: (account: AdminAccount) => AdminAccount,
  ) => {
    setAccounts((items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const saveAccount = async (account: AdminAccount) => {
    setSaving(account.id);
    setError("");
    setSuccess("");
    try {
      await usersApi.updateAdminAccount(account.id, {
        first_name: account.first_name,
        last_name: account.last_name,
        nickname_zh: account.nickname_zh,
        nickname_en: account.nickname_en,
        nickname_fr: account.nickname_fr,
        is_active: account.is_active,
        phone: account.phone || undefined,
        account_type: account.account_type || undefined,
      });
      setSuccess("老师账号已保存");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存老师账号失败");
    } finally {
      setSaving("");
    }
  };

  const saveMyProfile = async () => {
    if (!currentUser) return;
    setSaving("my-profile");
    setError("");
    try {
      const updated = await usersApi.updateMe({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        phone: currentUser.phone || "",
      });
      setCurrentUser(updated);
      setSuccess("基本信息已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存基本信息失败");
    } finally {
      setSaving("");
    }
  };

  const openPermissions = async (account: AdminAccount) => {
    setSaving(`permissions-${account.id}`);
    setError("");
    try {
      const result = await usersApi.accountPermissions(account.id);
      setPermissionTarget(account);
      setGrants(result.permissions);
      setCopyAccountId("");
      setSelectedPresetId("");
      setPresetName("");
      setPresetDescription("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load permissions",
      );
    } finally {
      setSaving("");
    }
  };

  const setGrant = (
    key: string,
    field: "can_view" | "can_manage",
    checked: boolean,
  ) =>
    setGrants((items) =>
      items.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: checked,
              ...(field === "can_manage" && checked
                ? { can_view: true }
                : field === "can_view" && !checked
                  ? { can_manage: false }
                  : {}),
            }
          : item,
      ),
    );
  const applyPreset = (kind: "baseline" | "readonly" | "clear") =>
    setGrants((items) =>
      items.map((item) => {
        if (kind === "readonly")
          return { ...item, can_view: true, can_manage: false };
        if (kind === "clear")
          return { ...item, can_view: false, can_manage: false };
        const baseline: Record<string, [boolean, boolean]> = {
          teaching: [true, true],
          "teaching.schedules": [true, true],
          "teaching.schedules.calendar": [true, false],
          "teaching.schedules.bookings": [true, true],
        };
        const value = baseline[item.key] || [false, false];
        return { ...item, can_view: value[0], can_manage: value[1] };
      }),
    );
  const copyPermissions = async () => {
    if (!copyAccountId) return;
    setSaving("copy-permissions");
    try {
      setGrants((await usersApi.accountPermissions(copyAccountId)).permissions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to copy permissions",
      );
    } finally {
      setSaving("");
    }
  };
  const choosePermissionPreset = (id: string) => {
    setSelectedPresetId(id);
    const preset = permissionPresets.find((item) => item.id === id);
    setPresetName(preset?.name || "");
    setPresetDescription(preset?.description || "");
  };
  const applyPermissionPreset = () => {
    const preset = permissionPresets.find(
      (item) => item.id === selectedPresetId,
    );
    if (!preset) return;
    const presetMap = new Map(
      preset.permissions.map((item) => [item.key, item]),
    );
    setGrants((items) =>
      items.map((item) => {
        const value = presetMap.get(item.key) || {
          key: item.key,
          can_view: false,
          can_manage: false,
        };
        const canChangeView = hasPermission(currentUser, item.key);
        const canChangeManage = hasPermission(currentUser, item.key, "manage");
        const canManage = canChangeManage ? value.can_manage : item.can_manage;
        return {
          ...item,
          can_view:
            canManage || (canChangeView ? value.can_view : item.can_view),
          can_manage: canManage,
        };
      }),
    );
  };
  const editablePresetGrants = () =>
    grants.map((item) => ({
      key: item.key,
      can_view: item.can_view && hasPermission(currentUser, item.key),
      can_manage:
        item.can_manage && hasPermission(currentUser, item.key, "manage"),
    }));
  const createPermissionPreset = async () => {
    if (!presetName.trim()) return;
    setSaving("permission-preset");
    setError("");
    try {
      const saved = await usersApi.createPermissionPreset({
        name: presetName,
        description: presetDescription,
        permissions: editablePresetGrants(),
      });
      setPermissionPresets((items) =>
        [...items, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedPresetId(saved.id);
      setSuccess(permissionCopy.presetSaved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save permission group",
      );
    } finally {
      setSaving("");
    }
  };
  const updatePermissionPreset = async () => {
    if (!selectedPresetId || !presetName.trim()) return;
    setSaving("permission-preset");
    setError("");
    try {
      const saved = await usersApi.updatePermissionPreset(selectedPresetId, {
        name: presetName,
        description: presetDescription,
        permissions: editablePresetGrants(),
      });
      setPermissionPresets((items) =>
        items
          .map((item) => (item.id === saved.id ? saved : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSuccess(permissionCopy.presetSaved);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update permission group",
      );
    } finally {
      setSaving("");
    }
  };
  const deletePermissionPreset = async () => {
    if (
      !selectedPresetId ||
      !window.confirm(permissionCopy.confirmDeletePreset)
    )
      return;
    setSaving("permission-preset");
    setError("");
    try {
      await usersApi.deletePermissionPreset(selectedPresetId);
      setPermissionPresets((items) =>
        items.filter((item) => item.id !== selectedPresetId),
      );
      setSelectedPresetId("");
      setPresetName("");
      setPresetDescription("");
      setSuccess(permissionCopy.presetDeleted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete permission group",
      );
    } finally {
      setSaving("");
    }
  };
  const savePermissions = async () => {
    if (!permissionTarget) return;
    const viewCount = grants.filter((item) => item.can_view).length;
    const manageCount = grants.filter((item) => item.can_manage).length;
    const summary =
      locale === "zh"
        ? `将为 ${permissionTarget.first_name || permissionTarget.email} 保存 ${viewCount} 项查看权限和 ${manageCount} 项管理权限，确认继续吗？`
        : locale === "fr"
          ? `Enregistrer ${viewCount} autorisations de lecture et ${manageCount} autorisations de gestion ?`
          : `Save ${viewCount} view permissions and ${manageCount} manage permissions for ${permissionTarget.first_name || permissionTarget.email}?`;
    if (!window.confirm(summary)) return;
    setSaving(`permissions-${permissionTarget.id}`);
    setError("");
    try {
      await usersApi.updateAccountPermissions(permissionTarget.id, grants);
      setSuccess(permissionCopy.saved);
      setPermissionTarget(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save permissions",
      );
    } finally {
      setSaving("");
    }
  };
  const canManageAccounts = hasPermission(
    currentUser,
    "system.accounts",
    "manage",
  );
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
          embedded ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-6"
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <p className="text-sm text-muted-foreground">{text.subtitle}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadData()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {text.refresh}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {currentUser?.role === "super_admin" && bindingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{locale === "fr" ? "Demandes de liaison Logto" : locale === "en" ? "Logto identity requests" : "Logto 身份绑定申请"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bindingRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{request.email}</p>
                    <p className="text-sm text-muted-foreground">{new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" disabled={saving === `binding-${request.id}`} onClick={() => reviewBinding(request, "teacher")}>Teacher</Button>
                    <Button type="button" size="sm" variant="outline" disabled={saving === `binding-${request.id}`} onClick={() => reviewBinding(request, "staff_admin")}>Staff admin</Button>
                    <Button type="button" size="sm" variant="destructive" disabled={saving === `binding-${request.id}`} onClick={() => reviewBinding(request)}>{locale === "fr" ? "Refuser" : locale === "en" ? "Reject" : "拒绝"}</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {canManageAccounts && (
          <Card>
            <CardHeader><CardTitle>{locale === "fr" ? "Préréglages par type de compte" : locale === "en" ? "Account type permission presets" : "账号类型权限预设"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["teacher", "staff_admin"] as const).map((accountType) => {
                const selected = accountTypeDefaults.find((item) => item.account_type === accountType)?.preset_id || "";
                return (
                  <div key={accountType} className="grid gap-2 md:grid-cols-[160px_1fr_auto] md:items-center">
                    <span className="font-medium">{accountType === "teacher" ? "Teacher" : "Staff administrator"}</span>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selected} onChange={(e) => updateTypePreset(accountType, e.target.value)}>
                      <option value="">{locale === "fr" ? "Aucun préréglage" : locale === "en" ? "No preset" : "未设置权限组"}</option>
                      {permissionPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" disabled={!selected || saving === `type-${accountType}`} onClick={() => updateTypePreset(accountType, selected, true)}>
                      {locale === "fr" ? "Synchroniser" : locale === "en" ? "Sync existing" : "同步现有账号"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {canManageAccounts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-700" />
                创建老师账号
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createAccount} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Input
                    placeholder={text.email}
                    type="email"
                    value={newAccount.email}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, email: e.target.value })
                    }
                    required
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={newAccount.account_type}
                    onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value as "teacher" | "staff_admin" })}
                  >
                    <option value="teacher">Teacher</option>
                    {currentUser?.role === "super_admin" && <option value="staff_admin">Staff administrator</option>}
                  </select>
                  <Input
                    placeholder="中文昵称"
                    value={newAccount.nickname_zh}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        first_name: e.target.value,
                        nickname_zh: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="English nickname"
                    value={newAccount.nickname_en}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        nickname_en: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Surnom français"
                    value={newAccount.nickname_fr}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        nickname_fr: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="姓氏"
                    value={newAccount.last_name}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Input
                  className="max-w-xs"
                  placeholder={text.phonePlaceholder}
                  value={newAccount.phone}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, phone: e.target.value })
                  }
                />
                <Button type="submit" disabled={saving === "new-account"}>
                  <Check className="mr-2 h-4 w-4" />
                  {saving === "new-account" ? "创建中..." : "创建老师账号"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>老师账号列表</CardTitle>
            <p className="text-sm text-muted-foreground">
              这里不会显示学生账号，也不会显示超级管理员账号。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_120px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="搜索邮箱"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "disabled",
                  )
                }
              >
                <option value="all">全部状态</option>
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}/页
                  </option>
                ))}
              </select>
              <Button type="button" onClick={runSearch}>
                筛选
              </Button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">
                加载中...
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                没有符合条件的老师账号。
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <TeacherAccountRow
                    key={account.id}
                    account={account}
                    saving={saving === account.id}
                    onChange={(next) => updateAccount(account.id, () => next)}
                    onSave={() => saveAccount(account)}
                    onPermissions={() => void openPermissions(account)}
                    canManage={canManageAccounts}
                    isSelf={currentUser?.id === account.id}
                    permissionsLabel={permissionCopy.permissions}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                共 {total} 个老师账号，第 {page} / {pageCount} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {permissionTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6">
            <Card className="mx-auto max-w-5xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    {permissionCopy.title} ·{" "}
                    {permissionTarget.first_name || permissionTarget.email}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {permissionCopy.help}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPermissionTarget(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 border border-purple-200 bg-purple-50/60 p-4">
                  <div>
                    <h3 className="font-semibold text-purple-950">
                      {permissionCopy.presetTitle}
                    </h3>
                    <p className="text-xs text-purple-800/75">
                      {permissionCopy.help}
                    </p>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-[minmax(180px,1fr)_auto]">
                    <select
                      className="h-10 min-w-0 rounded-md border bg-white px-3 text-sm"
                      value={selectedPresetId}
                      onChange={(event) =>
                        choosePermissionPreset(event.target.value)
                      }
                    >
                      <option value="">{permissionCopy.choosePreset}</option>
                      {permissionPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedPresetId}
                      onClick={applyPermissionPreset}
                    >
                      {permissionCopy.applyCustomPreset}
                    </Button>
                  </div>
                  {canManageAccounts && (
                    <div className="grid gap-2 lg:grid-cols-[minmax(160px,0.7fr)_minmax(220px,1fr)_auto]">
                      <Input
                        value={presetName}
                        onChange={(event) => setPresetName(event.target.value)}
                        placeholder={permissionCopy.presetName}
                      />
                      <Input
                        value={presetDescription}
                        onChange={(event) =>
                          setPresetDescription(event.target.value)
                        }
                        placeholder={permissionCopy.presetDescription}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={createPermissionPreset}
                          disabled={
                            !presetName.trim() || saving === "permission-preset"
                          }
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          {permissionCopy.createPreset}
                        </Button>
                        {selectedPresetId && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={updatePermissionPreset}
                              disabled={saving === "permission-preset"}
                            >
                              {permissionCopy.updatePreset}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={deletePermissionPreset}
                              disabled={saving === "permission-preset"}
                            >
                              {permissionCopy.deletePreset}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset("baseline")}
                  >
                    {permissionCopy.baseline}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset("readonly")}
                  >
                    {permissionCopy.readOnly}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset("clear")}
                  >
                    {permissionCopy.clear}
                  </Button>
                  <select
                    className="h-9 min-w-48 rounded-md border bg-background px-3 text-sm"
                    value={copyAccountId}
                    onChange={(e) => setCopyAccountId(e.target.value)}
                  >
                    <option value="">{permissionCopy.choose}</option>
                    {accounts
                      .filter((item) => item.id !== permissionTarget.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.first_name || item.email}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!copyAccountId || saving === "copy-permissions"}
                    onClick={copyPermissions}
                  >
                    {permissionCopy.copy}
                  </Button>
                </div>
                {(["content", "teaching", "classrooms", "system"] as const).map(
                  (group) => (
                    <section key={group} className="border">
                      <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold">
                        {permissionCopy[group]}
                      </h3>
                      <div className="divide-y">
                        {catalog
                          .filter((item) => item.group === group)
                          .map((item) => {
                            const grant = grants.find(
                              (value) => value.key === item.key,
                            ) || {
                              key: item.key,
                              can_view: false,
                              can_manage: false,
                            };
                            const parentGrant = item.parent
                              ? grants.find(
                                  (value) => value.key === item.parent,
                                )
                              : null;
                            const parentOff = Boolean(
                              parentGrant && !parentGrant.can_view,
                            );
                            const parentManageOff = Boolean(
                              parentGrant && !parentGrant.can_manage,
                            );
                            const actorView = hasPermission(
                              currentUser,
                              item.key,
                            );
                            const actorManage = hasPermission(
                              currentUser,
                              item.key,
                              "manage",
                            );
                            return (
                              <div
                                key={item.key}
                                className={cn(
                                  "grid grid-cols-[1fr_72px_72px] items-center gap-2 px-4 py-3",
                                  item.parent && "pl-8",
                                  parentOff && "opacity-50",
                                )}
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {permissionLabel(item.key, locale)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.key}
                                  </p>
                                </div>
                                <label className="flex flex-col items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={grant.can_view}
                                    disabled={parentOff || !actorView}
                                    onChange={(e) =>
                                      setGrant(
                                        item.key,
                                        "can_view",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                  {permissionCopy.view}
                                </label>
                                <label className="flex flex-col items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={grant.can_manage}
                                    disabled={
                                      parentOff ||
                                      parentManageOff ||
                                      !actorManage
                                    }
                                    onChange={(e) =>
                                      setGrant(
                                        item.key,
                                        "can_manage",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                  {permissionCopy.manage}
                                </label>
                              </div>
                            );
                          })}
                      </div>
                    </section>
                  ),
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPermissionTarget(null)}
                  >
                    {permissionCopy.close}
                  </Button>
                  <Button
                    onClick={savePermissions}
                    disabled={saving === `permissions-${permissionTarget.id}`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {permissionCopy.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Content>
    </div>
  );
}

export default function AdminAccountsPage() {
  return <AccountsWorkspaceContent />;
}

function TeacherAccountRow({
  account,
  saving,
  onChange,
  onSave,
  onPermissions,
  canManage,
  isSelf,
  permissionsLabel,
}: {
  account: AdminAccount;
  saving: boolean;
  onChange: (account: AdminAccount) => void;
  onSave: () => void;
  onPermissions: () => void;
  canManage: boolean;
  isSelf: boolean;
  permissionsLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-950">
              {account.nickname_zh || account.first_name}
            </p>
            <Badge variant={account.is_active ? "default" : "secondary"}>
              {account.is_active ? "启用" : "停用"}
            </Badge>
            <Badge variant="outline">老师账号</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && !isSelf && (
            <Button type="button" variant="outline" onClick={onPermissions}>
              <KeyRound className="mr-2 h-4 w-4" />
              {permissionsLabel}
            </Button>
          )}
          {!isSelf && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {expanded ? "收起" : "编辑"}
            </Button>
          )}
          {!isSelf && (
            <Button
              type="button"
              disabled={saving}
              onClick={onSave}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : "保存"}
            </Button>
          )}
        </div>
      </div>

      {expanded && !isSelf && (
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            value={account.nickname_zh || account.first_name}
            onChange={(e) =>
              onChange({
                ...account,
                first_name: e.target.value,
                nickname_zh: e.target.value,
              })
            }
            placeholder="中文昵称"
          />
          <Input
            value={account.nickname_en || ""}
            onChange={(e) =>
              onChange({ ...account, nickname_en: e.target.value })
            }
            placeholder="English nickname"
          />
          <Input
            value={account.nickname_fr || ""}
            onChange={(e) =>
              onChange({ ...account, nickname_fr: e.target.value })
            }
            placeholder="Surnom français"
          />
          <Input
            value={account.last_name}
            onChange={(e) =>
              onChange({ ...account, last_name: e.target.value })
            }
            placeholder="姓氏"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={account.is_active ? "active" : "disabled"}
            onChange={(e) =>
              onChange({ ...account, is_active: e.target.value === "active" })
            }
          >
            <option value="active">启用</option>
            <option value="disabled">停用</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={account.account_type || ""}
            onChange={(e) => onChange({ ...account, account_type: (e.target.value || null) as AdminAccount["account_type"] })}
          >
            <option value="">Account type not assigned</option>
            <option value="teacher">Teacher</option>
            <option value="staff_admin">Staff administrator</option>
          </select>
        </div>
      )}
    </div>
  );
}
