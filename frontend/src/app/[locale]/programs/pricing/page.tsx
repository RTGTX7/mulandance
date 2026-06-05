'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { settingsApi } from '@/lib/api';

type ProgramPricingItem = {
  program: string;
  column1Currency: string;
  column1Value: string;
  column2Currency: string;
  column2Value: string;
  column3Value: string;
};

type InfoCard = { title: string; body: string };
type PaymentColumn = { title: string; items: string[] };
type ProgramPricingContent = {
  table: {
    programLabel: string;
    column1Label: string;
    column2Label: string;
    column3Label: string;
  };
  items: ProgramPricingItem[];
  infoCards: InfoCard[];
  payment: { title: string; columns: PaymentColumn[] };
};

const defaultItems: ProgramPricingItem[] = [
  { program: 'Package A / 80 Hours', column1Currency: '$', column1Value: '15', column2Currency: '$', column2Value: '1356', column3Value: 'Valid for 548 days after the first class. 50% deposit, balance due within 1 month of program start.' },
  { program: 'Package B / 40 Hours', column1Currency: '$', column1Value: '17', column2Currency: '$', column2Value: '768.4', column3Value: 'Valid for 365 days after the first class. 50% deposit, balance due within 2 weeks of program start.' },
  { program: 'Package C / 16 Hours', column1Currency: '$', column1Value: '20', column2Currency: '$', column2Value: '361.6', column3Value: 'Valid for 182 days after the first class. Full payment required at purchase.' },
  { program: 'Package D / 120 Hours', column1Currency: '$', column1Value: '14', column2Currency: '$', column2Value: '1898.4', column3Value: 'Valid for 365 days after the first class. 50% deposit, balance due within 1 month of program start.' },
  { program: 'Single Class', column1Currency: '$', column1Value: '30', column2Currency: '', column2Value: 'Based on duration', column3Value: 'For a 1.5 hour class, charge 45. Longer classes scale by class length.' },
];

const defaultContent: ProgramPricingContent = {
  table: {
    programLabel: 'Program / Plan',
    column1Label: 'Unit Price',
    column2Label: 'Total Price',
    column3Label: 'Validity / Notes',
  },
  items: defaultItems,
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
};

function splitLegacyPrice(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i);
  const currency = currencyMatch?.[1] || '';
  const price = raw.replace(/^(C\$|CA\$|CAD|USD|[$¥€])\s*/i, '');
  return { currency, price };
}

function normalizeItems(items: unknown): ProgramPricingItem[] {
  if (!Array.isArray(items)) return defaultItems;
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

function parseContent(value: string): ProgramPricingContent {
  if (!value) return defaultContent;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return { ...defaultContent, items: normalizeItems(parsed) };
    return {
      table: {
        programLabel: String(parsed.table?.programLabel || defaultContent.table.programLabel),
        column1Label: String(parsed.table?.column1Label || parsed.monthlyLabel || defaultContent.table.column1Label),
        column2Label: String(parsed.table?.column2Label || parsed.termLabel || defaultContent.table.column2Label),
        column3Label: String(parsed.table?.column3Label || parsed.durationLabel || defaultContent.table.column3Label),
      },
      items: normalizeItems(parsed.items),
      infoCards: Array.isArray(parsed.infoCards)
        ? parsed.infoCards.map((item: InfoCard) => ({ title: String(item.title || ''), body: String(item.body || '') }))
        : defaultContent.infoCards,
      payment: {
        title: String(parsed.payment?.title || defaultContent.payment.title),
        columns: Array.isArray(parsed.payment?.columns)
          ? parsed.payment.columns.map((column: PaymentColumn) => ({
              title: String(column.title || ''),
              items: Array.isArray(column.items) ? column.items.map((item) => String(item)) : [],
            }))
          : defaultContent.payment.columns,
      },
    };
  } catch {
    return defaultContent;
  }
}

function formatPrice(currency: string, price: string) {
  const symbol = currency.trim();
  const amount = price.trim();
  if (!symbol) return amount;
  return `${symbol}${amount}`;
}

export default function PricingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [content, setContent] = useState<ProgramPricingContent>(defaultContent);

  useEffect(() => {
    settingsApi
      .site(locale)
      .then((settings) => setContent(parseContent(settings.program_pricing_json)))
      .catch(() => {});
  }, [locale]);

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.programs'), href: 'programs' }]} />
        <h1 className="heading-xl mb-4">{t('programs.pricing.title')}</h1>
        <p className="text-lead mb-12">{t('programs.pricing.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {content.items.map((item, index) => (
            <Card key={`${item.program}-${index}`}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">{item.program}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{content.table.column1Label}</p>
                    <p className="heading-sm text-primary">{formatPrice(item.column1Currency, item.column1Value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{content.table.column2Label}</p>
                    <p className="heading-sm text-primary">{formatPrice(item.column2Currency, item.column2Value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{content.table.column3Label}</p>
                    <p className="text-sm">{item.column3Value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {content.infoCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {content.infoCards.map((card, index) => (
              <Card key={`${card.title}-${index}`}>
                <CardContent className="pt-6 text-center">
                  <h3 className="heading-sm mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">{content.payment.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
              {content.payment.columns.map((column, index) => (
                <div key={`${column.title}-${index}`}>
                  <h4 className="font-semibold mb-2 text-foreground">{column.title}</h4>
                  <ul className="space-y-1">
                    {column.items.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
