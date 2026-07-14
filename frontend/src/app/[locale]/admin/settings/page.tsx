"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  Building2,
  ChevronRight,
  CloudDownload,
  Contact,
  Eye,
  ImagePlus,
  Info,
  Laptop,
  Loader2,
  Mail,
  Megaphone,
  PanelTop,
  Save,
  Send,
  ServerCog,
  Settings,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AiLocaleSyncPanel } from "@/components/admin/AiLocaleSyncPanel";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type AiDraft,
  type AiProviderSettings,
  type AiProviderSettingsUpdate,
  type AdminAccount,
  type BackupInfo,
  type SystemSettings,
  backupApi,
  isAuthenticated,
  settingsApi,
  uploadApi,
  usersApi,
} from "@/lib/api";
import { adminContentLanguageOptions } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { StudioResourcesWorkspaceContent } from "../studio-resources/WorkspaceContent";
import { SchoolPolicyWorkspaceContent } from "../school-policy/WorkspaceContent";
import { ProfileWorkspaceContent } from "../profile/WorkspaceContent";
import { AccountsWorkspaceContent } from "../accounts/WorkspaceContent";

type ContentLocale = "zh" | "en" | "fr";
type PanelId =
  | "brand"
  | "announcement"
  | "footer"
  | "contact"
  | "studio"
  | "policy"
  | "profile"
  | "accounts"
  | "email"
  | "ai"
  | "backup";
type PreviewDevice = "desktop" | "mobile";

const defaults: SystemSettings = {
  site_name: "Mulan Dance Studio",
  logo_url: "/logo.png",
  header_cta_label: "Register",
  header_cta_href: "/classes/register",
  show_admin_login: true,
  announcement_enabled: false,
  announcement_text: "",
  announcement_href: "",
  footer_description: "",
  footer_newsletter_title: "Join Us",
  footer_newsletter_text: "",
  copyright_text: "All rights reserved.",
  privacy_href: "/privacy",
  contact_email: "info@mulandance.com",
  contact_phone: "",
  contact_address: "",
  outbound_email: "",
  classroom_request_limit_per_contact: 0,
  program_pricing_json: "",
  classroom_pricing_json: "",
  youtube_url: "",
  xiaohongshu_url: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  translations: {},
};

const defaultAi: AiProviderSettings = {
  enabled: false,
  thinking_enabled: false,
  image_enabled: false,
  provider: "openai_compatible",
  api_base_url: "https://api.openai.com/v1",
  model: "",
  timeout_seconds: 600,
  feature_models: {},
  api_key_set: false,
  api_key_masked: "",
};

