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
  column1Currency: string;
  column1Value: string;
  column2Currency: string;
  column2Value: string;
  column3Value: string;
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
  table: {
    programLabel: string;
    column1Label: string;
    column2Label: string;
    column3Label: string;
    paymentColumnsPerRow?: string;
  };
  items: ProgramPricingItem[];
  infoCards: InfoCard[];
  payment: { title: string; columns: PaymentColumn[] };
};
type ClassroomPricingContent = {
  items: ClassroomPricingItem[];
  notes: { title: string; items: string[] };
};

const pricingAiText = {
  zh: {
    title: 'AI Pricing \u4e2d\u82f1\u6cd5\u540c\u6b65',
    description: '\u7ffb\u8bd1\u8bfe\u7a0b\u540d\u79f0\u3001\u65f6\u957f\u3001\u8bf4\u660e\u5361\u3001\u4ed8\u6b3e\u8bf4\u660e\u3001\u79df\u8d41\u65f6\u95f4\u5355\u4f4d\u548c\u79df\u8d41\u8bf4\u660e\uff1b\u4fdd\u7559\u4ef7\u683c\u6570\u5b57\u3001\u8d27\u5e01\u3001\u56fe\u7247 URL \u4e0d\u53d8\u3002',
    languageTitle: '内容语言',
    languageHelp: '先编辑中文，再用 AI 生成 English / Français；价格数字、货币和图片不会由 AI 修改。',
  },
  en: {
    title: 'AI pricing language sync',
    description: 'Translate program names, durations, info cards, payment notes, rental time units, and rental notes. Keep prices, currencies, and image URLs unchanged.',
    languageTitle: 'Content Language',
    languageHelp: 'Edit Chinese first, then use AI to generate English / Français. Prices, currencies, and images will not be changed by AI.',
  },
  fr: {
    title: 'Synchronisation IA des tarifs',
    description: 'Traduisez les noms de cours, durees, cartes info, notes de paiement, unites de location et notes de location. Gardez les prix, devises et URL d images inchanges.',
    languageTitle: 'Langue du contenu',
    languageHelp: 'Modifiez d abord le chinois, puis utilisez IA pour generer English / Francais. Les prix, devises et images ne seront pas modifies par IA.',
  },
} as const;

function pageLocale(locale: string) {
  if (locale === 'fr') return 'fr';
  if (locale === 'zh' || locale === 'zh-Hant') return 'zh';
  return 'en';
}

const currencyOptions = ['', '$', 'C$', 'CAD', 'USD', '¥', '€'];

const defaultProgramItems: ProgramPricingItem[] = [
  { program: 'Package A / 80 Hours', column1Currency: '$', column1Value: '15', column2Currency: '$', column2Value: '1356', column3Value: 'Valid for 548 days after the first class. 50% deposit, balance due within 1 month of program start.' },
  { program: 'Package B / 40 Hours', column1Currency: '$', column1Value: '17', column2Currency: '$', column2Value: '768.4', column3Value: 'Valid for 365 days after the first class. 50% deposit, balance due within 2 weeks of program start.' },
  { program: 'Package C / 16 Hours', column1Currency: '$', column1Value: '20', column2Currency: '$', column2Value: '361.6', column3Value: 'Valid for 182 days after the first class. Full payment required at purchase.' },
  { program: 'Package D / 120 Hours', column1Currency: '$', column1Value: '14', column2Currency: '$', column2Value: '1898.4', column3Value: 'Valid for 365 days after the first class. 50% deposit, balance due within 1 month of program start.' },
  { program: 'Single Class', column1Currency: '$', column1Value: '30', column2Currency: '', column2Value: 'Based on duration', column3Value: 'For a 1.5 hour class, charge 45. Longer classes scale by class length.' },
];

const defaultClassroomItems: ClassroomPricingItem[] = [
  { key: 'large', image_url: '', hourlyCurrency: '$', hourlyPrice: '80', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '280', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '520', fullDayTime: 'day' },
  { key: 'small', image_url: '', hourlyCurrency: '$', hourlyPrice: '45', hourlyTime: 'hour', halfDayCurrency: '$', halfDayPrice: '160', halfDayTime: '4 hours', fullDayCurrency: '$', fullDayPrice: '300', fullDayTime: 'day' },
];

