'use client';

import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/components/ui/i18n-client';
import { settingsApi } from '@/lib/api';

type ClassroomPricingItem = {
  key: 'large' | 'small';
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

const defaultPricing: ClassroomPricingItem[] = [
  {
    key: 'large',
    hourlyCurrency: '$',
    hourlyPrice: '80',
    hourlyTime: 'hour',
    halfDayCurrency: '$',
    halfDayPrice: '280',
    halfDayTime: '4 hours',
    fullDayCurrency: '$',
    fullDayPrice: '520',
    fullDayTime: 'day',
  },
  {
    key: 'small',
    hourlyCurrency: '$',
    hourlyPrice: '45',
    hourlyTime: 'hour',
    halfDayCurrency: '$',
    halfDayPrice: '160',
    halfDayTime: '4 hours',
    fullDayCurrency: '$',
    fullDayPrice: '300',
    fullDayTime: 'day',
  },
];

function splitLegacyPriceTime(value: unknown) {
  const raw = String(value || '').trim();
  const currencyMatch = raw.match(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i);
  const currency = currencyMatch?.[1] || '$';
  const text = raw.replace(/^(C\$|CA\$|CAD|USD|[$￥¥])\s*/i, '');
  const [price = '', time = ''] = text.split('/').map((part) => part.trim());
  return { currency, price, time };
}

function normalizePricing(items: unknown[]): ClassroomPricingItem[] {
  return items.map((raw) => {
    const item = raw as Partial<ClassroomPricingItem> & {
      hourly?: string;
      halfDay?: string;
      fullDay?: string;
    };
    const hourly = splitLegacyPriceTime(item.hourly);
    const halfDay = splitLegacyPriceTime(item.halfDay);
      const fullDay = splitLegacyPriceTime(item.fullDay);
    return {
      key: item.key === 'small' ? 'small' : 'large',
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

function formatPrice(currency: string, price: string, time: string) {
  const symbol = currency.trim() || '$';
  const amount = price.trim();
  const unit = time.trim();
  if (!amount && !unit) return '';
  if (!unit) return `${symbol}${amount}`;
  return `${symbol}${amount} / ${unit}`;
}

export default function ClassroomPricingPage() {
  const t = useTranslations();
  const [pricing, setPricing] = useState<ClassroomPricingItem[]>(defaultPricing);

  useEffect(() => {
    settingsApi
      .site()
      .then((settings) => {
        if (!settings.classroom_pricing_json) return;
        const parsed = JSON.parse(settings.classroom_pricing_json);
        if (Array.isArray(parsed)) {
          setPricing(normalizePricing(parsed));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="section-padding bg-slate-100">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('classroomsPage.title'), href: 'classrooms' }]} />
        <h1 className="heading-xl mb-4">{t('classroomsPage.pricingTitle')}</h1>
        <p className="text-lead mb-10">{t('classroomsPage.pricingSubtitle')}</p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {pricing.map((item) => (
            <Card key={item.key} className="rounded-lg">
              <CardHeader>
                <CardTitle>{t(`classroomsPage.rooms.${item.key}.label`)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t(`classroomsPage.rooms.${item.key}.description`)}
                </p>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <dt className="font-medium">{t('classroomsPage.pricingHourly')}</dt>
                    <dd className="text-lg font-semibold text-primary">{formatPrice(item.hourlyCurrency, item.hourlyPrice, item.hourlyTime)}</dd>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <dt className="font-medium">{t('classroomsPage.pricingHalfDay')}</dt>
                    <dd className="text-lg font-semibold text-primary">{formatPrice(item.halfDayCurrency, item.halfDayPrice, item.halfDayTime)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">{t('classroomsPage.pricingFullDay')}</dt>
                    <dd className="text-lg font-semibold text-primary">{formatPrice(item.fullDayCurrency, item.fullDayPrice, item.fullDayTime)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 rounded-lg">
          <CardContent className="pt-6">
            <h2 className="heading-sm mb-3">{t('classroomsPage.pricingNotesTitle')}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>- {t('classroomsPage.pricingNoteRequest')}</li>
              <li>- {t('classroomsPage.pricingNotePayment')}</li>
              <li>- {t('classroomsPage.pricingNoteCleaning')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
