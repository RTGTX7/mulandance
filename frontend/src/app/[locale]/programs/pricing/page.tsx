'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { PricingCatalogView } from '@/components/pricing/PricingCatalogView';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { type PricingCatalog, type SchoolPolicy, pricingApi, settingsApi } from '@/lib/api';

export default function ProgramPricingPage() {
  const locale = useLocale(); const t = useTranslations();
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null); const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<SchoolPolicy | null>(null);
  useEffect(() => {
    setLoading(true);
    pricingApi.publicCatalog('program', locale).then(setCatalog).catch(() => setCatalog(null)).finally(() => setLoading(false));
    settingsApi.schoolPolicy(locale).then(setPolicy).catch(() => setPolicy(null));
  }, [locale]);
  const policyHtml = useMemo(() => {
    const body = policy?.body_markdown?.replace(/^\s*#\s+[^\r\n]+\r?\n+/, '') || '';
    return body ? String(marked.parse(body)) : '';
  }, [policy]);
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f5f8]"><Loader2 className="h-5 w-5 animate-spin text-fuchsia-700" /></div>;
  const value: PricingCatalog = catalog || { kind: 'program', title: t('programs.pricing.title'), subtitle: t('programs.pricing.subtitle'), translations: {}, plans: [], blocks: [] };
  if (!value.title) value.title = t('programs.pricing.title');
  if (!value.subtitle) value.subtitle = t('programs.pricing.subtitle');
  return <>
    <PricingCatalogView catalog={value} locale={locale} />
    {policy && (
      <section className="bg-[#f7f5f8] pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="border-t border-slate-300 pt-10">
            <h2 className="text-3xl font-semibold text-slate-950">{policy.title}</h2>
            {policyHtml && <div className="prose prose-slate mt-5 max-w-none" dangerouslySetInnerHTML={{ __html: policyHtml }} />}
          </div>
        </div>
      </section>
    )}
  </>;
}