const defaultProgramContent: Record<ContentLocale, ProgramPricingContent> = {
  zh: {
    table: {
      programLabel: '课程 / 方案',
      column1Label: '课时单价',
      column2Label: '总价',
      column3Label: '有效期 / 付款说明',
      paymentColumnsPerRow: '2',
    },
    items: defaultProgramItems,
    infoCards: [
      { title: '可申请助学支持', body: '我们希望舞蹈学习更容易负担。家长可根据需要联系工作室了解助学支持。' },
      { title: '课时包更灵活', body: '同一套表格可以用于课时包、学期包、单次课或会员制，后台列头都可以自定义。' },
      { title: '购课前请确认课长', body: '不同班级单次上课时长可能不同；如果课程为两小时，可按两课时计算。' },
    ],
    payment: {
      title: '付款与使用说明',
      columns: [
        { title: '接受的付款方式', items: ['信用卡 / 借记卡', '银行转账（EFT）', '在线付款入口', '现金或支票（到校）'] },
        { title: '使用规则示例', items: ['可以按课时包、次卡、学期包或单次课来定义', '可在每一行写清有效期、分期规则和补费说明', '两小时课程可按 2 课时计算，其他时长也可按比例换算'] },
      ],
    },
  },
  en: {
    table: {
      programLabel: 'Program / Plan',
      column1Label: 'Unit Price',
      column2Label: 'Total Price',
      column3Label: 'Validity / Notes',
      paymentColumnsPerRow: '2',
    },
    items: defaultProgramItems,
    infoCards: [
      { title: 'Financial Aid Available', body: 'We want dance training to stay accessible. Families can contact the studio to ask about support options.' },
      { title: 'Flexible Package Design', body: 'The same table can describe hour packages, term bundles, memberships, or single-class pricing, and every column header is editable in admin.' },
      { title: 'Confirm Class Length', body: 'Class duration may vary by group. A two-hour class can be counted as two class hours when needed.' },
    ],
    payment: {
      title: 'Payment & Usage Notes',
      columns: [
        { title: 'Accepted Methods', items: ['Credit/Debit Card', 'Bank Transfer (EFT)', 'Online Payment Portal', 'Cash or Cheque (at studio)'] },
        { title: 'Flexible Setup Examples', items: ['Use the columns for hour packages, session bundles, memberships, or single-class pricing.', 'Write validity windows, installment rules, and class-hour conversion notes in the last column.', 'Rename all table headers in admin so the same layout works for other schools or studios.'] },
      ],
    },
  },
  fr: {
    table: {
      programLabel: 'Programme / Forfait',
      column1Label: 'Prix unitaire',
      column2Label: 'Prix total',
      column3Label: 'Validite / Notes',
      paymentColumnsPerRow: '2',
    },
    items: defaultProgramItems,
    infoCards: [
      { title: 'Aide financiere disponible', body: 'Nous voulons garder la danse accessible. Les familles peuvent contacter le studio pour connaitre les aides possibles.' },
      { title: 'Forfaits flexibles', body: 'Le meme tableau peut presenter des forfaits d heures, des sessions, des abonnements ou des cours a l unite, avec des colonnes entierement modifiables.' },
      { title: 'Verifier la duree du cours', body: 'La duree varie selon le groupe. Un cours de deux heures peut etre compte comme deux heures de cours si necessaire.' },
    ],
    payment: {
      title: 'Paiement et conditions',
      columns: [
        { title: 'Modes acceptes', items: ['Carte de credit/debit', 'Virement bancaire (EFT)', 'Portail de paiement en ligne', 'Comptant ou cheque au studio'] },
        { title: 'Exemples de configuration', items: ['Utilisez les colonnes pour des forfaits d heures, des cartes de cours, des abonnements ou des cours a l unite.', 'La derniere colonne peut contenir la validite, les modalites de paiement et les regles de conversion des heures.', 'Les en-tetes du tableau sont modifiables dans l administration pour reutiliser cette page dans d autres structures.'] },
      ],
    },
  },
};

