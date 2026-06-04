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
    <section className="relative min-h-[150px] overflow-hidden bg-gradient-to-br from-primary via-purple-700 to-accent/80 py-6 md:min-h-[280px] md:py-16">
      <div className="absolute inset-0 bg-black/20" />
      <div className="pointer-events-none absolute inset-x-4 bottom-0 top-8 rounded-[2rem] bg-white/10 blur-3xl md:inset-x-16" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-white/25" />
      <div className="relative z-10 flex min-h-[118px] items-center justify-center md:min-h-[240px]">
        <div className="max-w-3xl px-4 text-center text-white">
          <Breadcrumbs items={[{ label: breadcrumbLabel, href: breadcrumbHref }]} />
          <h1 className="heading-xl mb-2 text-balance text-white md:mb-4">{title}</h1>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/[0.88] md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
