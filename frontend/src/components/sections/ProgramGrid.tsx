'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { BookOpen, Footprints, Globe, Music, Sparkles, Sun, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgramItem, programApi } from '@/lib/api';

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
    programApi.list().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  const visiblePrograms = useMemo(
    () => [...programs].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)).slice(0, 6),
    [programs]
  );

  return (
    <section className="py-20 md:py-24 bg-[#FAFAF9]" aria-label={t('common.sections.ourPrograms')}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
            {t('home.programs.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('home.programs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {visiblePrograms.map((program) => {
            const visual = visualFor(program.slug);
            const Icon = visual.icon;
            const href = `/${locale}/programs#${program.slug}`;

            return (
              <Link key={program.id} href={href} className="group">
                <Card className="h-full bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl">
                  <CardContent className="p-8 flex flex-col items-start">
                    <div className={`mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${visual.color} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4 flex-1">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
