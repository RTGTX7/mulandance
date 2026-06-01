'use client';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

interface PageHeroProps {
  breadcrumbLabel: string;
  breadcrumbHref: string;
  title: string;
  subtitle?: string;
}

export function PageHero({ breadcrumbLabel, breadcrumbHref, title, subtitle }: PageHeroProps) {
  return (
    <section className="relative min-h-[168px] overflow-hidden bg-gradient-to-r from-primary to-purple-700 py-8 md:min-h-[280px] md:py-16">
      <div className="absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-white/25" />
      <div className="relative z-10 flex min-h-[136px] items-center justify-center md:min-h-[240px]">
        <div className="px-4 text-center text-white">
          <Breadcrumbs items={[{ label: breadcrumbLabel, href: breadcrumbHref }]} />
          <h1 className="heading-xl mb-2 text-white md:mb-4">{title}</h1>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/90 md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