const defaultClassroomContent: Record<ContentLocale, ClassroomPricingContent> = {
  zh: {
    items: defaultClassroomItems,
    notes: {
      title: '\u7533\u8bf7\u524d\u8bf4\u660e',
      items: [
        '\u63d0\u4ea4\u79df\u501f\u7533\u8bf7\u8868\u4e0d\u4ee3\u8868\u5df2\u7ecf\u4fdd\u8bc1\u6709\u6559\u5ba4\u3002',
        '\u53ea\u6709\u5b8c\u6210\u4ed8\u6b3e\u540e\uff0c\u6559\u5ba4\u624d\u4f1a\u88ab\u6b63\u5f0f\u9884\u7559\u3002',
        '\u989d\u5916\u6e05\u6d01\u3001\u8bbe\u5907\u6216\u5de5\u4f5c\u4eba\u5458\u9700\u6c42\u53ef\u80fd\u5f71\u54cd\u6700\u7ec8\u4ef7\u683c\u3002',
      ],
    },
  },
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
      column1Currency: String((item as any).column1Currency ?? (item as any).monthlyCurrency ?? monthly.currency),
      column1Value: String((item as any).column1Value ?? (item as any).monthlyPrice ?? monthly.price),
      column2Currency: String((item as any).column2Currency ?? (item as any).termCurrency ?? term.currency),
      column2Value: String((item as any).column2Value ?? (item as any).termPrice ?? term.price),
      column3Value: String((item as any).column3Value ?? (item as any).hours ?? ''),
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
      table: {
        programLabel: String(parsed.table?.programLabel || defaultProgramContent[locale].table.programLabel),
        column1Label: String(parsed.table?.column1Label || parsed.monthlyLabel || defaultProgramContent[locale].table.column1Label),
        column2Label: String(parsed.table?.column2Label || parsed.termLabel || defaultProgramContent[locale].table.column2Label),
        column3Label: String(parsed.table?.column3Label || parsed.durationLabel || defaultProgramContent[locale].table.column3Label),
        paymentColumnsPerRow: String(parsed.table?.paymentColumnsPerRow || defaultProgramContent[locale].table.paymentColumnsPerRow || '2'),
      },
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

function resizeWithFallback<T>(source: T[], targetSize: number, createItem: (index: number) => T) {
  return Array.from({ length: targetSize }, (_, index) => source[index] ?? createItem(index));
}

function programItemsText(content: ProgramPricingContent) {
  return content.items.map((item) => `${item.program} | ${item.column3Value}`).join('\n');
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
    items: resizeWithFallback(content.items, Math.max(content.items.length, lines.length), () => ({
      program: '',
      column1Currency: '$',
      column1Value: '',
      column2Currency: '$',
      column2Value: '',
      column3Value: '',
    })).map((item, index) => {
      const parts = (lines[index] || '').split('|').map((part) => part.trim());
      return {
        ...item,
        program: parts[0] || item.program,
        column3Value: parts[1] || item.column3Value,
      };
    }),
  };
}

