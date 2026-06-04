'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type AiDraft, SystemSettings, isAuthenticated, settingsApi, uploadApi } from '@/lib/api';
import { adminContentLanguageOptions } from '@/lib/admin-i18n';
import { cn } from '@/lib/utils';
import { DollarSign, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { AiLocaleSyncPanel } from '@/components/admin/AiLocaleSyncPanel';

type ContentLocale = 'zh' | 'en' | 'fr';

type ProgramPricingItem = {
  program: string;
  monthlyCurrency: string;
  monthlyPrice: string;
  termCurrency: string;
  termPrice: string;
  hours: string;
};

type ClassroomPricingItem = {
  key: 'large' | 'small';
  image_url: string;
  hourlyCurrency: string;
  hourlyPrice: string;
  hourlyTime: string;
  halfDayCurrency: string;
  halfDayPrice: string;
  halfDayTime: string;
  fullDayCurrency: string;
  fullDayPrice: string;
  fullDayTime: string;
};

type InfoCard = { title: string; body: string };
type PaymentColumn = { title: string; items: string[] };
type ProgramPricingContent = {
  items: ProgramPricingItem[];
  infoCards: InfoCard[];
  payment: { title: string; columns: PaymentColumn[] };
};
type ClassroomPricingContent = {
  items: ClassroomPricingItem[];
  notes: { title: string; items: string[] };
};

const currencyOptions = ['', '$', 'C$', 'CAD', 'USD', '¥', '€'];

const defaultProgramItems: ProgramPricingItem[] = [
  { program: 'Young Dancers (Ages 3-5)', monthlyCurrency: '$', monthlyPrice: '120', termCurrency: '$', termPrice: '340', hours: '45 min, 1x/week' },
  { program: 'Ballet (All Levels)', monthlyCurrency: '$', monthlyPrice: '150', termCurrency: '$', termPrice: '420', hours: '60 min, 1x/week' },
  { program: 'Contemporary', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Chinese Dance', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Jazz', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Hip-Hop', monthlyCurrency: '$', monthlyPrice: '130', termCurrency: '$', termPrice: '360', hours: '60 min, 1x/week' },
  { program: 'Multi-Program Discount', monthlyCurrency: '', monthlyPrice: '10% off 2nd program', termCurrency: '', termPrice: '10% off 2nd program', hours: '' },
];

const defaultClassroomItems: ClassroomPricingItem[] = [
  { key: 'large', image_url: '', hourlyCurrency: '$', hourlyPrice: '80', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '280', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '520', fullDayTime: 'day' },
  { key: 'small', image_url: '', hourlyCurrency: '$', hourlyPrice: '45', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '160', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '300', fullDayTime: 'day' },
];

const defaultProgramContent: Record<ContentLocale, ProgramPricingContent> = {
  zh: {
    items: defaultProgramItems,
    infoCards: [
      { title: '可申请助学金', body: '我们希望舞蹈学习更容易负担。可通过学生入口申请奖学金项目。' },
      { title: '兄弟姐妹优惠', body: '第二个孩子可享 10% 优惠，第三个及之后孩子可享 15% 优惠。' },
      { title: '免费体验课', body: '新学生可免费参加一次课程。请联系我们预约体验。' },
    ],
    payment: {
      title: '付款方式',
      columns: [
        { title: '接受的付款方式', items: ['信用卡 / 借记卡', '银行转账（EFT）', '在线付款入口', '现金或支票（到校）'] },
        { title: '付款时间', items: ['按月：每月 1 日前支付', '按学期：开课前 2 周支付', '按年：全年预付可享 10% 优惠'] },
      ],
    },
  },
  en: {
    items: defaultProgramItems,
    infoCards: [
      { title: 'Financial Aid Available', body: 'We believe dance should be accessible. Apply for our scholarship program through the student portal.' },
      { title: 'Sibling Discount Available', body: '10% off for the second child, 15% off for the third and subsequent children enrolled.' },
      { title: 'Free Introductory Class', body: 'New students can attend one class free of charge. Contact us to schedule your trial.' },
    ],
    payment: {
      title: 'Payment Options',
      columns: [
        { title: 'Accepted Methods', items: ['Credit/Debit Card', 'Bank Transfer (EFT)', 'Online Payment Portal', 'Cash or Cheque (at studio)'] },
        { title: 'Payment Schedule', items: ['Monthly: Due on the 1st of each month', 'Per Term: Due 2 weeks before term starts', 'Annual: 10% discount for annual prepayment'] },
      ],
    },
  },
  fr: {
    items: defaultProgramItems,
    infoCards: [
      { title: 'Aide financiere disponible', body: 'Nous voulons rendre la danse accessible. Les familles peuvent demander une aide via le portail etudiant.' },
      { title: 'Rabais pour fratrie', body: '10 % de rabais pour le deuxieme enfant, 15 % pour le troisieme enfant et les suivants.' },
      { title: 'Cours d essai gratuit', body: 'Les nouveaux eleves peuvent essayer un cours gratuitement. Contactez-nous pour reserver.' },
    ],
    payment: {
      title: 'Options de paiement',
      columns: [
        { title: 'Modes acceptes', items: ['Carte de credit/debit', 'Virement bancaire (EFT)', 'Portail de paiement en ligne', 'Comptant ou cheque au studio'] },
        { title: 'Calendrier de paiement', items: ['Mensuel : payable le 1er de chaque mois', 'Par session : payable 2 semaines avant le debut', 'Annuel : 10 % de rabais pour paiement annuel'] },
      ],
    },
  },
};

const defaultClassroomContent: Record<ContentLocale, ClassroomPricingContent> = {
  zh: { items: defaultClassroomItems, notes: { title: '申请前说明', items: ['提交租借申请表不代表已经保证有教室。', '只有完成付款后，教室才会被正式预留。', '额外清洁、设备或工作人员需求可能影响最终价格。'] } },
  en: { items: defaultClassroomItems, notes: { title: 'Before You Book', items: ['Submitting a rental request form does not guarantee a room.', 'Only completing the payment reserves a room.', 'Additional cleaning, equipment, or staffing needs may affect the final price.'] } },
  fr: { items: defaultClassroomItems, notes: { title: 'Avant de reserver', items: ["L'envoi d'une demande ne garantit pas une salle.", 'La salle est reservee seulement apres paiement.', 'Le nettoyage, le materiel ou le personnel supplementaire peuvent modifier le prix final.'] } },
};

function splitLegacyPrice(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i);
  const currency = currencyMatch?.[1] || '';
  const price = raw.replace(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i, '');
  return { currency, price };
}

function splitLegacyPriceTime(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i);
  const currency = currencyMatch?.[1] || '$';
  const text = raw.replace(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i, '');
  const [price = '', time = ''] = text.split('/').map((part) => part.trim());
  return { currency, price, time };
}

