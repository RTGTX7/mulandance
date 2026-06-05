'use client';

import { useState } from 'react';
import { ClipboardPaste, Loader2, Sparkles } from 'lucide-react';
import { aiApi, type AiDraft, type LocaleCode } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const LOCALES: LocaleCode[] = ['zh', 'en', 'fr'];

interface AiPasteFillDialogProps {
  module: string;
  sourceLocale: LocaleCode;
  uiLocale?: string;
  targetFields: string[];
  onApply: (drafts: AiDraft[]) => void;
  triggerLabel?: string;
  title: string;
  description: string;
  placeholder: string;
  instruction?: string;
  labels?: {
    empty?: string;
    success?: string;
    failed?: string;
    cancel?: string;
    submit?: string;
  };
}

const defaults = {
  zh: {
    trigger: '\u7c98\u8d34\u6587\u5b57 AI \u586b\u8868',
    empty: '\u8bf7\u5148\u7c98\u8d34\u4e00\u6bb5\u6587\u5b57\u3002',
    success: 'AI \u5df2\u586b\u5165\u8868\u5355\uff0c\u8bf7\u68c0\u67e5\u540e\u4fdd\u5b58\u3002',
    failed: 'AI \u586b\u8868\u5931\u8d25',
    cancel: '\u53d6\u6d88',
    submit: 'AI \u586b\u5165',
  },
  en: {
    trigger: 'Paste text for AI fill',
    empty: 'Paste some text first.',
    success: 'AI filled the form. Review before saving.',
    failed: 'AI form fill failed',
    cancel: 'Cancel',
    submit: 'Fill with AI',
  },
  fr: {
    trigger: 'Coller du texte pour IA',
    empty: 'Collez d abord un texte.',
    success: 'IA a rempli le formulaire. Verifiez avant d enregistrer.',
    failed: 'Echec du remplissage IA',
    cancel: 'Annuler',
    submit: 'Remplir avec IA',
  },
} as const;

function adminLocale(locale?: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

export function AiPasteFillDialog({
  module,
  sourceLocale,
  uiLocale,
  targetFields,
  onApply,
  triggerLabel,
  title,
  description,
  placeholder,
  instruction,
  labels,
}: AiPasteFillDialogProps) {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const text = { ...defaults[adminLocale(uiLocale)], ...(labels || {}) };

  async function fillForm() {
    if (!rawText.trim()) {
      setMessage(text.empty);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await aiApi.extract({
        module,
        source_locale: sourceLocale,
        target_locales: LOCALES,
        raw_text: rawText,
        target_fields: targetFields,
        instruction,
      });
      onApply(result.drafts || []);
      const warning = result.warnings?.filter(Boolean).join('; ');
      setMessage(warning || text.success);
      setOpen(false);
      setRawText('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ClipboardPaste className="mr-2 h-4 w-4" />
          {triggerLabel || text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-[240px] resize-y"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder={placeholder}
        />
        {message && (
          <div className="rounded-md border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-950">
            {message}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {text.cancel}
          </Button>
          <Button type="button" onClick={fillForm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {text.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