function applyInfoCardsText(content: ProgramPricingContent, text?: string): ProgramPricingContent {
  if (!text?.trim()) return content;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    ...content,
    infoCards: resizeWithFallback(content.infoCards, Math.max(content.infoCards.length, lines.length), () => ({
      title: '',
      body: '',
    })).map((card, index) => {
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
      columns: resizeWithFallback(content.payment.columns, Math.max(content.payment.columns.length, lines.length), () => ({
        title: '',
        items: [],
      })).map((column, index) => {
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
    items: resizeWithFallback(content.items, Math.max(content.items.length, lines.length), (): ClassroomPricingItem => ({
      key: 'large',
      image_url: '',
      hourlyCurrency: '$',
      hourlyPrice: '',
      hourlyTime: '',
      halfDayCurrency: '$',
      halfDayPrice: '',
      halfDayTime: '',
      fullDayCurrency: '$',
      fullDayPrice: '',
      fullDayTime: '',
    })).map((item, index) => {
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
  const aiText = pricingAiText[pageLocale(locale)];
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
              <CardTitle className="text-base">{aiText.languageTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {aiText.languageHelp}
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
                uiLocale={locale}
                title={aiText.title}
                description={aiText.description}
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
                  <Button type="button" variant="outline" size="sm" onClick={() => updateProgramContent((content) => ({ ...content, items: [...content.items, { program: '', column1Currency: '$', column1Value: '', column2Currency: '$', column2Value: '', column3Value: '' }] }))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Program
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-3 md:grid-cols-4">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Program label</span>
                      <Input value={currentProgram.table.programLabel} onChange={(event) => updateProgramContent((content) => ({ ...content, table: { ...content.table, programLabel: event.target.value } }))} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Column 1 label</span>
                      <Input value={currentProgram.table.column1Label} onChange={(event) => updateProgramContent((content) => ({ ...content, table: { ...content.table, column1Label: event.target.value } }))} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Column 2 label</span>
                      <Input value={currentProgram.table.column2Label} onChange={(event) => updateProgramContent((content) => ({ ...content, table: { ...content.table, column2Label: event.target.value } }))} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Column 3 label</span>
                      <Input value={currentProgram.table.column3Label} onChange={(event) => updateProgramContent((content) => ({ ...content, table: { ...content.table, column3Label: event.target.value } }))} />
                    </label>
                  </div>
                  <div className="grid gap-3 lg:hidden">
                    {currentProgram.items.map((item, index) => (
                      <div key={`${contentLocale}-mobile-${index}`} className="space-y-3 rounded-xl border border-white/70 bg-white/70 p-3 shadow-sm shadow-purple-950/5 backdrop-blur-xl">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">{currentProgram.table.programLabel}</span>
                          <Input value={item.program} onChange={(event) => updateProgramRow(index, 'program', event.target.value)} />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">{currentProgram.table.column1Label}</span>
                            <CurrencyPriceInput currency={item.column1Currency} price={item.column1Value} onCurrencyChange={(value) => updateProgramRow(index, 'column1Currency', value)} onPriceChange={(value) => updateProgramRow(index, 'column1Value', value)} />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">{currentProgram.table.column2Label}</span>
                            <CurrencyPriceInput currency={item.column2Currency} price={item.column2Value} onCurrencyChange={(value) => updateProgramRow(index, 'column2Currency', value)} onPriceChange={(value) => updateProgramRow(index, 'column2Value', value)} />
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">{currentProgram.table.column3Label}</span>
                          <Input value={item.column3Value} onChange={(event) => updateProgramRow(index, 'column3Value', event.target.value)} />
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
                        <div>{currentProgram.table.programLabel}</div>
                        <div>{currentProgram.table.column1Label}</div>
                        <div>{currentProgram.table.column2Label}</div>
                        <div>{currentProgram.table.column3Label}</div>
                        <div />
                      </div>
                      {currentProgram.items.map((item, index) => (
                        <div key={`${contentLocale}-${index}`} className="grid grid-cols-[2fr_1fr_1fr_1.15fr_44px] gap-2 border-b px-3 py-2 last:border-b-0">
                          <Input value={item.program} onChange={(event) => updateProgramRow(index, 'program', event.target.value)} />
                          <CurrencyPriceInput currency={item.column1Currency} price={item.column1Value} onCurrencyChange={(value) => updateProgramRow(index, 'column1Currency', value)} onPriceChange={(value) => updateProgramRow(index, 'column1Value', value)} />
                          <CurrencyPriceInput currency={item.column2Currency} price={item.column2Value} onCurrencyChange={(value) => updateProgramRow(index, 'column2Currency', value)} onPriceChange={(value) => updateProgramRow(index, 'column2Value', value)} />
                          <Input value={item.column3Value} onChange={(event) => updateProgramRow(index, 'column3Value', event.target.value)} />
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
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => updateProgramContent((content) => ({ ...content, infoCards: [...content.infoCards, { title: '', body: '' }] }))}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Card
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, columns: [...content.payment.columns, { title: '', items: [] }] } }))}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Card
                    </Button>
                  </div>
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
                  <label className="block max-w-[220px] space-y-1">
                    <span className="text-sm font-medium">Payment cards per row</span>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      value={currentProgram.table.paymentColumnsPerRow || '2'}
                      onChange={(event) =>
                        updateProgramContent((content) => ({
                          ...content,
                          table: {
                            ...content.table,
                            paymentColumnsPerRow: event.target.value || '2',
                          },
                        }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {currentProgram.payment.columns.map((column, index) => (
                      <div key={`${contentLocale}-payment-${index}`} className="space-y-2 rounded-md border p-3">
                        <Input value={column.title} onChange={(event) => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, columns: content.payment.columns.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)) } }))} placeholder="Column title" />
                        <Textarea value={column.items.join('\n')} onChange={(event) => updateProgramContent((content) => ({ ...content, payment: { ...content.payment, columns: content.payment.columns.map((item, itemIndex) => (itemIndex === index ? { ...item, items: event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } : item)) } }))} placeholder="One item per line" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            updateProgramContent((content) => ({
                              ...content,
                              payment: {
                                ...content.payment,
                                columns: content.payment.columns.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
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
