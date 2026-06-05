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

export function AiPasteFillDialog({
  module,
  sourceLocale,
  targetFields,
  onApply,
  triggerLabel = '粘贴文字 AI 填表',
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

  async function fillForm() {
    if (!rawText.trim()) {
      setMessage(labels?.empty || '请先粘贴一段文字。');
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
      const warning = result.warnings?.filter(Boolean).join('；');
      setMessage(warning || labels?.success || 'AI 已填入表单，请检查后保存。');
      setOpen(false);
      setRawText('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : labels?.failed || 'AI 填表失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ClipboardPaste className="mr-2 h-4 w-4" />
          {triggerLabel}
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
            {labels?.cancel || '取消'}
          </Button>
          <Button type="button" onClick={fillForm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {labels?.submit || 'AI 填入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