const copy = {
  zh: {
    title: "系统设置",
    subtitle:
      "集中管理网站公开信息与内部系统工具。公开内容先保存草稿，确认预览后再发布。",
    panels: {
      brand: ["品牌与页头", "Logo、网站名称和页头操作"],
      announcement: ["公告栏", "中英法公告内容与链接"],
      footer: ["页脚内容", "简介、订阅文案与版权"],
      contact: ["联系与社交媒体", "公开联系方式、地址和社交链接"],
      studio: ["Studio 资源", "管理学校、教室和出租状态"],
      policy: ["学校规章与退费", "管理中英法公开政策内容"],
      profile: ["个人资料", "昵称、电话、密码和教师资料"],
      accounts: ["账号管理", "教师账号、权限和账号状态"],
      email: ["邮件与申请规则", "发信人和外部租借申请限制"],
      ai: ["AI 连接", "模型、接口和功能模型配置"],
      backup: ["备份与恢复", "导出或恢复完整网站内容"],
    },
    public: "公开网站内容",
    organization: "学校与资源",
    accountAccess: "账户与权限",
    system: "系统工具",
    draft: "有未发布修改",
    published: "草稿与线上一致",
    lastPublished: "上次发布",
    never: "尚未发布",
    saveDraft: "保存草稿",
    preview: "预览",
    publish: "发布到网站",
    saved: "草稿已保存",
    publishedDone: "设置已发布到网站",
    aiSaved: "AI 配置已保存并立即生效",
    loading: "正在加载系统设置...",
    editLanguage: "编辑语言",
    siteName: "网站名称",
    logo: "网站 Logo",
    uploadLogo: "上传 Logo",
    ctaLabel: "页头按钮文字",
    ctaHref: "页头按钮链接",
    adminLogin: "显示后台登录入口",
    announcementEnabled: "启用公告栏",
    announcementText: "公告文字",
    announcementHref: "公告链接（可选）",
    footerDescription: "页脚简介",
    footerTitle: "页脚右侧标题",
    footerText: "页脚右侧文字",
    copyright: "版权文字",
    privacy: "隐私政策链接",
    contactEmail: "公开联系邮箱",
    phone: "公开电话",
    address: "公开地址",
    rednote: "小红书 / RedNote",
    sender: "对外发信人邮箱",
    limit: "同一联系方式最多申请次数",
    limitHelp: "0 表示不限制。此规则用于前台教室租借申请。",
    smtpHelp: "这里只设置邮件显示的发信人。实际发送仍需要服务器 SMTP 配置。",
    aiTitle: "AI API 连接",
    aiHelp: "AI 设置独立保存并立即生效，不进入公开网站草稿。",
    enabled: "启用",
    thinkingEnabled: "启用 Thinking",
    thinkingHelp: "允许一般 AI 请求进行推理。表单填充、翻译和固定课程导入仍会关闭 Thinking。",
    imageEnabled: "启用图片理解",
    imageHelp: "允许 AI 处理图片输入。关闭后不会向 AI 提供图片，不影响网站已有图片。",
    apiType: "接口类型",
    baseUrl: "API Base URL",
    model: "全站默认模型",
    fetchModels: "拉取模型",
    chooseModel: "选择已拉取模型",
    timeout: "超时秒数",
    apiKey: "API Key",
    keepKey: "留空则保留当前密钥",
    clearKey: "清除当前 API Key",
    keySet: "当前密钥已设置",
    fixedModel: "固定课程 AI 导入模型（可选）",
    globalModel: "使用全站默认模型",
    saveAi: "保存 AI 配置",
    backupTitle: "网站设置与内容备份",
    backupHelp:
      "导出所有后台内容、上传媒体与系统配置。恢复前系统会自动建立一份快照。",
    exportBackup: "导出完整快照",
    restoreBackup: "恢复备份",
    chooseBackup: "选择备份 zip",
    recent: "服务器最近快照",
    noRecent: "暂无服务器快照",
    restoreWarning: "恢复会覆盖当前数据库和 data 内容。",
    restoreConfirm: "恢复会覆盖当前网站内容，确认继续吗？",
    previewTitle: "公开网站设置预览",
    previewHelp: "预览不包含 AI 密钥、接口地址、备份或内部申请规则。",
    close: "关闭",
    learnMore: "了解更多",
    noAnnouncement: "公告栏当前关闭",
  },
  en: {
    title: "System Settings",
    subtitle:
      "Manage public website content and operational tools in one workspace. Save public changes as a draft, preview, then publish.",
    panels: {
      brand: ["Branding & Header", "Logo, site name, and header actions"],
      announcement: [
        "Announcement",
        "Chinese, English, and French announcement",
      ],
      footer: ["Footer Content", "Description, newsletter, and copyright"],
      contact: ["Contact & Social", "Public contact details and social links"],
      studio: ["Studio Resources", "Manage locations, rooms, and rentals"],
      policy: [
        "School Policies & Refunds",
        "Manage public policies in three languages",
      ],
      profile: ["My Profile", "Nickname, phone, password, and faculty profile"],
      accounts: [
        "Account Management",
        "Teacher accounts, permissions, and status",
      ],
      email: ["Email & Request Rules", "Sender and rental request limits"],
      ai: ["AI Connection", "Models, endpoint, and feature settings"],
      backup: ["Backup & Restore", "Export or restore all website content"],
    },
    public: "Public website",
    organization: "School & resources",
    accountAccess: "Accounts & access",
    system: "System tools",
    draft: "Unpublished changes",
    published: "Draft matches live site",
    lastPublished: "Last published",
    never: "Never",
    saveDraft: "Save draft",
    preview: "Preview",
    publish: "Publish to site",
    saved: "Draft saved",
    publishedDone: "Settings published",
    aiSaved: "AI settings saved and active",
    loading: "Loading system settings...",
    editLanguage: "Editing language",
    siteName: "Site name",
    logo: "Website logo",
    uploadLogo: "Upload logo",
    ctaLabel: "Header button text",
    ctaHref: "Header button link",
    adminLogin: "Show admin login entry",
    announcementEnabled: "Enable announcement",
    announcementText: "Announcement text",
    announcementHref: "Announcement link (optional)",
    footerDescription: "Footer description",
    footerTitle: "Footer right title",
    footerText: "Footer right text",
    copyright: "Copyright text",
    privacy: "Privacy policy link",
    contactEmail: "Public contact email",
    phone: "Public phone",
    address: "Public address",
    rednote: "RedNote",
    sender: "Public sender email",
    limit: "Maximum requests per contact",
    limitHelp:
      "0 means unlimited. This rule applies to public classroom rental requests.",
    smtpHelp:
      "This sets the visible From address. Actual delivery still requires server SMTP configuration.",
    aiTitle: "AI API Connection",
    aiHelp:
      "AI settings are saved separately and take effect immediately. They are never included in public previews.",
    enabled: "Enabled",
    thinkingEnabled: "Enable Thinking",
    thinkingHelp: "Allow reasoning for general AI requests. Form filling, translation, and fixed-course import still disable Thinking.",
    imageEnabled: "Enable image understanding",
    imageHelp: "Allow AI to process image input. When off, images are not sent to AI; existing website images are unaffected.",
    apiType: "API type",
    baseUrl: "API Base URL",
    model: "Global default model",
    fetchModels: "Fetch models",
    chooseModel: "Choose fetched model",
    timeout: "Timeout seconds",
    apiKey: "API Key",
    keepKey: "Leave blank to keep the current key",
    clearKey: "Clear current API key",
    keySet: "A key is currently set",
    fixedModel: "Fixed course import model (optional)",
    globalModel: "Use global default model",
    saveAi: "Save AI settings",
    backupTitle: "Website Settings and Content Backup",
    backupHelp:
      "Export all admin content, uploaded media, and system configuration. A snapshot is created before restore.",
    exportBackup: "Export full snapshot",
    restoreBackup: "Restore backup",
    chooseBackup: "Choose backup zip",
    recent: "Recent server snapshots",
    noRecent: "No server snapshots yet",
    restoreWarning: "Restore overwrites the current database and data content.",
    restoreConfirm: "Restore will overwrite current website content. Continue?",
    previewTitle: "Public settings preview",
    previewHelp:
      "AI keys, endpoints, backups, and internal request rules are never included.",
    close: "Close",
    learnMore: "Learn more",
    noAnnouncement: "Announcement is currently off",
  },
  fr: {
    title: "Paramètres système",
    subtitle:
      "Gérez le contenu public et les outils internes dans un seul espace. Enregistrez un brouillon, prévisualisez, puis publiez.",
    panels: {
      brand: ["Marque et en-tête", "Logo, nom du site et actions"],
      announcement: ["Annonce", "Annonce en chinois, anglais et français"],
      footer: ["Pied de page", "Description, infolettre et copyright"],
      contact: [
        "Contact et réseaux",
        "Coordonnées publiques et réseaux sociaux",
      ],
      studio: ["Ressources du studio", "Gérer les sites, salles et locations"],
      policy: [
        "Règlement et remboursements",
        "Gérer les politiques publiques trilingues",
      ],
      profile: ["Mon profil", "Surnom, téléphone, mot de passe et profil"],
      accounts: ["Gestion des comptes", "Comptes, autorisations et statuts"],
      email: ["Courriel et demandes", "Expéditeur et limites de location"],
      ai: ["Connexion IA", "Modèles, point d'accès et fonctions"],
      backup: ["Sauvegarde", "Exporter ou restaurer le contenu"],
    },
    public: "Site public",
    organization: "École et ressources",
    accountAccess: "Comptes et accès",
    system: "Outils système",
    draft: "Modifications non publiées",
    published: "Le brouillon correspond au site",
    lastPublished: "Dernière publication",
    never: "Jamais",
    saveDraft: "Enregistrer le brouillon",
    preview: "Prévisualiser",
    publish: "Publier sur le site",
    saved: "Brouillon enregistré",
    publishedDone: "Paramètres publiés",
    aiSaved: "Configuration IA enregistrée et active",
    loading: "Chargement des paramètres...",
    editLanguage: "Langue modifiée",
    siteName: "Nom du site",
    logo: "Logo du site",
    uploadLogo: "Téléverser le logo",
    ctaLabel: "Texte du bouton d'en-tête",
    ctaHref: "Lien du bouton d'en-tête",
    adminLogin: "Afficher l'accès administrateur",
    announcementEnabled: "Activer l'annonce",
    announcementText: "Texte de l'annonce",
    announcementHref: "Lien de l'annonce (facultatif)",
    footerDescription: "Description du pied de page",
    footerTitle: "Titre droit du pied de page",
    footerText: "Texte droit du pied de page",
    copyright: "Texte de copyright",
    privacy: "Lien de confidentialité",
    contactEmail: "Courriel public",
    phone: "Téléphone public",
    address: "Adresse publique",
    rednote: "RedNote",
    sender: "Courriel expéditeur",
    limit: "Demandes maximales par contact",
    limitHelp:
      "0 signifie illimité. Cette règle concerne les demandes publiques de location.",
    smtpHelp:
      "Ce champ définit l'expéditeur visible. L'envoi exige toujours la configuration SMTP du serveur.",
    aiTitle: "Connexion API IA",
    aiHelp:
      "La configuration IA est enregistrée séparément et prend effet immédiatement. Elle n'apparaît jamais dans l'aperçu public.",
    enabled: "Activée",
    thinkingEnabled: "Activer Thinking",
    thinkingHelp: "Autorise le raisonnement pour les demandes IA générales. Le remplissage de formulaires, la traduction et l'import de cours fixes le désactivent toujours.",
    imageEnabled: "Activer la compréhension d'images",
    imageHelp: "Autorise l'IA à traiter des images. Si désactivé, aucune image n'est transmise à l'IA; les images du site restent intactes.",
    apiType: "Type d'API",
    baseUrl: "API Base URL",
    model: "Modèle global",
    fetchModels: "Charger les modèles",
    chooseModel: "Choisir un modèle",
    timeout: "Délai en secondes",
    apiKey: "API Key",
    keepKey: "Laissez vide pour conserver la clé",
    clearKey: "Effacer la clé actuelle",
    keySet: "Une clé est configurée",
    fixedModel: "Modèle d'import de cours fixes (facultatif)",
    globalModel: "Utiliser le modèle global",
    saveAi: "Enregistrer l'IA",
    backupTitle: "Sauvegarde du site",
    backupHelp:
      "Exportez le contenu administrable, les médias et la configuration. Un instantané est créé avant restauration.",
    exportBackup: "Exporter l'instantané",
    restoreBackup: "Restaurer",
    chooseBackup: "Choisir un zip",
    recent: "Instantanés récents",
    noRecent: "Aucun instantané",
    restoreWarning:
      "La restauration remplace la base et le contenu data actuels.",
    restoreConfirm: "La restauration remplacera le contenu actuel. Continuer ?",
    previewTitle: "Aperçu des paramètres publics",
    previewHelp:
      "Les clés IA, points d'accès, sauvegardes et règles internes ne sont jamais affichés.",
    close: "Fermer",
    learnMore: "En savoir plus",
    noAnnouncement: "L'annonce est désactivée",
  },
} as const;

