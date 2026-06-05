'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type AiDraft, type LocaleCode, type SchoolPolicy, type SchoolPolicyBundle, isAuthenticated, settingsApi } from '@/lib/api';
import { adminContentLanguageOptions, adminUiText } from '@/lib/admin-i18n';
import { cn } from '@/lib/utils';
import { FileText, Loader2, Save } from 'lucide-react';

const defaultPolicies: SchoolPolicyBundle = {
  zh: {
    title: '学校规章制度及退费规则',
    body_markdown: '# 学校规章制度及退费规则\n\n请在报名及缴费前仔细阅读学校规章制度及退费规则。\n',
  },
  en: {
    title: 'School Policies and Refund Rules',
    body_markdown:
      '# School Policies and Refund Rules\n\nPlease read the school policies and refund rules carefully before registration and payment.\n',
  },
  fr: {
    title: "Reglement de l'ecole et regles de remboursement",
    body_markdown:
      "# Reglement de l'ecole et regles de remboursement\n\nVeuillez lire attentivement le reglement de l'ecole et les regles de remboursement avant l'inscription et le paiement.\n",
  },
};

type PolicyLocale = LocaleCode;

export default function AdminSchoolPolicyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = adminUiText(locale);
  const localeOptions = adminContentLanguageOptions(locale);
  const [contentLocale, setContentLocale] = useState<PolicyLocale>('zh');
  const [policies, setPolicies] = useState<SchoolPolicyBundle>(defaultPolicies);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const text = locale.startsWith('zh')
    ? {
        title: '学校规章制度及退费规则',
        subtitle: '单独管理前台排课表下方展示的学校规则、退费说明和报名须知。支持中英法编辑和 AI 整理翻译。',
        save: '保存规章制度',
        saved: '学校规章制度已保存',
        loading: '正在加载学校规章制度...',
      }
    : locale.startsWith('fr')
      ? {
          title: "Reglement de l'ecole et remboursements",
          subtitle: 'Gerez les politiques affichees sur le site public, avec edition chinois, anglais et francais et assistance IA.',
          save: 'Enregistrer',
          saved: 'Reglement enregistre',
          loading: 'Chargement du reglement...',
        }
      : {
          title: 'School Policies and Refund Rules',
          subtitle: 'Manage public school policies, refund rules, and registration notes with Chinese, English, and French AI support.',
          save: 'Save Policies',
          saved: 'School policies saved',
          loading: 'Loading school policies...',
        };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    settingsApi
      .schoolPolicies()
      .then((data) => setPolicies({ ...defaultPolicies, ...data }))
      .catch((err) => setError(err instanceof Error ? err.message : labels.settings.loadFailed))
      .finally(() => setLoading(false));
  }, [router, locale, labels.settings.loadFailed]);

  function setPolicyField<K extends keyof SchoolPolicy>(targetLocale: PolicyLocale, key: K, value: SchoolPolicy[K]) {
    setPolicies((current) => ({
      ...current,
      [targetLocale]: {
        ...current[targetLocale],
        [key]: value,
      },
    }));
  }

  function applyPolicyAiDrafts(drafts: AiDraft[]) {
    setPolicies((current) => {
      const next = { ...current };
      drafts.forEach((draft) => {
        if (!['zh', 'en', 'fr'].includes(draft.locale)) return;
        const localeKey = draft.locale as PolicyLocale;
        next[localeKey] = {
          ...next[localeKey],
          ...(draft.fields.title ? { title: draft.fields.title } : {}),
          ...(draft.fields.body_markdown ? { body_markdown: draft.fields.body_markdown } : {}),
          ...(draft.fields.body ? { body_markdown: draft.fields.body } : {}),
        };
      });
      return next;
    });
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const saved = await settingsApi.updateSchoolPolicies(policies);
      setPolicies({ ...defaultPolicies, ...saved });
      setMessage(text.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  const currentPolicy = policies[contentLocale];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={savePolicy} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <FileText className="h-6 w-6 text-primary" />
                {text.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
            </div>
            <Button type="submit" disabled={loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {text.save}
            </Button>
          </div>

          {(error || message) && (
            <div
              className={cn(
                'rounded-md border px-3 py-2 text-sm',
                error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              )}
            >
              {error || message}
            </div>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 py-4">
              <span className="mr-1 text-sm font-medium text-muted-foreground">{labels.common.editingLanguage}</span>
              {localeOptions.map((option) => (
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
                {text.loading}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{labels.settings.schoolPolicy}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AiLocaleSyncPanel
                  module="school_policy"
                  sourceLocale={contentLocale}
                  uiLocale={locale}
                  fields={{
                    title: currentPolicy.title,
                    body_markdown: currentPolicy.body_markdown,
                  }}
                  onApply={applyPolicyAiDrafts}
                />
                <label className="block space-y-1">
                  <span className="text-sm font-medium">{labels.common.title}</span>
                  <Input value={currentPolicy.title} onChange={(event) => setPolicyField(contentLocale, 'title', event.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">{labels.settings.bodyMarkdown}</span>
                  <Textarea
                    value={currentPolicy.body_markdown}
                    onChange={(event) => setPolicyField(contentLocale, 'body_markdown', event.target.value)}
                    className="min-h-[320px] font-mono text-sm md:min-h-[520px]"
                  />
                </label>
              </CardContent>
            </Card>
          )}
        </form>
      </main>
    </div>
  );
}