function parseProgramItems(items: unknown): ProgramPricingItem[] {
  if (!Array.isArray(items)) return defaultProgramItems;
  return items.map((raw) => {
    const item = raw as Partial<ProgramPricingItem> & { monthly?: string; term?: string };
    const monthly = splitLegacyPrice(item.monthly);
    const term = splitLegacyPrice(item.term);
    return {
      program: String(item.program || ''),
      monthlyCurrency: String(item.monthlyCurrency ?? monthly.currency),
      monthlyPrice: String(item.monthlyPrice ?? monthly.price),
      termCurrency: String(item.termCurrency ?? term.currency),
      termPrice: String(item.termPrice ?? term.price),
      hours: String(item.hours || ''),
    };
  });
}

function parseClassroomItems(items: unknown): ClassroomPricingItem[] {
  if (!Array.isArray(items)) return defaultClassroomItems;
  return items.map((raw) => {
    const item = raw as Partial<ClassroomPricingItem> & { hourly?: string; halfDay?: string; fullDay?: string; imageUrl?: string };
    const hourly = splitLegacyPriceTime(item.hourly);
    const halfDay = splitLegacyPriceTime(item.halfDay);
    const fullDay = splitLegacyPriceTime(item.fullDay);
    return {
      key: item.key === 'small' ? 'small' : 'large',
      image_url: String(item.image_url ?? item.imageUrl ?? ''),
      hourlyCurrency: String(item.hourlyCurrency ?? hourly.currency),
      hourlyPrice: String(item.hourlyPrice ?? hourly.price),
      hourlyTime: String(item.hourlyTime ?? hourly.time),
      halfDayCurrency: String(item.halfDayCurrency ?? halfDay.currency),
      halfDayPrice: String(item.halfDayPrice ?? halfDay.price),
      halfDayTime: String(item.halfDayTime ?? halfDay.time),
      fullDayCurrency: String(item.fullDayCurrency ?? fullDay.currency),
      fullDayPrice: String(item.fullDayPrice ?? fullDay.price),
      fullDayTime: String(item.fullDayTime ?? fullDay.time),
    };
  });
}

