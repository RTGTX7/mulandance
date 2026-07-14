'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/ui/i18n-client';
import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { StatsSection } from '@/components/sections/StatsSection';
import { ProgramGrid } from '@/components/sections/ProgramGrid';
import { EventCards } from '@/components/sections/EventCards';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { CTABanner } from '@/components/sections/CTABanner';
import { HomepageMediaBlock } from '@/components/sections/HomepageMediaBlock';
import { type HomepageBlock, homepageApi } from '@/lib/api';

const fallback: HomepageBlock[] = [
  { id: 'hero', type: 'hero', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
  { id: 'stats', type: 'stats', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
  { id: 'performances', type: 'performances', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
  { id: 'programs', type: 'programs', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
  { id: 'news', type: 'news', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
  { id: 'cta', type: 'cta', title: '', subtitle: '', body: '', media_url: '', media_type: 'auto', layout: 'default', link: { label: '', href: '' }, is_enabled: true },
];

export default function HomePage() {
  const locale = useLocale(); const [blocks, setBlocks] = useState(fallback);
  useEffect(() => { homepageApi.get(locale).then((settings) => setBlocks(settings.blocks?.length ? settings.blocks : fallback)).catch(() => {}); }, [locale]);
  return <>{blocks.filter((block) => block.is_enabled).map((block) => {
    if (block.type === 'hero') return <HeroCarousel key={block.id} />;
    if (block.type === 'stats') return <StatsSection key={block.id} />;
    if (block.type === 'performances') return <EventCards key={block.id} />;
    if (block.type === 'programs') return <ProgramGrid key={block.id} />;
    if (block.type === 'news') return <NewsGrid key={block.id} />;
    if (block.type === 'cta') return <CTABanner key={block.id} />;
    return <HomepageMediaBlock key={block.id} block={block} locale={locale} />;
  })}</>;
}
