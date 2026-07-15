'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/ui/i18n-client';
import { HomepageRenderer } from '@/components/homepage-v2/HomepageRenderer';
import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { StatsSection } from '@/components/sections/StatsSection';
import { ProgramGrid } from '@/components/sections/ProgramGrid';
import { EventCards } from '@/components/sections/EventCards';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { CTABanner } from '@/components/sections/CTABanner';
import { type HomepageDocumentV2, homepageV2Api } from '@/lib/api';

export default function HomePage() {
  const locale = useLocale();
  const [document, setDocument] = useState<HomepageDocumentV2 | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    homepageV2Api.get(locale)
      .then((value) => { if (active) setDocument(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [locale]);

  if (document) return <HomepageRenderer document={document} locale={locale} />;
  if (failed) return <><HeroCarousel /><StatsSection /><EventCards /><ProgramGrid /><NewsGrid /><CTABanner /></>;
  return <div className="min-h-[70vh] bg-[#f6f2f7]" aria-busy="true" />;
}