function parseProgramContent(value: string | undefined, locale: ContentLocale): ProgramPricingContent {
  if (!value) return defaultProgramContent[locale];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return { ...defaultProgramContent[locale], items: parseProgramItems(parsed) };
    return {
      items: parseProgramItems(parsed.items),
      infoCards: Array.isArray(parsed.infoCards) ? parsed.infoCards.map((item: InfoCard) => ({ title: String(item.title || ''), body: String(item.body || '') })) : defaultProgramContent[locale].infoCards,
      payment: {
        title: String(parsed.payment?.title || defaultProgramContent[locale].payment.title),
        columns: Array.isArray(parsed.payment?.columns)
          ? parsed.payment.columns.map((column: PaymentColumn) => ({
              title: String(column.title || ''),
              items: Array.isArray(column.items) ? column.items.map((item) => String(item)) : [],
            }))
          : defaultProgramContent[locale].payment.columns,
      },
    };
  } catch {
    return defaultProgramContent[locale];
  }
}

function parseClassroomContent(value: string | undefined, locale: ContentLocale): ClassroomPricingContent {
  if (!value) return defaultClassroomContent[locale];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return { ...defaultClassroomContent[locale], items: parseClassroomItems(parsed) };
    return {
      items: parseClassroomItems(parsed.items),
      notes: {
        title: String(parsed.notes?.title || defaultClassroomContent[locale].notes.title),
        items: Array.isArray(parsed.notes?.items) ? parsed.notes.items.map((item: string) => String(item)) : defaultClassroomContent[locale].notes.items,
      },
    };
  } catch {
    return defaultClassroomContent[locale];
  }
}

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function programItemsText(content: ProgramPricingContent) {
  return content.items.map((item) => `${item.program} | ${item.hours}`).join('\n');
}

function infoCardsText(content: ProgramPricingContent) {
  return content.infoCards.map((card) => `${card.title} :: ${card.body}`).join('\n');
}

function paymentColumnsText(content: ProgramPricingContent) {
  return content.payment.columns.map((column) => `${column.title} :: ${column.items.join(' | ')}`).join('\n');
}

function rentalItemsText(content: ClassroomPricingContent) {
  return content.items.map((item) => `${item.key} | ${item.hourlyTime} | ${item.halfDayTime} | ${item.fullDayTime}`).join('\n');
}

function applyProgramItemsText(content: ProgramPricingContent, text?: string): ProgramPricingContent {
  if (!text?.trim()) return content;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...content,
    items: content.items.map((item, index) => {
      const parts = (lines[index] || '').split('|').map((part) => part.trim());
      return {
        ...item,
        program: parts[0] || item.program,
        hours: parts[1] || item.hours,
      };
    }),
  };
}

function applyInfoCardsText(content: ProgramPricingContent, text?: string): ProgramPricingContent {
  if (!text?.trim()) return content;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...content,
    infoCards: content.infoCards.map((card, index) => {
      const [title, body] = (lines[index] || '').split('::').map((part) => part.trim());
      return {
        ...card,
        title: title || card.title,
        body: body || card.body,
      };
    }),
  };
}