const panelIcons = {
  brand: PanelTop,
  announcement: Megaphone,
  footer: PanelTop,
  contact: Contact,
  studio: Building2,
  policy: ShieldCheck,
  profile: Contact,
  accounts: ShieldCheck,
  email: Mail,
  ai: Bot,
  backup: ServerCog,
};
const publicPanels: PanelId[] = ["brand", "announcement", "footer", "contact"];
const publicPanelAiFields: Partial<
  Record<PanelId, Array<keyof SystemSettings>>
> = {
  brand: ["site_name", "header_cta_label"],
  announcement: ["announcement_text"],
  footer: [
    "footer_description",
    "footer_newsletter_title",
    "footer_newsletter_text",
    "copyright_text",
  ],
  contact: ["contact_address"],
};
const publicSectionAiCopy = {
  zh: {
    title: "AI 翻译当前区块",
    description:
      "只读取当前区块的中文文字，并生成 English 和 Français；不会修改其他区块、链接、媒体或开关。",
    generated: "当前区块的英文和法文草稿已生成。",
    applied: "英文和法文已应用到当前区块，请检查后保存草稿。",
  },
  en: {
    title: "AI translate this section",
    description:
      "Uses only this section’s Chinese copy to generate English and French. Other sections, links, media, and switches are unchanged.",
    generated: "English and French drafts for this section are ready.",
    applied: "English and French were applied to this section. Review and save the draft.",
  },
  fr: {
    title: "Traduire cette section avec l’IA",
    description:
      "Utilise uniquement le texte chinois de cette section pour générer l’anglais et le français. Les autres sections, liens, médias et options restent inchangés.",
    generated: "Les brouillons anglais et français de cette section sont prêts.",
    applied: "L’anglais et le français ont été appliqués à cette section. Vérifiez puis enregistrez le brouillon.",
  },
} as const;
const panelPermissions: Partial<Record<PanelId, string>> = {
  brand: "system.brand",
  announcement: "system.announcement",
  footer: "system.footer",
  contact: "system.contact",
  studio: "system.studio",
  policy: "system.policy",
  accounts: "system.accounts",
  email: "system.email",
  ai: "system.ai",
  backup: "system.backup",
};

