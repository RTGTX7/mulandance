'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { BookOpen, Footprints, Globe, Music, Sparkles, Sun, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgramItem, programApi } from '@/lib/api';
import { AnimatedLineHeading, RevealOnScroll } from '@/components/motion/ScrollEffects';

const iconMap = [
  { test: 'ballet', icon: Footprints, color: 'from-purple-500 to-violet-500' },
  { test: 'contemporary', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { test: 'jazz', icon: Music, color: 'from-amber-500 to-orange-500' },
  { test: 'hip-hop', icon: Zap, color: 'from-green-500 to-emerald-500' },
  { test: 'summer', icon: Sun, color: 'from-pink-500 to-rose-500' },
  { test: 'folk', icon: Globe, color: 'from-teal-500 to-emerald-500' },
];

function visualFor(slug: string) {
  return iconMap.find((item) => slug.includes(item.test)) || { icon: BookOpen, color: 'from-red-500 to-pink-500' };
}

export function ProgramGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);

  useEffect(() => {
    programApi.list(locale).then(setPrograms).catch(() => setPrograms([]));
  }, [locale]);

  const visiblePrograms = useMemo(
    () => [...programs].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)).slice(0, 6),
    [programs]
  );

  return (
    <section className="section-padding bg-white/30" aria-label={t('common.sections.ourPrograms')}>
      <div className="container mx-auto">
        <div className="mb-6 text-center md:mb-12">
          <AnimatedLineHeading text={t('home.programs.title')} className="mx-auto mb-2 md:mb-4" />
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-lg">
            {t('home.programs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          {visiblePrograms.map((program, index) => {
            const visual = visualFor(program.slug);
            const Icon = visual.icon;
            const href = `/${locale}/programs#${program.slug}`;

            return (
              <RevealOnScroll key={program.id} delay={(index % 2) * 70}>
                <Link
                  href={href}
                  className="group flex min-h-[112px] flex-col rounded-lg border border-white/70 bg-white/75 p-3 shadow-sm shadow-purple-950/5 backdrop-blur-xl transition-all hover:bg-white/90"
                >
                  <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${visual.color} text-white shadow-sm`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {program.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {program.description}
                  </p>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>

        <div className="mx-auto hidden max-w-7xl grid-cols-1 gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {visiblePrograms.map((program, index) => {
            const visual = visualFor(program.slug);
            const Icon = visual.icon;
            const href = `/${locale}/programs#${program.slug}`;

            return (
              <RevealOnScroll key={program.id} delay={(index % 3) * 90}>
                <Link href={href} className="group block h-full">
                  <Card className="h-full border-white/70 bg-white/75 shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <CardContent className="flex min-h-[164px] flex-col items-start p-4 md:min-h-[210px] md:p-6">
                      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${visual.color} text-white shadow-lg md:mb-5 md:h-12 md:w-12`}>
                        <Icon className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h3 className="mb-1.5 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl">
                        {program.name}
                      </h3>
                      <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground md:line-clamp-4 md:text-base">
                        {program.description}
                      </p>
                      <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:text-secondary transition-colors">
                        {t('common.buttons.learnMore')}
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
