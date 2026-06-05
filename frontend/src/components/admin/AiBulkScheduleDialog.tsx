'use client';

import { useState } from 'react';
import { Layers3, Loader2, Sparkles } from 'lucide-react';
import { aiApi, type AiExtractItem, type LocaleCode } from '@/lib/api';
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

interface AiBulkScheduleDialogProps {
  sourceLocale: LocaleCode;
  onCreateItems: (items: AiExtractItem[]) => Promise<void>;
  labels?: {
    trigger?: string;
    title?: string;
    description?: string;
    placeholder?: string;
    empty?: string;
    failed?: string;
    cancel?: string;
    submit?: string;
  };
}

export function AiBulkScheduleDialog({ sourceLocale, onCreateItems, labels }: AiBulkScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function createSchedules() {
    if (!rawText.trim()) {
      setMessage(labels?.empty || '请先粘贴排课文字。');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await aiApi.extractMany({
        module: 'schedules',
        source_locale: sourceLocale,
        target_locales: LOCALES,
        raw_text: rawText,
        target_fields: ['title', 'description', 'location', 'day_of_week', 'start_time', 'end_time'],
        max_items: 30,
        instruction:
          'Create one schedule item per class occurrence. Expand weekday ranges such as Monday to Friday into separate daily items.',
      });
      await onCreateItems(result.items || []);
      setOpen(false);
      setRawText('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : labels?.failed || 'AI 批量生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Layers3 className="mr-2 h-4 w-4" />
          {labels?.trigger || '批量粘贴生成排课'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels?.title || '批量粘贴排课'}</DialogTitle>
          <DialogDescription>
            {labels?.description || '可以写多行，也可以写“周一到周五 5-6 点”。AI 会拆成多条课程并直接创建。'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-[260px] resize-y"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder={
            labels?.placeholder ||
            '例：\n周一到周五 5:00-6:00pm 少儿中国舞启蒙，2527 Baseline Road 二楼，适合 5-7 岁。\n周六 10:00-11:30am 青少年中国舞提高班，同一地点，训练软开、技巧和舞台表现。'
          }
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
          <Button type="button" onClick={createSchedules} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {labels?.submit || '生成并创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
