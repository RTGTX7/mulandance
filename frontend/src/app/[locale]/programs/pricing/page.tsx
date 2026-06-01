'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { settingsApi } from '@/lib/api';

type ProgramPricingItem = {
  program: string;
  monthlyCurrency: string;
  monthlyPrice: string;
  termCurrency: string;
  termPrice: string;
  hours: string;
};

type InfoCard = { title: string; body: string };
type PaymentColumn = { title: string; items: string[] };
type ProgramPricingContent = {
  items: ProgramPricingItem[];
  infoCards: InfoCard[];
  payment: { title: string; columns: PaymentColumn[] };
};

const defaultItems: ProgramPricingItem[] = [
  { program: 'Young Dancers (Ages 3-5)', monthlyCurrency: '$', monthlyPrice: '120', termCurrency: '$', termPrice: '340', hours: '45 min, 1x/week' },
  { program: 'Ballet (All Levels)', monthlyCurrency: '$', monthlyPrice: '150', termCurrency: '$', termPrice: '420', hours: '60 min, 1x/week' },
  { program: 'Contemporary', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Chinese Dance', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Jazz', monthlyCurrency: '$', monthlyPrice: '140', termCurrency: '$', termPrice: '390', hours: '60 min, 1x/week' },
  { program: 'Hip-Hop', monthlyCurrency: '$', monthlyPrice: '130', termCurrency: '$', termPrice: '360', hours: '60 min, 1x/week' },
];

const defaultContent: ProgramPricingContent = {
  items: defaultItems,
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
      monthlyCurrency: String(item.monthlyCurrency ?? monthly.currency),
      monthlyPrice: String(item.monthlyPrice ?? monthly.price),
      termCurrency: String(item.termCurrency ?? term.currency),
      termPrice: String(item.termPrice ?? term.price),
      hours: String(item.hours || ''),
    };
  });
}

function parseContent(value: string): ProgramPricingContent {
  if (!value) return defaultContent;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return { ...defaultContent, items: normalizeItems(parsed) };
    return {
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
                    <p className="text-xs text-muted-foreground mb-1">{t('programs.pricing.monthly')}</p>
                    <p className="heading-sm text-primary">{formatPrice(item.monthlyCurrency, item.monthlyPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('programs.pricing.term')}</p>
                    <p className="heading-sm text-primary">{formatPrice(item.termCurrency, item.termPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm">{item.hours}</p>
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