function applyPaymentColumnsText(content: ProgramPricingContent, text?: string): ProgramPricingContent {
  if (!text?.trim()) return content;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...content,
    payment: {
      ...content.payment,
      columns: content.payment.columns.map((column, index) => {
        const [title, items] = (lines[index] || '').split('::').map((part) => part.trim());
        return {
          ...column,
          title: title || column.title,
          items: items ? items.split('|').map((item) => item.trim()).filter(Boolean) : column.items,
        };
      }),
    },
  };
}

function applyRentalItemsText(content: ClassroomPricingContent, text?: string): ClassroomPricingContent {
  if (!text?.trim()) return content;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...content,
    items: content.items.map((item, index) => {
      const [, hourlyTime, halfDayTime, fullDayTime] = (lines[index] || '').split('|').map((part) => part.trim());
      return {
        ...item,
        hourlyTime: hourlyTime || item.hourlyTime,
        halfDayTime: halfDayTime || item.halfDayTime,
        fullDayTime: fullDayTime || item.fullDayTime,
      };
    }),
  };
}

function CurrencyPriceInput({
  currency,
  price,
  onCurrencyChange,
  onPriceChange,
}: {
  currency: string;
  price: string;
  onCurrencyChange: (value: string) => void;
  onPriceChange: (value: string) => void;
}) {
  return (
    <div className="flex h-10 overflow-hidden rounded-md border border-input bg-background">
      <select className="w-16 border-r bg-muted px-2 text-sm text-muted-foreground outline-none" value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
        {currencyOptions.map((option) => (
          <option key={option || 'text'} value={option}>
            {option || 'Text'}
          </option>
        ))}
      </select>
      <input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" value={price} onChange={(event) => onPriceChange(event.target.value)} />
    </div>
  );
}

