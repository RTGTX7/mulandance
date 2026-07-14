'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PricingCatalogView } from '@/components/pricing/PricingCatalogView';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { type PricingCatalog, pricingApi } from '@/lib/api';

export default function ClassroomPricingPage() {
  const locale = useLocale(); const t = useTranslations();
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); pricingApi.publicCatalog('rental', locale).then(setCatalog).catch(() => setCatalog(null)).finally(() => setLoading(false)); }, [locale]);
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f5f8]"><Loader2 className="h-5 w-5 animate-spin text-fuchsia-700" /></div>;
  const value: PricingCatalog = catalog || { kind: 'rental', title: t('classroomsPage.pricingTitle'), subtitle: t('classroomsPage.pricingSubtitle'), translations: {}, plans: [], blocks: [] };
  if (!value.title) value.title = t('classroomsPage.pricingTitle');
  if (!value.subtitle) value.subtitle = t('classroomsPage.pricingSubtitle');
  return <PricingCatalogView catalog={value} locale={locale} />;
}
