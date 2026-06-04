'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type AiProviderSettings,
  type AiProviderSettingsUpdate,
  type SystemSettings,
  type BackupInfo,
  backupApi,
  isAuthenticated,
  settingsApi,
  uploadApi,
} from '@/lib/api';
import { adminContentLanguageOptions, adminUiText } from '@/lib/admin-i18n';
import { cn } from '@/lib/utils';
import { Download, ImagePlus, KeyRound, Loader2, Mail, Save, Settings, Upload } from 'lucide-react';

const defaultSettings: SystemSettings = {
  site_name: 'Mulan Dance Studio',
  logo_url: '/logo.png',
  header_cta_label: 'Register',
  header_cta_href: '/classes/register',
  show_admin_login: true,
  announcement_enabled: false,
  announcement_text: '',
  announcement_href: '',
  footer_description: '',
  footer_newsletter_title: 'Join Us',
  footer_newsletter_text: '',
  copyright_text: 'All rights reserved.',
  privacy_href: '/privacy',
  contact_email: 'info@mulandance.com',
  contact_phone: '3437771766',
  contact_address: '',
  outbound_email: '',
  classroom_request_limit_per_contact: 0,
  program_pricing_json: '',
  classroom_pricing_json: '',
  youtube_url: 'https://www.youtube.com/@mulandancestudio21',
  xiaohongshu_url: 'https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

type ContentLocale = 'zh' | 'en' | 'fr';

const defaultAiSettings: AiProviderSettings = {
  enabled: false,
  provider: 'openai_compatible',
  api_base_url: 'https://api.openai.com/v1',
  model: '',
  timeout_seconds: 600,
  api_key_set: false,
  api_key_masked: '',
};

type AiForm = AiProviderSettingsUpdate;

function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-sm font-medium transition-colors',
        checked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      <span className={cn('relative inline-flex h-4 w-7 rounded-full', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[14px]' : 'translate-x-0.5')} />
      </span>
      {label}
    </button>
  );
}

function formatBackupSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatBackupTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = adminUiText(locale);
  const aiText = locale.startsWith('zh')
    ? {
        title: 'AI API 接入',
        subtitle: '用于新闻、演出和系统内容的中英法草稿生成。保存后立即生效。',
        enabled: '启用 AI',
        disabled: '关闭 AI',
        provider: '接口类型',
        baseUrl: 'API Base URL',
        model: '模型',
        timeout: '超时秒数',
        apiKey: 'API Key',
        apiKeyPlaceholder: '留空则保留当前密钥',
        keySet: '已设置',
        keyNotSet: '未设置',
        clearKey: '清空当前 API Key',
        help: '兼容 OpenAI /chat/completions 的服务都可以接入，例如 OpenAI 或其它兼容网关。',
      }
    : locale.startsWith('fr')
      ? {
          title: 'Connexion API IA',
          subtitle: 'Utilisee pour generer des brouillons chinois, anglais et francais.',
          enabled: 'IA activee',
          disabled: 'IA desactivee',
          provider: "Type d'API",
          baseUrl: 'API Base URL',
          model: 'Modele',
          timeout: 'Delai en secondes',
          apiKey: 'API Key',
          apiKeyPlaceholder: 'Laisser vide pour garder la cle actuelle',
          keySet: 'Configuree',
          keyNotSet: 'Non configuree',
          clearKey: 'Effacer la cle API actuelle',
          help: 'Toute API compatible OpenAI /chat/completions peut etre utilisee.',
        }
      : {
          title: 'AI API Connection',
          subtitle: 'Used to generate Chinese, English, and French drafts for CMS content.',
          enabled: 'AI enabled',
          disabled: 'AI disabled',
          provider: 'API type',
          baseUrl: 'API Base URL',
          model: 'Model',
          timeout: 'Timeout seconds',
          apiKey: 'API Key',
          apiKeyPlaceholder: 'Leave blank to keep current key',
          keySet: 'Set',
          keyNotSet: 'Not set',
          clearKey: 'Clear current API key',
          help: 'Any OpenAI-compatible /chat/completions API can be used.',
        };
  const backupText = locale.startsWith('zh')
    ? {
        title: '网站设置与内容备份',
        subtitle: '导出所有后台编辑内容：网站设置、首页、文章、演出、课程、排课、教师、教室、价格、政策页面、用户/权限、上传图片视频和系统配置。代码更新或 Docker 重新部署前先导出一份快照。',
        export: '导出完整快照',
        restore: '恢复备份',
        choose: '选择备份 zip',
        noFile: '请先选择一个备份 zip 文件。',
        warning: '恢复会覆盖当前数据库和 data 内容。系统会先自动创建一份恢复前快照。',
        confirm: '恢复会覆盖当前网站内容。系统会先自动创建恢复前快照，确认继续吗？',
        exportDone: '已生成并下载备份：',
        restoreDone: '恢复完成。',
        preRestore: '恢复前快照',
        restoredFiles: '恢复文件数',
        recent: '服务器本地快照',
        noRecent: '还没有服务器本地快照。',
        superAdminOnly: '仅超级管理员可以导出或恢复完整内容。',
      }
    : locale.startsWith('fr')
      ? {
          title: 'Parametres et sauvegarde du site',
          subtitle: 'Exporte tout le contenu modifiable: parametres, accueil, articles, spectacles, programmes, horaires, enseignants, salles, tarifs, politiques, utilisateurs, medias et configuration.',
          export: 'Exporter un instantane complet',
          restore: 'Restaurer la sauvegarde',
          choose: 'Choisir un zip',
          noFile: 'Choisissez d’abord un fichier zip de sauvegarde.',
          warning: 'La restauration remplace la base de donnees et le dossier data actuels. Un instantane avant restauration sera cree.',
          confirm: 'La restauration remplacera le contenu actuel. Continuer ?',
          exportDone: 'Sauvegarde telechargee :',
          restoreDone: 'Restauration terminee.',
          preRestore: 'Instantane avant restauration',
          restoredFiles: 'Fichiers restaures',
          recent: 'Instantanes locaux du serveur',
          noRecent: 'Aucun instantane local pour le moment.',
          superAdminOnly: 'Seul le super administrateur peut exporter ou restaurer tout le contenu.',
        }
      : {
          title: 'Website Settings and Content Backup',
          subtitle: 'Export all admin-edited content: website settings, homepage, articles, performances, programs, schedules, faculty, classrooms, pricing, policies, users/roles, uploaded media, and system configuration before code or Docker updates.',
          export: 'Export Full Snapshot',
          restore: 'Restore Backup',
          choose: 'Choose backup zip',
          noFile: 'Choose a backup zip file first.',
          warning: 'Restore overwrites the current database and data folder. A pre-restore snapshot is created first.',
          confirm: 'Restore will overwrite the current website content. A pre-restore snapshot will be created first. Continue?',
          exportDone: 'Backup downloaded:',
          restoreDone: 'Restore complete.',
          preRestore: 'Pre-restore snapshot',
          restoredFiles: 'Restored files',
          recent: 'Server Local Snapshots',
          noRecent: 'No server local snapshots yet.',
          superAdminOnly: 'Only the super administrator can export or restore full content.',
        };
  const policyLocaleOptions = adminContentLanguageOptions(locale);
  const [form, setForm] = useState<SystemSettings>(defaultSettings);
  const [aiSettings, setAiSettings] = useState<AiProviderSettings>(defaultAiSettings);
  const [aiForm, setAiForm] = useState<AiForm>({
    enabled: false,
    provider: 'openai_compatible',
    api_base_url: 'https://api.openai.com/v1',
    model: '',
    timeout_seconds: 600,
    api_key: '',
    clear_api_key: false,
  });
  const [contentLocale, setContentLocale] = useState<ContentLocale>('zh');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupItems, setBackupItems] = useState<BackupInfo[]>([]);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshBackupList = useCallback(async () => {
    try {
      const data = await backupApi.list();
      setBackupItems(data.items);
    } catch {
      setBackupItems([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    Promise.all([settingsApi.siteAll(), settingsApi.ai()])
      .then(([settings, ai]) => {
        setForm({ ...defaultSettings, ...settings });
        setAiSettings({ ...defaultAiSettings, ...ai });
        setAiForm({
          enabled: ai.enabled,
          provider: ai.provider,
          api_base_url: ai.api_base_url,
          model: ai.model,
          timeout_seconds: ai.timeout_seconds,
          api_key: '',
          clear_api_key: false,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : labels.settings.loadFailed))
      .finally(() => setLoading(false));
    refreshBackupList();
  }, [router, locale, labels.settings.loadFailed, refreshBackupList]);

  function setField<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setAiField<K extends keyof AiForm>(key: K, value: AiForm[K]) {
    setAiForm((current) => ({ ...current, [key]: value }));
  }

  function localizedField(key: keyof SystemSettings) {
    if (contentLocale === 'zh') return String(form[key] ?? '');
    return form.translations?.[contentLocale]?.[String(key)] ?? '';
  }

  function setLocalizedField(key: keyof SystemSettings, value: string) {
    if (contentLocale === 'zh') {
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
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadApi.image(file);
      setField('logo_url', uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.uploadFailed);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function exportBackup() {
    setBackupLoading(true);
    setBackupMessage('');
    setBackupError('');

    try {
      const filename = await backupApi.exportSnapshot();
      setBackupMessage(`${backupText.exportDone} ${filename}`);
      await refreshBackupList();
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Backup export failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function restoreBackup() {
    if (!backupFile) {
      setBackupError(backupText.noFile);
      return;
    }
    if (!window.confirm(backupText.confirm)) return;

    setBackupLoading(true);
    setBackupMessage('');
    setBackupError('');

    try {
      const result = await backupApi.restore(backupFile);
      setBackupMessage(
        `${backupText.restoreDone} ${backupText.preRestore}: ${result.pre_restore_backup}; ${backupText.restoredFiles}: ${result.restored_files}.`
      );
      setBackupFile(null);
      await refreshBackupList();
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Backup restore failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const aiPayload: AiProviderSettingsUpdate = {
        enabled: aiForm.enabled,
        provider: aiForm.provider,
        api_base_url: aiForm.api_base_url,
        model: aiForm.model,
        timeout_seconds: Math.max(5, Math.min(900, Number(aiForm.timeout_seconds) || 600)),
        clear_api_key: aiForm.clear_api_key,
      };
      if (aiForm.api_key?.trim()) {
        aiPayload.api_key = aiForm.api_key.trim();
      }

      const [saved, savedAi] = await Promise.all([
        settingsApi.updateSite(form),
        settingsApi.updateAi(aiPayload),
      ]);
      setForm({ ...defaultSettings, ...saved });
      setAiSettings({ ...defaultAiSettings, ...savedAi });
      setAiForm({
        enabled: savedAi.enabled,
        provider: savedAi.provider,
        api_base_url: savedAi.api_base_url,
        model: savedAi.model,
        timeout_seconds: savedAi.timeout_seconds,
        api_key: '',
        clear_api_key: false,
      });
      setMessage(labels.settings.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={saveSettings} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Settings className="h-6 w-6 text-primary" />
                {labels.settings.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels.settings.subtitle}
              </p>
            </div>
            <Button type="submit" disabled={loading || saving || uploading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {labels.settings.save}
            </Button>
          </div>

          {(error || message) && (
            <div className={cn('rounded-md border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
              {error || message}
            </div>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 py-4">
              <span className="mr-1 text-sm font-medium text-muted-foreground">{labels.common.editingLanguage}</span>
              {policyLocaleOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={contentLocale === option.value ? 'default' : 'outline'}
                  onClick={() => setContentLocale(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.settings.loading}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{labels.settings.brandHeader}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.siteName}</span>
                    <Input value={localizedField('site_name')} onChange={(e) => setLocalizedField('site_name', e.target.value)} />
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Logo</span>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-full border bg-slate-100">
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Logo</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Button asChild type="button" variant="outline" disabled={uploading}>
                          <label className="cursor-pointer">
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                            {labels.common.uploadLogo}
                            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                          </label>
                        </Button>
                        <Input value={form.logo_url} onChange={(e) => setField('logo_url', e.target.value)} placeholder="/logo.png or https://..." />
                      </div>
                    </div>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.headerCtaLabel}</span>
                    <Input value={localizedField('header_cta_label')} onChange={(e) => setLocalizedField('header_cta_label', e.target.value)} placeholder="Register" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.headerCtaHref}</span>
                    <Input value={form.header_cta_href} onChange={(e) => setField('header_cta_href', e.target.value)} placeholder="/classes/register or https://..." />
                  </label>

                  <div className="lg:col-span-2">
                    <Toggle checked={form.show_admin_login} onCheckedChange={(checked) => setField('show_admin_login', checked)} label={form.show_admin_login ? labels.settings.showAdminLogin : labels.settings.hideAdminLogin} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {labels.settings.emailSettings}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.outboundEmail}</span>
                    <Input
                      type="email"
                      value={form.outbound_email}
                      onChange={(e) => setField('outbound_email', e.target.value)}
                      placeholder="noreply@mulandance.com"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.requestLimit}</span>
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={form.classroom_request_limit_per_contact}
                      onChange={(e) =>
                        setField('classroom_request_limit_per_contact', Math.max(0, Number(e.target.value) || 0))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {labels.settings.requestLimitHelp}
                    </span>
                  </label>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                    {labels.settings.smtpHelp}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    {aiText.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{aiText.subtitle}</p>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <Toggle
                      checked={aiForm.enabled}
                      onCheckedChange={(checked) => setAiField('enabled', checked)}
                      label={aiForm.enabled ? aiText.enabled : aiText.disabled}
                    />
                  </div>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{aiText.provider}</span>
                    <Input
                      value={aiForm.provider}
                      onChange={(e) => setAiField('provider', e.target.value)}
                      placeholder="openai_compatible"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{aiText.model}</span>
                    <Input
                      value={aiForm.model}
                      onChange={(e) => setAiField('model', e.target.value)}
                      placeholder="gpt-4o-mini"
                    />
                  </label>

                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{aiText.baseUrl}</span>
                    <Input
                      value={aiForm.api_base_url}
                      onChange={(e) => setAiField('api_base_url', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{aiText.apiKey}</span>
                    <Input
                      type="password"
                      value={aiForm.api_key || ''}
                      onChange={(e) => setAiField('api_key', e.target.value)}
                      placeholder={aiText.apiKeyPlaceholder}
                    />
                    <span className="text-xs text-muted-foreground">
                      {aiSettings.api_key_set ? `${aiText.keySet}: ${aiSettings.api_key_masked}` : aiText.keyNotSet}
                    </span>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{aiText.timeout}</span>
                    <Input
                      type="number"
                      min={5}
                      max={900}
                      value={aiForm.timeout_seconds || ''}
                      onChange={(e) => setAiField('timeout_seconds', e.target.value === '' ? 0 : Math.min(900, Number(e.target.value) || 0))}
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm lg:col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(aiForm.clear_api_key)}
                      onChange={(e) => setAiField('clear_api_key', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {aiText.clearKey}
                  </label>

                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800 lg:col-span-2">
                    {aiText.help}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    {backupText.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{backupText.subtitle}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                    {backupText.warning} {backupText.superAdminOnly}
                  </div>

                  {(backupError || backupMessage) && (
                    <div
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm',
                        backupError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {backupError || backupMessage}
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border bg-background/70 p-4">
                      <h3 className="text-sm font-semibold text-foreground">{backupText.export}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        database.sqlite + all data files: uploads, articles/news markdown, pages, pricing, homepage, performances, programs, schedules, faculty, classrooms, users/roles, and settings
                      </p>
                      <Button type="button" className="mt-4" onClick={exportBackup} disabled={backupLoading}>
                        {backupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {backupText.export}
                      </Button>
                    </div>

                    <div className="rounded-lg border bg-background/70 p-4">
                      <h3 className="text-sm font-semibold text-foreground">{backupText.restore}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{backupText.warning}</p>
                      <div className="mt-4 space-y-3">
                        <Input
                          type="file"
                          accept=".zip,application/zip"
                          aria-label={backupText.choose}
                          onChange={(event) => setBackupFile(event.target.files?.[0] || null)}
                        />
                        {backupFile && <p className="text-xs text-muted-foreground">{backupFile.name}</p>}
                        <Button type="button" variant="outline" onClick={restoreBackup} disabled={backupLoading}>
                          {backupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {backupText.restore}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{backupText.recent}</h3>
                    {backupItems.length > 0 ? (
                      <div className="mt-2 divide-y rounded-lg border bg-background/70">
                        {backupItems.slice(0, 5).map((item) => (
                          <div key={item.filename} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                            <span className="truncate font-medium text-foreground">{item.filename}</span>
                            <span className="text-muted-foreground">{formatBackupSize(item.size)}</span>
                            <span className="text-muted-foreground">{formatBackupTime(item.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{backupText.noRecent}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.settings.announcement}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <Toggle checked={form.announcement_enabled} onCheckedChange={(checked) => setField('announcement_enabled', checked)} label={form.announcement_enabled ? labels.settings.announcementOn : labels.settings.announcementOff} />
                  </div>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.announcementText}</span>
                    <Input value={localizedField('announcement_text')} onChange={(e) => setLocalizedField('announcement_text', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.announcementHref}</span>
                    <Input value={form.announcement_href} onChange={(e) => setField('announcement_href', e.target.value)} placeholder={labels.common.optional} />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.settings.footer}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.footerDescription}</span>
                    <Textarea rows={4} value={localizedField('footer_description')} onChange={(e) => setLocalizedField('footer_description', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.footerTitle}</span>
                    <Input value={localizedField('footer_newsletter_title')} onChange={(e) => setLocalizedField('footer_newsletter_title', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.privacyHref}</span>
                    <Input value={form.privacy_href} onChange={(e) => setField('privacy_href', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.footerText}</span>
                    <Textarea rows={3} value={localizedField('footer_newsletter_text')} onChange={(e) => setLocalizedField('footer_newsletter_text', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.copyright}</span>
                    <Input value={localizedField('copyright_text')} onChange={(e) => setLocalizedField('copyright_text', e.target.value)} />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.settings.contactSocial}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.contactEmail}</span>
                    <Input value={form.contact_email} onChange={(e) => setField('contact_email', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">{labels.settings.phone}</span>
                    <Input value={form.contact_phone} onChange={(e) => setField('contact_phone', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">{labels.settings.address}</span>
                    <Textarea rows={3} value={localizedField('contact_address')} onChange={(e) => setLocalizedField('contact_address', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">YouTube</span>
                    <Input value={form.youtube_url} onChange={(e) => setField('youtube_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">小红书 / RedNote</span>
                    <Input value={form.xiaohongshu_url} onChange={(e) => setField('xiaohongshu_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Instagram</span>
                    <Input value={form.instagram_url} onChange={(e) => setField('instagram_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Facebook</span>
                    <Input value={form.facebook_url} onChange={(e) => setField('facebook_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">TikTok</span>
                    <Input value={form.tiktok_url} onChange={(e) => setField('tiktok_url', e.target.value)} />
                  </label>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