export default function AdminPricingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const languageOptions = adminContentLanguageOptions(locale);
  const [contentLocale, setContentLocale] = useState<ContentLocale>('zh');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [programContent, setProgramContent] = useState<Record<ContentLocale, ProgramPricingContent>>(defaultProgramContent);
  const [classroomContent, setClassroomContent] = useState<Record<ContentLocale, ClassroomPricingContent>>(defaultClassroomContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingClassroomImage, setUploadingClassroomImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    settingsApi
      .siteAll()
      .then((data) => {
        setSettings(data);
        setProgramContent({
          zh: parseProgramContent(data.program_pricing_json, 'zh'),
          en: parseProgramContent(data.translations?.en?.program_pricing_json, 'en'),
          fr: parseProgramContent(data.translations?.fr?.program_pricing_json, 'fr'),
        });
        setClassroomContent({
          zh: parseClassroomContent(data.classroom_pricing_json, 'zh'),
          en: parseClassroomContent(data.translations?.en?.classroom_pricing_json, 'en'),
          fr: parseClassroomContent(data.translations?.fr?.classroom_pricing_json, 'fr'),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pricing settings'))
      .finally(() => setLoading(false));
  }, [locale, router]);

  const currentProgram = programContent[contentLocale];
  const currentClassroom = classroomContent[contentLocale];

  function updateProgramContent(updater: (content: ProgramPricingContent) => ProgramPricingContent) {
    setProgramContent((current) => ({ ...current, [contentLocale]: updater(current[contentLocale]) }));
  }

  function updateClassroomContent(updater: (content: ClassroomPricingContent) => ClassroomPricingContent) {
    setClassroomContent((current) => ({ ...current, [contentLocale]: updater(current[contentLocale]) }));
  }

  function applyClassroomAiDrafts(drafts: AiDraft[]) {
    setClassroomContent((current) => {
      const next = { ...current };
      drafts.forEach((draft) => {
        if (!['zh', 'en', 'fr'].includes(draft.locale)) return;
        const localeKey = draft.locale as ContentLocale;
        const body = draft.fields.notes_body || draft.fields.body || '';
        next[localeKey] = {
          ...next[localeKey],
          notes: {
            ...next[localeKey].notes,
            ...(draft.fields.notes_title ? { title: draft.fields.notes_title } : {}),
            ...(body ? { items: body.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean) } : {}),
          },
        };
      });
      return next;
    });
  }

  function applyPricingAiDrafts(drafts: AiDraft[]) {
    setProgramContent((current) => {
      const next = { ...current };
      drafts.forEach((draft) => {
        if (!['zh', 'en', 'fr'].includes(draft.locale)) return;
        const localeKey = draft.locale as ContentLocale;
        let content = next[localeKey];
        content = applyProgramItemsText(content, draft.fields.program_items_text);
        content = applyInfoCardsText(content, draft.fields.info_cards_text);
        content = applyPaymentColumnsText(content, draft.fields.payment_columns_text);
        next[localeKey] = {
          ...content,
          payment: {
            ...content.payment,
            title: draft.fields.payment_title || content.payment.title,
          },
        };
      });
      return next;
    });

    setClassroomContent((current) => {
      const next = { ...current };
      drafts.forEach((draft) => {
        if (!['zh', 'en', 'fr'].includes(draft.locale)) return;
        const localeKey = draft.locale as ContentLocale;
        let content = applyRentalItemsText(next[localeKey], draft.fields.rental_items_text);
        const rentalNotesBody = draft.fields.rental_notes_body || '';
        content = {
          ...content,
          notes: {
            ...content.notes,
            title: draft.fields.rental_notes_title || content.notes.title,
            items: rentalNotesBody
              ? rentalNotesBody.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean)
              : content.notes.items,
          },
        };
        next[localeKey] = content;
      });
      return next;
    });
  }

  function updateProgramRow(index: number, field: keyof ProgramPricingItem, value: string) {
    updateProgramContent((content) => ({
      ...content,
      items: content.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function updateClassroomRow(index: number, field: keyof ClassroomPricingItem, value: string) {
    updateClassroomContent((content) => ({
      ...content,
      items: content.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  async function uploadClassroomImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadKey = `${contentLocale}-${index}`;
    setUploadingClassroomImage(uploadKey);
    setError('');
    try {
      const uploaded = await uploadApi.image(file);
      updateClassroomRow(index, 'image_url', uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload classroom image');
    } finally {
      setUploadingClassroomImage(null);
      event.target.value = '';
    }
  }

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    if (Object.values(programContent).some((content) => content.items.some((item) => !item.program.trim()))) {
      setError('Every program pricing row needs a program name.');
      setMessage('');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await settingsApi.updateSite({
        ...settings,
        program_pricing_json: stringify(programContent.zh),
        classroom_pricing_json: stringify(classroomContent.zh),
        translations: {
          ...(settings.translations || {}),
          en: {
            ...(settings.translations?.en || {}),
            program_pricing_json: stringify(programContent.en),
            classroom_pricing_json: stringify(classroomContent.en),
          },
          fr: {
            ...(settings.translations?.fr || {}),
            program_pricing_json: stringify(programContent.fr),
            classroom_pricing_json: stringify(classroomContent.fr),
          },
        },
      });
      setSettings(saved);
      setMessage('Pricing settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing settings');
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
        <form onSubmit={savePricing} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <DollarSign className="h-6 w-6 text-primary" />
                Pricing
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit program pricing, rental pricing, and public pricing page content in Chinese, English, and French.
              </p>
            </div>
            <Button type="submit" disabled={loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Pricing
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content Language / 中英法内容</CardTitle>
              <p className="text-sm text-muted-foreground">
                先编辑中文，再用 AI 生成 English / Français；价格数字、货币和图片不会由 AI 修改。
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-medium text-muted-foreground">Editing Language</span>
                {languageOptions.map((option) => (
                  <Button key={option.value} type="button" variant={contentLocale === option.value ? 'default' : 'outline'} onClick={() => setContentLocale(option.value)}>
                    {option.label}
                  </Button>
                ))}
              </div>
              <AiLocaleSyncPanel
                module="pricing"
                sourceLocale={contentLocale}
                title="AI Pricing 中英法同步"
                description="翻译课程名称、时长、说明卡、付款说明、租赁时间单位和租赁说明；保留价格数字、货币、图片 URL 不变。"
                fields={{
                  program_items_text: programItemsText(currentProgram),
                  info_cards_text: infoCardsText(currentProgram),
                  payment_title: currentProgram.payment.title,
                  payment_columns_text: paymentColumnsText(currentProgram),
                  rental_items_text: rentalItemsText(currentClassroom),
                  rental_notes_title: currentClassroom.notes.title,
                  rental_notes_body: currentClassroom.notes.items.join('\n'),
                }}
                onApply={applyPricingAiDrafts}
              />
            </CardContent>
          </Card>

          {(error || message) && (
            <div className={cn('rounded-md border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
              {error || message}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pricing settings...
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Program Pricing</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Controls the table on /programs/pricing.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateProgramContent((content) => ({ ...content, items: [...content.items, { program: '', monthlyCurrency: '$', monthlyPrice: '', termCurrency: '$', termPrice: '', hours: '' }] }))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Program
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 lg:hidden">
                    {currentProgram.items.map((item, index) => (
                      <div key={`${contentLocale}-mobile-${index}`} className="space-y-3 rounded-xl border border-white/70 bg-white/70 p-3 shadow-sm shadow-purple-950/5 backdrop-blur-xl">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">Program</span>
                          <Input value={item.program} onChange={(event) => updateProgramRow(index, 'program', event.target.value)} />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Monthly</span>
                            <CurrencyPriceInput currency={item.monthlyCurrency} price={item.monthlyPrice} onCurrencyChange={(value) => updateProgramRow(index, 'monthlyCurrency', value)} onPriceChange={(value) => updateProgramRow(index, 'monthlyPrice', value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Term</span>
                            <CurrencyPriceInput currency={item.termCurrency} price={item.termPrice} onCurrencyChange={(value) => updateProgramRow(index, 'termCurrency', value)} onPriceChange={(value) => updateProgramRow(index, 'termPrice', value)} />
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">Duration</span>
                          <Input value={item.hours} onChange={(event) => updateProgramRow(index, 'hours', event.target.value)} />
                        </label>
                        <Button type="button" variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto" onClick={() => updateProgramContent((content) => ({ ...content, items: content.items.filter((_, itemIndex) => itemIndex !== index) }))}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto lg:block">
                    <div className="min-w-[920px] rounded-md border">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1.15fr_44px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                        <div>Program</div>
                        <div>Monthly</div>
                        <div>Term</div>
                        <div>Duration</div>
                        <div />
                      </div>
                      {currentProgram.items.map((item, index) => (
                        <div key={`${contentLocale}-${index}`} className="grid grid-cols-[2fr_1fr_1fr_1.15fr_44px] gap-2 border-b px-3 py-2 last:border-b-0">
                          <Input value={item.program} onChange={(event) => updateProgramRow(index, 'program', event.target.value)} />
                          <CurrencyPriceInput currency={item.monthlyCurrency} price={item.monthlyPrice} onCurrencyChange={(value) => updateProgramRow(index, 'monthlyCurrency', value)} onPriceChange={(value) => updateProgramRow(index, 'monthlyPrice', value)} />
                          <CurrencyPriceInput currency={item.termCurrency} price={item.termPrice} onCurrencyChange={(value) => updateProgramRow(index, 'termCurrency', value)} onPriceChange={(value) => updateProgramRow(index, 'termPrice', value)} />
                          <Input value={item.hours} onChange={(event) => updateProgramRow(index, 'hours', event.target.value)} />
                          <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateProgramContent((content) => ({ ...content, items: content.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Remove program pricing row">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Program Pricing Page Blocks</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Controls the three info cards and payment options below the program price table.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateProgramContent((content) => ({ ...content, infoCards: [...content.infoCards, { title: '', body: '' }] }))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 lg:grid-cols-3">
                    {currentProgram.infoCards.map((card, index) => (
                      <div key={`${contentLocale}-card-${index}`} className="space-y-2 rounded-md border p-3">
                        <Input value={card.title} onChange={(event) => updateProgramContent((content) => ({ ...content, infoCards: content.infoCards.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)) }))} placeholder="Card title" />
                        <Textarea value={card.body} onChange={(event) => updateProgramContent((content) => ({ ...content, infoCards: content.infoCards.map((item, itemIndex) => (itemIndex === index ? { ...item, body: event.target.value } : item)) }))} placeholder="Card body" />
                        <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => updateProgramContent((content) => ({ ...content, infoCards: content.infoCards.filter((_, itemIndex) => itemIndex !== index) }))}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Payment section title</span>
                    <Input value={currentProgram.payment.title} onChange={(event) => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, title: event.target.value } }))} />
                  </label>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {currentProgram.payment.columns.map((column, index) => (
                      <div key={`${contentLocale}-payment-${index}`} className="space-y-2 rounded-md border p-3">
                        <Input value={column.title} onChange={(event) => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, columns: content.payment.columns.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)) } }))} placeholder="Column title" />
                        <Textarea value={column.items.join('\n')} onChange={(event) => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, columns: content.payment.columns.map((item, itemIndex) => (itemIndex === index ? { ...item, items: event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } : item)) } }))} placeholder="One item per line" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Rental Pricing</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Controls /classrooms/pricing.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateClassroomContent((content) => ({ ...content, items: [...content.items, { key: 'large', image_url: '', hourlyCurrency: '$', hourlyPrice: '', hourlyTime: '', halfDayCurrency: '$', halfDayPrice: '', halfDayTime: '', fullDayCurrency: '$', fullDayPrice: '', fullDayTime: '' }] }))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rental
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 lg:hidden">
                    {currentClassroom.items.map((item, index) => (
                      <div key={`${contentLocale}-rental-mobile-${index}`} className="space-y-3 rounded-xl border border-white/70 bg-white/70 p-3 shadow-sm shadow-purple-950/5 backdrop-blur-xl">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">Room</span>
                          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={item.key} onChange={(event) => updateClassroomRow(index, 'key', event.target.value as ClassroomPricingItem['key'])}>
                            <option value="large">Large Room</option>
                            <option value="small">Small Room</option>
                          </select>
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">Image</span>
                          <div className="flex min-w-0 gap-2">
                            {item.image_url ? <img src={item.image_url} alt="" className="h-10 w-14 shrink-0 rounded-md border object-cover" /> : null}
                            <Input value={item.image_url} onChange={(event) => updateClassroomRow(index, 'image_url', event.target.value)} placeholder="Image URL" />
                            <Button type="button" variant="outline" size="icon" disabled={uploadingClassroomImage === `${contentLocale}-${index}`} onClick={() => document.getElementById(`classroom-image-mobile-${contentLocale}-${index}`)?.click()} aria-label="Upload classroom image">
                              {uploadingClassroomImage === `${contentLocale}-${index}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                            </Button>
                            <input id={`classroom-image-mobile-${contentLocale}-${index}`} type="file" accept="image/*" className="hidden" onChange={(event) => uploadClassroomImage(index, event)} />
                          </div>
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Hourly Price</span>
                            <CurrencyPriceInput currency={item.hourlyCurrency} price={item.hourlyPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'hourlyCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'hourlyPrice', value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Hourly Time</span>
                            <Input value={item.hourlyTime} onChange={(event) => updateClassroomRow(index, 'hourlyTime', event.target.value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Half Day Price</span>
                            <CurrencyPriceInput currency={item.halfDayCurrency} price={item.halfDayPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'halfDayCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'halfDayPrice', value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Half Day Time</span>
                            <Input value={item.halfDayTime} onChange={(event) => updateClassroomRow(index, 'halfDayTime', event.target.value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Full Day Price</span>
                            <CurrencyPriceInput currency={item.fullDayCurrency} price={item.fullDayPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'fullDayCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'fullDayPrice', value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Full Day Time</span>
                            <Input value={item.fullDayTime} onChange={(event) => updateClassroomRow(index, 'fullDayTime', event.target.value)} />
                          </label>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto" onClick={() => updateClassroomContent((content) => ({ ...content, items: content.items.filter((_, itemIndex) => itemIndex !== index) }))}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto lg:block">
                    <div className="min-w-[1320px] rounded-md border">
                      <div className="grid grid-cols-[0.7fr_1.5fr_1fr_0.75fr_1fr_0.75fr_1fr_0.75fr_44px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                        <div>Room</div>
                        <div>Image</div>
                        <div>Hourly Price</div>
                        <div>Hourly Time</div>
                        <div>Half Day Price</div>
                        <div>Half Day Time</div>
                        <div>Full Day Price</div>
                        <div>Full Day Time</div>
                        <div />
                      </div>
                      {currentClassroom.items.map((item, index) => (
                        <div key={`${contentLocale}-rental-${index}`} className="grid grid-cols-[0.7fr_1.5fr_1fr_0.75fr_1fr_0.75fr_1fr_0.75fr_44px] gap-2 border-b px-3 py-2 last:border-b-0">
                          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={item.key} onChange={(event) => updateClassroomRow(index, 'key', event.target.value as ClassroomPricingItem['key'])}>
                            <option value="large">Large Room</option>
                            <option value="small">Small Room</option>
                          </select>
                          <div className="flex min-w-0 gap-2">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="h-10 w-14 rounded-md border object-cover" />
                            ) : null}
                            <Input value={item.image_url} onChange={(event) => updateClassroomRow(index, 'image_url', event.target.value)} placeholder="Image URL" />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={uploadingClassroomImage === `${contentLocale}-${index}`}
                              onClick={() => document.getElementById(`classroom-image-${contentLocale}-${index}`)?.click()}
                              aria-label="Upload classroom image"
                            >
                              {uploadingClassroomImage === `${contentLocale}-${index}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ImagePlus className="h-4 w-4" />
                              )}
                            </Button>
                            <input
                              id={`classroom-image-${contentLocale}-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => uploadClassroomImage(index, event)}
                            />
                          </div>
                          <CurrencyPriceInput currency={item.hourlyCurrency} price={item.hourlyPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'hourlyCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'hourlyPrice', value)} />
                          <Input value={item.hourlyTime} onChange={(event) => updateClassroomRow(index, 'hourlyTime', event.target.value)} />
                          <CurrencyPriceInput currency={item.halfDayCurrency} price={item.halfDayPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'halfDayCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'halfDayPrice', value)} />
                          <Input value={item.halfDayTime} onChange={(event) => updateClassroomRow(index, 'halfDayTime', event.target.value)} />
                          <CurrencyPriceInput currency={item.fullDayCurrency} price={item.fullDayPrice} onCurrencyChange={(value) => updateClassroomRow(index, 'fullDayCurrency', value)} onPriceChange={(value) => updateClassroomRow(index, 'fullDayPrice', value)} />
                          <Input value={item.fullDayTime} onChange={(event) => updateClassroomRow(index, 'fullDayTime', event.target.value)} />
                          <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateClassroomContent((content) => ({ ...content, items: content.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Remove rental pricing row">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">Rental notes title</span>
                      <Input value={currentClassroom.notes.title} onChange={(event) => updateClassroomContent((content) => ({ ...content, notes: { ...content.notes, title: event.target.value } }))} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium">Rental notes, one per line</span>
                      <Textarea value={currentClassroom.notes.items.join('\n')} onChange={(event) => updateClassroomContent((content) => ({ ...content, notes: { ...content.notes, items: event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } }))} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
