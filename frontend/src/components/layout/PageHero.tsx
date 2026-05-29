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
    <section className="relative h-[340px] overflow-hidden bg-gradient-to-r from-primary to-purple-700">
      <div className="absolute inset-0 bg-black/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-white/25" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative z-10 px-4 text-center text-white">
          <Breadcrumbs items={[{ label: breadcrumbLabel, href: breadcrumbHref }]} />
          <h1 className="heading-xl mb-4 text-white">{title}</h1>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
