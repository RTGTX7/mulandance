'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { aiApi, type AiDraft, type LocaleCode } from '@/lib/api';
import { Button } from '@/components/ui/button';

const LOCALES: LocaleCode[] = ['zh', 'en', 'fr'];

interface AiLocaleSyncLabels {
  empty?: string;
  generated?: string;
  generateFailed?: string;
  applyFirst?: string;
  applied?: string;
  applyButton?: string;
  generateButton?: string;
  generating?: string;
}

interface AiLocaleSyncPanelProps {
  module: string;
  sourceLocale: LocaleCode;
  targetLocales?: LocaleCode[];
  uiLocale?: string;
  fields: Record<string, string>;
  onApply: (drafts: AiDraft[]) => void;
  title?: string;
  description?: string;
  compact?: boolean;
  labels?: AiLocaleSyncLabels;
}

const defaults = {
  zh: {
    title: '\u0041\u0049 \u4e2d\u82f1\u6cd5\u540c\u6b65',
    description: '\u6574\u7406\u5f53\u524d\u8bed\u8a00\u5185\u5bb9\uff0c\u5e76\u751f\u6210\u4e2d\u6587\u3001\u82f1\u6587\u3001\u6cd5\u8bed\u7248\u672c\u3002\u68c0\u67e5\u540e\u518d\u4fdd\u5b58\u3002',
    labels: {
      empty: '\u8bf7\u5148\u586b\u5199\u4e00\u4e9b\u5185\u5bb9\uff0c\u518d\u4f7f\u7528 AI \u6574\u7406\u548c\u7ffb\u8bd1\u3002',
      generated: 'AI \u5df2\u751f\u6210\u4e2d\u82f1\u6cd5\u8349\u7a3f\u3002',
      generateFailed: 'AI \u751f\u6210\u5931\u8d25',
      applyFirst: '\u8bf7\u5148\u751f\u6210 AI \u8349\u7a3f\u3002',
      applied: '\u5df2\u540c\u6b65\u5230\u4e2d\u82f1\u6cd5\u5b57\u6bb5\uff0c\u8bf7\u68c0\u67e5\u540e\u4fdd\u5b58\u3002',
      applyButton: '\u8bed\u8a00\u540c\u6b65',
      generateButton: '\u6574\u7406\u5e76\u7ffb\u8bd1',
      generating: '\u751f\u6210\u4e2d...',
    },
  },
  en: {
    title: 'AI Chinese / English / French sync',
    description: 'Polish the current language and generate Chinese, English, and French versions. Review before saving.',
    labels: {
      empty: 'Add some content before using AI polish and translation.',
      generated: 'AI generated Chinese, English, and French drafts.',
      generateFailed: 'AI generation failed',
      applyFirst: 'Generate AI drafts first.',
      applied: 'Synced to Chinese, English, and French fields. Review before saving.',
      applyButton: 'Apply languages',
      generateButton: 'Polish and translate',
      generating: 'Generating...',
    },
  },
  fr: {
    title: 'Synchronisation IA chinois / anglais / francais',
    description: 'IA revise la langue actuelle et genere les versions chinoise, anglaise et francaise. Verifiez avant d enregistrer.',
    labels: {
      empty: 'Ajoutez du contenu avant d utiliser la revision et la traduction IA.',
      generated: 'IA a genere les brouillons chinois, anglais et francais.',
      generateFailed: 'Echec de la generation IA',
      applyFirst: 'Generez d abord les brouillons IA.',
      applied: 'Synchronise vers les champs chinois, anglais et francais. Verifiez avant d enregistrer.',
      applyButton: 'Appliquer les langues',
      generateButton: 'Reviser et traduire',
      generating: 'Generation...',
    },
  },
} as const;

function adminLocale(locale?: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

export function AiLocaleSyncPanel({
  module,
  sourceLocale,
  targetLocales = LOCALES,
  uiLocale,
  fields,
  onApply,
  title,
  description,
  compact = false,
  labels,
}: AiLocaleSyncPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const localeDefaults = defaults[adminLocale(uiLocale)];
  const text = { ...localeDefaults.labels, ...(labels || {}) };
  const fieldsSignature = JSON.stringify(fields);

  useEffect(() => {
    setDrafts([]);
    setMessage('');
  }, [module, sourceLocale, fieldsSignature]);

  async function generateDrafts() {
    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => typeof value === 'string' && value.trim())
    );
    if (Object.keys(cleanFields).length === 0) {
      setMessage(text.empty);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const result = await aiApi.translate({
        module,
        source_locale: sourceLocale,
        target_locales: targetLocales,
        fields: cleanFields,
        tone: 'polish messy draft, keep facts unchanged, then translate naturally',
      });
      setDrafts(result.drafts || []);
      setMessage(result.warnings?.length ? result.warnings.join('; ') : text.generated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.generateFailed);
    } finally {
      setLoading(false);
    }
  }

  function applyDrafts() {
    if (drafts.length === 0) {
      setMessage(text.applyFirst);
      return;
    }
    onApply(drafts);
    setMessage(text.applied);
  }

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-950">
            <Sparkles className="h-4 w-4 text-purple-700" />
            {title || localeDefaults.title}
          </div>
          {(!compact || description) && (
            <p className="mt-1 text-xs text-purple-900/70">
              {description || localeDefaults.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {drafts.length > 0 && (
            <Button type="button" variant="default" size="sm" onClick={applyDrafts}>
              <Wand2 className="mr-2 h-4 w-4" />
              {text.applyButton}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={generateDrafts} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? text.generating : text.generateButton}
          </Button>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-purple-100 bg-white/70 px-3 py-2 text-sm text-purple-950">
          {message}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {drafts.map((draft) => (
            <div key={draft.locale} className="rounded-lg border border-purple-100 bg-white p-3 text-sm">
              <div className="font-semibold">{draft.locale.toUpperCase()}</div>
              <div className="mt-2 line-clamp-3 text-slate-600">
                {draft.fields.title ||
                  draft.fields.name ||
                  draft.fields.description ||
                  draft.fields.body ||
                  draft.fields.body_markdown ||
                  draft.fields.cta_title ||
                  draft.fields.stats_labels ||
                  draft.fields.site_name ||
                  draft.fields.header_cta_label ||
                  'Ready'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