function uiLocale(value: string): keyof typeof copy {
  if (value === "zh" || value === "zh-Hant") return "zh";
  if (value === "fr") return "fr";
  return "en";
}

function backupSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminSettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const requestedPanel = searchParams.get("panel") as PanelId | null;
  const initialRequestedPanel = useRef(requestedPanel);
  const text = copy[uiLocale(locale)];
  const languages = adminContentLanguageOptions(locale);
  const [panel, setPanel] = useState<PanelId>("brand");
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [contentLocale, setContentLocale] = useState<ContentLocale>("zh");
  const [form, setForm] = useState<SystemSettings>(defaults);
  const [aiSettings, setAiSettings] = useState<AiProviderSettings>(defaultAi);
  const [aiForm, setAiForm] = useState<AiProviderSettingsUpdate>({
    enabled: false,
    thinking_enabled: false,
    image_enabled: false,
    provider: "openai_compatible",
    api_base_url: "https://api.openai.com/v1",
    model: "",
    timeout_seconds: 600,
    feature_models: {},
    api_key: "",
    clear_api_key: false,
  });
  const [models, setModels] = useState<string[]>([]);
  const [backupItems, setBackupItems] = useState<BackupInfo[]>([]);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshBackups = useCallback(async () => {
    try {
      setBackupItems((await backupApi.list()).items);
    } catch {
      setBackupItems([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    usersApi
      .me()
      .then((user) => {
        setAccount(user);
        const firstPanel = (
          [
            "brand",
            "announcement",
            "footer",
            "contact",
            "studio",
            "policy",
            "accounts",
            "email",
            "ai",
            "backup",
          ] as PanelId[]
        ).find((id) => hasPermission(user, panelPermissions[id] || "system"));
        const initialPanel = initialRequestedPanel.current;
        const requestedAllowed =
          initialPanel &&
          panelIcons[initialPanel] &&
          (initialPanel === "profile" ||
            hasPermission(user, panelPermissions[initialPanel] || "system"));
        if (requestedAllowed) setPanel(initialPanel);
        else if (firstPanel) setPanel(firstPanel);
        return Promise.all([
          settingsApi.siteDraft(),
          hasPermission(user, "system.ai")
            ? settingsApi.ai()
            : Promise.resolve(defaultAi),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [draft, ai] = result;
        setForm({ ...defaults, ...draft.settings });
        setDirty(draft.is_dirty);
        setPublishedAt(draft.published_at || null);
        setAiSettings({ ...defaultAi, ...ai });
        setAiForm({
          enabled: ai.enabled,
          thinking_enabled: ai.thinking_enabled,
          image_enabled: ai.image_enabled,
          provider: ai.provider,
          api_base_url: ai.api_base_url,
          model: ai.model,
          timeout_seconds: ai.timeout_seconds,
          feature_models: ai.feature_models || {},
          api_key: "",
          clear_api_key: false,
        });
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load settings",
        ),
      )
      .finally(() => setLoading(false));
    usersApi
      .me()
      .then((user) => {
        if (hasPermission(user, "system.backup")) refreshBackups();
      })
      .catch(() => undefined);
  }, [locale, refreshBackups, router]);

  function setField<K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function localized(key: keyof SystemSettings, selected = contentLocale) {
    if (selected === "zh") return String(form[key] ?? "");
    return form.translations?.[selected]?.[String(key)] || "";
  }

  function setLocalized(key: keyof SystemSettings, value: string) {
    if (contentLocale === "zh") {
      setField(key, value as SystemSettings[typeof key]);
      return;
    }
    setForm((current) => ({
      ...current,
      translations: {
        ...(current.translations || {}),
        [contentLocale]: {
          ...(current.translations?.[contentLocale] || {}),
          [String(key)]: value,
        },
      },
    }));
    setDirty(true);
  }

  const aiFieldKeys = publicPanelAiFields[panel] || [];
  const aiFields = Object.fromEntries(
    aiFieldKeys.map((key) => [String(key), localized(key, "zh")]),
  );
  const activePermission = panelPermissions[panel];
  const canManagePanel =
    panel === "profile" ||
    Boolean(
      activePermission && hasPermission(account, activePermission, "manage"),
    );
  const settingsGroups = (
    [
      {
        title: text.public,
        items: ["brand", "announcement", "footer", "contact"],
      },
      { title: text.organization, items: ["studio", "policy"] },
      { title: text.accountAccess, items: ["profile", "accounts"] },
      { title: text.system, items: ["email", "ai", "backup"] },
    ] as { title: string; items: PanelId[] }[]
  )
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (id) =>
          !account ||
          id === "profile" ||
          hasPermission(account, panelPermissions[id] || "system"),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const isPublicSettingsPanel = publicPanels.includes(panel);
  const isEmbeddedPanel = ["studio", "policy", "profile", "accounts"].includes(
    panel,
  );

  function applyAi(
    sourcePanel: PanelId,
    allowedKeys: Array<keyof SystemSettings>,
    drafts: AiDraft[],
  ) {
    const allowed = new Set(allowedKeys.map(String));
    setForm((current) => {
      const next = {
        ...current,
        translations: { ...(current.translations || {}) },
      };
      drafts.forEach((draft) => {
        if (draft.locale !== "en" && draft.locale !== "fr") return;
        const target = draft.locale;
        Object.entries(draft.fields || {}).forEach(([key, value]) => {
          if (!allowed.has(key) || !String(value || "").trim()) return;
          next.translations = {
            ...(next.translations || {}),
            [target]: {
              ...(next.translations?.[target] || {}),
              [key]: String(value),
            },
          };
        });
      });
      return next;
    });
    setDirty(true);
    setMessage(
      `${text.panels[sourcePanel][0]} · ${publicSectionAiCopy[uiLocale(locale)].applied}`,
    );
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setField("logo_url", (await uploadApi.image(file, "settings")).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await settingsApi.saveSiteDraft(form);
      setForm({ ...defaults, ...result.settings });
      setDirty(result.is_dirty);
      setPublishedAt(result.published_at || null);
      setMessage(text.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await settingsApi.saveSiteDraft(form);
      const result = await settingsApi.publishSite();
      setForm({ ...defaults, ...result.settings });
      setDirty(false);
      setPublishedAt(result.published_at || null);
      setMessage(text.publishedDone);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to publish settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAi() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...aiForm,
        timeout_seconds: Math.max(
          5,
          Math.min(900, Number(aiForm.timeout_seconds) || 600),
        ),
      };
      if (!payload.api_key?.trim()) delete payload.api_key;
      const saved = await settingsApi.updateAi(payload);
      setAiSettings(saved);
      setAiForm({
        enabled: saved.enabled,
        thinking_enabled: saved.thinking_enabled,
        image_enabled: saved.image_enabled,
        provider: saved.provider,
        api_base_url: saved.api_base_url,
        model: saved.model,
        timeout_seconds: saved.timeout_seconds,
        feature_models: saved.feature_models || {},
        api_key: "",
        clear_api_key: false,
      });
      setMessage(text.aiSaved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save AI settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function fetchModels() {
    setFetchingModels(true);
    setError("");
    try {
      const result = await settingsApi.testAiModels({
        api_base_url: aiForm.api_base_url,
        api_key: aiForm.api_key || undefined,
      });
      setModels(result.models);
      if (!result.models.length) setError("No models returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch models");
    } finally {
      setFetchingModels(false);
    }
  }

  async function exportBackup() {
    setBackupLoading(true);
    setError("");
    try {
      const filename = await backupApi.exportSnapshot();
      setMessage(filename);
      await refreshBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backup failed");
    } finally {
      setBackupLoading(false);
    }
  }

  async function restoreBackup() {
    if (!backupFile) {
      setError(text.chooseBackup);
      return;
    }
    if (!window.confirm(text.restoreConfirm)) return;
    setBackupLoading(true);
    setError("");
    try {
      const result = await backupApi.restore(backupFile);
      setMessage(`${result.message} · ${result.restored_files}`);
      setBackupFile(null);
      await refreshBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBackupLoading(false);
    }
  }

  const InputField = ({
    label,
    field,
    localizedField = false,
    type = "text",
  }: {
    label: string;
    field: keyof SystemSettings;
    localizedField?: boolean;
    type?: string;
  }) => (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input
        type={type}
        value={localizedField ? localized(field) : String(form[field] ?? "")}
        onChange={(event) =>
          localizedField
            ? setLocalized(field, event.target.value)
            : setField(
                field,
                event.target.value as SystemSettings[typeof field],
              )
        }
      />
    </label>
  );

  function publicEditor() {
    if (panel === "brand")
      return (
        <Card>
          <CardHeader>
            <CardTitle>{text.panels.brand[0]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <InputField
              label={text.siteName}
              field="site_name"
              localizedField
            />
            <div className="space-y-2">
              <span className="text-sm font-medium">{text.logo}</span>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border bg-slate-50">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImagePlus className="text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Button asChild variant="outline" disabled={uploading}>
                    <label>
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-2 h-4 w-4" />
                      )}
                      {text.uploadLogo}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={uploadLogo}
                      />
                    </label>
                  </Button>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setField("logo_url", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <InputField
              label={text.ctaLabel}
              field="header_cta_label"
              localizedField
            />
            <InputField label={text.ctaHref} field="header_cta_href" />
            <label className="flex items-center justify-between border p-4 lg:col-span-2">
              <span className="text-sm font-medium">{text.adminLogin}</span>
              <Switch
                checked={form.show_admin_login}
                onCheckedChange={(checked) =>
                  setField("show_admin_login", checked)
                }
              />
            </label>
          </CardContent>
        </Card>
      );
    if (panel === "announcement")
      return (
        <Card>
          <CardHeader>
            <CardTitle>{text.panels.announcement[0]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-center justify-between border p-4">
              <span className="text-sm font-medium">
                {text.announcementEnabled}
              </span>
              <Switch
                checked={form.announcement_enabled}
                onCheckedChange={(checked) =>
                  setField("announcement_enabled", checked)
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                {text.announcementText}
              </span>
              <Textarea
                rows={5}
                value={localized("announcement_text")}
                onChange={(e) =>
                  setLocalized("announcement_text", e.target.value)
                }
              />
            </label>
            <InputField
              label={text.announcementHref}
              field="announcement_href"
            />
          </CardContent>
        </Card>
      );
    if (panel === "footer")
      return (
        <Card>
          <CardHeader>
            <CardTitle>{text.panels.footer[0]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-sm font-medium">
                {text.footerDescription}
              </span>
              <Textarea
                rows={4}
                value={localized("footer_description")}
                onChange={(e) =>
                  setLocalized("footer_description", e.target.value)
                }
              />
            </label>
            <InputField
              label={text.footerTitle}
              field="footer_newsletter_title"
              localizedField
            />
            <InputField label={text.privacy} field="privacy_href" />
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-sm font-medium">{text.footerText}</span>
              <Textarea
                rows={3}
                value={localized("footer_newsletter_text")}
                onChange={(e) =>
                  setLocalized("footer_newsletter_text", e.target.value)
                }
              />
            </label>
            <InputField
              label={text.copyright}
              field="copyright_text"
              localizedField
            />
          </CardContent>
        </Card>
      );
    return (
      <Card>
        <CardHeader>
          <CardTitle>{text.panels.contact[0]}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <InputField
            label={text.contactEmail}
            field="contact_email"
            type="email"
          />
          <InputField label={text.phone} field="contact_phone" />
          <label className="space-y-1.5 lg:col-span-2">
            <span className="text-sm font-medium">{text.address}</span>
            <Textarea
              rows={3}
              value={localized("contact_address")}
              onChange={(e) => setLocalized("contact_address", e.target.value)}
            />
          </label>
          <InputField label="YouTube" field="youtube_url" />
          <InputField label={text.rednote} field="xiaohongshu_url" />
          <InputField label="Instagram" field="instagram_url" />
          <InputField label="Facebook" field="facebook_url" />
          <InputField label="TikTok" field="tiktok_url" />
        </CardContent>
      </Card>
    );
  }

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
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {text.subtitle}
            </p>
            {isPublicSettingsPanel && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className={dirty ? "text-amber-700" : "text-emerald-700"}>
                  {dirty ? text.draft : text.published}
                </span>{" "}
                · {text.lastPublished}:{" "}
                {publishedAt
                  ? new Date(publishedAt).toLocaleString(locale)
                  : text.never}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublicSettingsPanel && (
              <Button variant="outline" onClick={() => setPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                {text.preview}
              </Button>
            )}
            {isPublicSettingsPanel && canManagePanel && (
              <>
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving || uploading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {text.saveDraft}
                </Button>
                <Button onClick={publish} disabled={saving || uploading}>
                  <Send className="mr-2 h-4 w-4" />
                  {text.publish}
                </Button>
              </>
            )}
          </div>
        </div>
        {(error || message) && (
          <div
            className={cn(
              "border px-3 py-2 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {error || message}
          </div>
        )}
        <div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="self-start xl:sticky xl:top-24">
            <div className="overflow-hidden border border-purple-100 bg-white shadow-sm">
              <div className="border-b border-purple-100 bg-purple-950 px-5 py-5 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center bg-white/10">
                    <Settings className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{text.title}</h2>
                    <p className="mt-0.5 text-xs text-white/65">
                      {settingsGroups.reduce(
                        (count, group) => count + group.items.length,
                        0,
                      )}{" "}
                      sections
                    </p>
                  </div>
                </div>
              </div>
              <nav className="space-y-5 p-3" aria-label={text.title}>
                {settingsGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase text-muted-foreground">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((id) => {
                        const Icon = panelIcons[id];
                        const detail = text.panels[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setPanel(id);
                              window.history.replaceState(
                                null,
                                "",
                                `/${locale}/admin/settings?panel=${id}`,
                              );
                              setError("");
                              setMessage("");
                            }}
                            className={cn(
                              "group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors",
                              panel === id
                                ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-950"
                                : "border-transparent text-slate-650 hover:border-purple-200 hover:bg-slate-50",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center transition-colors",
                                panel === id
                                  ? "bg-fuchsia-100 text-fuchsia-800"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-800",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block text-sm">
                                {detail[0]}
                              </strong>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {detail[1]}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>
          <fieldset
            disabled={!canManagePanel}
            className="min-w-0 space-y-4 disabled:opacity-80"
          >
            {loading && !isEmbeddedPanel && (
              <div className="flex min-h-64 items-center justify-center border bg-white text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {text.loading}
              </div>
            )}
            {panel === "studio" && <StudioResourcesWorkspaceContent embedded />}
            {panel === "policy" && <SchoolPolicyWorkspaceContent embedded />}
            {panel === "profile" && <ProfileWorkspaceContent embedded />}
            {panel === "accounts" && <AccountsWorkspaceContent embedded />}
            {!loading && publicPanels.includes(panel) && (
              <>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-2 py-4">
                    <span className="mr-2 text-sm font-medium">
                      {text.editLanguage}
                    </span>
                    {languages.map((item) => (
                      <Button
                        key={item.value}
                        size="sm"
                        variant={
                          contentLocale === item.value ? "default" : "outline"
                        }
                        onClick={() =>
                          setContentLocale(item.value as ContentLocale)
                        }
                      >
                        {item.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
                {Object.keys(aiFields).length > 0 && (
                  <AiLocaleSyncPanel
                    key={`settings-ai-${panel}`}
                    module="settings"
                    sourceLocale="zh"
                    targetLocales={["en", "fr"]}
                    uiLocale={locale}
                    fields={aiFields}
                    onApply={(drafts) => applyAi(panel, aiFieldKeys, drafts)}
                    title={publicSectionAiCopy[uiLocale(locale)].title}
                    description={publicSectionAiCopy[uiLocale(locale)].description}
                    labels={{
                      generated:
                        publicSectionAiCopy[uiLocale(locale)].generated,
                      applied: publicSectionAiCopy[uiLocale(locale)].applied,
                    }}
                    compact
                  />
                )}
                {publicEditor()}
              </>
            )}
            {!loading && panel === "email" && (
              <Card>
                <CardHeader>
                  <CardTitle>{text.panels.email[0]}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <InputField
                    label={text.sender}
                    field="outbound_email"
                    type="email"
                  />
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">{text.limit}</span>
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={form.classroom_request_limit_per_contact}
                      onChange={(e) =>
                        setField(
                          "classroom_request_limit_per_contact",
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                    <span className="block text-xs text-muted-foreground">
                      {text.limitHelp}
                    </span>
                  </label>
                  <div className="flex gap-2 border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900 lg:col-span-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{text.smtpHelp}</p>
                  </div>
                  <div className="lg:col-span-2">
                    <Button onClick={saveDraft}>
                      <Save className="mr-2 h-4 w-4" />
                      {text.saveDraft}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {!loading && panel === "ai" && (
              <Card>
                <CardHeader>
                  <CardTitle>{text.aiTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">{text.aiHelp}</p>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="flex items-center justify-between border p-4 lg:col-span-2">
                    <span className="font-medium">{text.enabled}</span>
                    <Switch
                      checked={aiForm.enabled}
                      onCheckedChange={(checked) =>
                        setAiForm((current) => ({
                          ...current,
                          enabled: checked,
                        }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 lg:col-span-2 lg:grid-cols-2">
                    <label className="flex min-h-24 items-start justify-between gap-4 border p-4">
                      <span className="space-y-1">
                        <span className="block font-medium">
                          {text.thinkingEnabled}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {text.thinkingHelp}
                        </span>
                      </span>
                      <Switch
                        className="mt-0.5 shrink-0"
                        checked={aiForm.thinking_enabled}
                        onCheckedChange={(checked) =>
                          setAiForm((current) => ({
                            ...current,
                            thinking_enabled: checked,
                          }))
                        }
                      />
                    </label>
                    <label className="flex min-h-24 items-start justify-between gap-4 border p-4">
                      <span className="space-y-1">
                        <span className="block font-medium">
                          {text.imageEnabled}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {text.imageHelp}
                        </span>
                      </span>
                      <Switch
                        className="mt-0.5 shrink-0"
                        checked={aiForm.image_enabled}
                        onCheckedChange={(checked) =>
                          setAiForm((current) => ({
                            ...current,
                            image_enabled: checked,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">{text.apiType}</span>
                    <select
                      className="h-10 w-full border bg-background px-3 text-sm"
                      value={aiForm.provider}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          provider: e.target.value,
                        }))
                      }
                    >
                      <option value="openai_compatible">
                        OpenAI Compatible
                      </option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">{text.timeout}</span>
                    <Input
                      type="number"
                      min={5}
                      max={900}
                      value={aiForm.timeout_seconds}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          timeout_seconds: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 lg:col-span-2">
                    <span className="text-sm font-medium">{text.baseUrl}</span>
                    <div className="flex gap-2">
                      <Input
                        value={aiForm.api_base_url}
                        onChange={(e) =>
                          setAiForm((current) => ({
                            ...current,
                            api_base_url: e.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={fetchModels}
                        disabled={fetchingModels}
                      >
                        {fetchingModels ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CloudDownload className="mr-2 h-4 w-4" />
                        )}
                        {text.fetchModels}
                      </Button>
                    </div>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">{text.model}</span>
                    <Input
                      value={aiForm.model}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          model: e.target.value,
                        }))
                      }
                    />
                  </label>
                  {models.length > 0 && (
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium">
                        {text.chooseModel}
                      </span>
                      <select
                        className="h-10 w-full border bg-background px-3 text-sm"
                        value={aiForm.model}
                        onChange={(e) =>
                          setAiForm((current) => ({
                            ...current,
                            model: e.target.value,
                          }))
                        }
                      >
                        <option value="">--</option>
                        {models.map((model) => (
                          <option key={model}>{model}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">{text.apiKey}</span>
                    <Input
                      type="password"
                      value={aiForm.api_key || ""}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          api_key: e.target.value,
                        }))
                      }
                      placeholder={text.keepKey}
                    />
                    <span className="text-xs text-muted-foreground">
                      {aiSettings.api_key_set
                        ? `${text.keySet} ${aiSettings.api_key_masked}`
                        : text.keepKey}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 pt-7">
                    <input
                      type="checkbox"
                      checked={Boolean(aiForm.clear_api_key)}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          clear_api_key: e.target.checked,
                        }))
                      }
                    />{" "}
                    <span className="text-sm">{text.clearKey}</span>
                  </label>
                  <label className="space-y-1.5 lg:col-span-2">
                    <span className="text-sm font-medium">
                      {text.fixedModel}
                    </span>
                    <select
                      className="h-10 w-full border bg-background px-3 text-sm"
                      value={aiForm.feature_models?.fixed_course_import || ""}
                      onChange={(e) =>
                        setAiForm((current) => ({
                          ...current,
                          feature_models: {
                            ...(current.feature_models || {}),
                            fixed_course_import: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">{text.globalModel}</option>
                      {models.map((model) => (
                        <option key={model}>{model}</option>
                      ))}
                    </select>
                  </label>
                  <div className="lg:col-span-2">
                    <Button onClick={saveAi} disabled={saving}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {text.saveAi}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {!loading && panel === "backup" && (
              <Card>
                <CardHeader>
                  <CardTitle>{text.backupTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {text.backupHelp}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border p-4">
                      <h3 className="font-semibold">{text.exportBackup}</h3>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={exportBackup}
                        disabled={backupLoading}
                      >
                        <CloudDownload className="mr-2 h-4 w-4" />
                        {text.exportBackup}
                      </Button>
                    </div>
                    <div className="border border-amber-200 bg-amber-50 p-4">
                      <h3 className="font-semibold text-amber-950">
                        {text.restoreBackup}
                      </h3>
                      <p className="mt-1 text-xs text-amber-800">
                        {text.restoreWarning}
                      </p>
                      <Input
                        className="mt-3 bg-white"
                        type="file"
                        accept=".zip,application/zip"
                        onChange={(e) =>
                          setBackupFile(e.target.files?.[0] || null)
                        }
                      />
                      <Button
                        className="mt-3"
                        variant="destructive"
                        onClick={restoreBackup}
                        disabled={backupLoading || !backupFile}
                      >
                        {text.restoreBackup}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      {text.recent}
                    </h3>
                    {backupItems.length ? (
                      <div className="divide-y border">
                        {backupItems.slice(0, 6).map((item) => (
                          <div
                            key={item.filename}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                          >
                            <span className="truncate font-medium">
                              {item.filename}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              V{item.format_version}
                              {item.app_version ? ` · App ${item.app_version}` : ""}
                              {item.schema_revision ? ` · DB ${item.schema_revision}` : ""}
                              {" · "}{backupSize(item.size)} ·{" "}
                              {new Date(item.created_at).toLocaleString(locale)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {text.noRecent}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </fieldset>
        </div>
      </main>
      {preview && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/70 p-3 sm:p-6">
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-white">
              <div>
                <strong>{text.previewTitle}</strong>
                <p className="text-xs text-white/70">{text.previewHelp}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={device === "desktop" ? "default" : "secondary"}
                  onClick={() => setDevice("desktop")}
                >
                  <Laptop className="mr-2 h-4 w-4" />
                  Desktop
                </Button>
                <Button
                  variant={device === "mobile" ? "default" : "secondary"}
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile
                </Button>
                <Button variant="secondary" onClick={() => setPreview(false)}>
                  {text.close}
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "mx-auto min-h-[620px] overflow-hidden bg-white shadow-2xl transition-all",
                device === "mobile" ? "w-[390px] max-w-full" : "w-full",
              )}
            >
              {form.announcement_enabled ? (
                <div className="bg-fuchsia-950 px-5 py-2 text-center text-sm text-white">
                  {localized("announcement_text")}{" "}
                  {form.announcement_href && (
                    <span className="ml-2 underline">{text.learnMore}</span>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 px-4 py-2 text-center text-xs text-slate-500">
                  {text.noAnnouncement}
                </div>
              )}
              <header className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  {form.logo_url && (
                    <img
                      src={form.logo_url}
                      alt=""
                      className="h-12 w-12 object-contain"
                    />
                  )}
                  <strong>{localized("site_name")}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "hidden text-sm text-slate-500",
                      device === "desktop" && "inline",
                    )}
                  >
                    Programs · Performances · News
                  </span>
                  <span className="bg-fuchsia-800 px-4 py-2 text-sm text-white">
                    {localized("header_cta_label")}
                  </span>
                </div>
              </header>
              <div className="flex min-h-[390px] items-center justify-center bg-[#f6f5f7] p-8 text-center">
                <div>
                  <p className="text-xs uppercase text-fuchsia-800">
                    Mulan Dance Studio
                  </p>
                  <h2 className="mt-3 text-4xl font-semibold">
                    {localized("site_name")}
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-slate-600">
                    {localized("footer_description")}
                  </p>
                </div>
              </div>
              <footer
                className={cn(
                  "grid gap-8 bg-slate-950 p-7 text-white",
                  device === "desktop" && "grid-cols-3",
                )}
              >
                <div>
                  <strong>{localized("site_name")}</strong>
                  <p className="mt-3 text-sm text-white/65">
                    {localized("footer_description")}
                  </p>
                </div>
                <div>
                  <strong>{localized("footer_newsletter_title")}</strong>
                  <p className="mt-3 text-sm text-white/65">
                    {localized("footer_newsletter_text")}
                  </p>
                </div>
                <div>
                  <strong>{text.panels.contact[0]}</strong>
                  <p className="mt-3 text-sm text-white/65">
                    {form.contact_email}
                    <br />
                    {form.contact_phone}
                    <br />
                    {localized("contact_address")}
                  </p>
                </div>
                <p className="text-xs text-white/50">
                  {localized("copyright_text")}
                </p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
