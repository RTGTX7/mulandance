'use client';

import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { aiApi, type AiDraft, type LocaleCode } from '@/lib/api';
import { Button } from '@/components/ui/button';

const LOCALES: LocaleCode[] = ['zh', 'en', 'fr'];

interface AiLocaleSyncPanelProps {
  module: string;
  sourceLocale: LocaleCode;
  fields: Record<string, string>;
  onApply: (drafts: AiDraft[]) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function AiLocaleSyncPanel({
  module,
  sourceLocale,
  fields,
  onApply,
  title = 'AI 中英法同步',
  description = '整理当前语言内容，并生成中文、英文、法语版本。检查后再保存。',
  compact = false,
}: AiLocaleSyncPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<AiDraft[]>([]);

  async function generateDrafts() {
    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => typeof value === 'string' && value.trim())
    );
    if (Object.keys(cleanFields).length === 0) {
      setMessage('请先填写一些内容，再使用 AI 整理和翻译。');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const result = await aiApi.translate({
        module,
        source_locale: sourceLocale,
        target_locales: LOCALES,
        fields: cleanFields,
        tone: 'polish messy draft, keep facts unchanged, then translate naturally',
      });
      setDrafts(result.drafts || []);
      setMessage(result.warnings?.length ? result.warnings.join('；') : 'AI 已生成中英法草稿。');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  }

  function applyDrafts() {
    if (drafts.length === 0) {
      setMessage('请先生成 AI 草稿。');
      return;
    }
    onApply(drafts);
    setMessage('已同步到中英法字段，请检查后保存。');
  }

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-950">
            <Sparkles className="h-4 w-4 text-purple-700" />
            {title}
          </div>
          {!compact && <p className="mt-1 text-xs text-purple-900/70">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {drafts.length > 0 && (
            <Button type="button" variant="default" size="sm" onClick={applyDrafts}>
              <Wand2 className="mr-2 h-4 w-4" />
              语言同步
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={generateDrafts} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? '生成中...' : '整理并翻译'}
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
                {draft.fields.title || draft.fields.name || draft.fields.description || draft.fields.body || draft.fields.body_markdown || 'Ready'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
