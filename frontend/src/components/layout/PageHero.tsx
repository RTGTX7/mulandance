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
    <section className="relative min-h-[150px] overflow-hidden border-b border-border bg-foreground py-6 md:min-h-[280px] md:py-16">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-44 left-[12%] h-72 w-72 rounded-full border border-primary/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary/70" />
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
