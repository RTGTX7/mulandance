'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { BookOpen, Footprints, Sparkles, Music, Zap, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const programs = [
  {
    key: 'chinese',
    icon: BookOpen,
    hrefKey: '/programs#chinese',
    color: 'from-red-500 to-pink-500',
  },
  {
    key: 'folk',
    icon: Globe,
    hrefKey: '/programs#folk',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    key: 'ballet',
    icon: Footprints,
    hrefKey: '/programs#ballet',
    color: 'from-purple-500 to-violet-500',
  },
  {
    key: 'contemporary',
    icon: Sparkles,
    hrefKey: '/programs#contemporary',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'jazz',
    icon: Music,
    hrefKey: '/programs#jazz',
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'hiphop',
    icon: Zap,
    hrefKey: '/programs#hiphop',
    color: 'from-green-500 to-emerald-500',
  },
];

export function ProgramGrid() {
  const t = useTranslations();
  const locale = useLocale();

  const getHref = (hrefKey: string) => `/${locale}${hrefKey}`;

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
          {programs.map((program) => {
            const Icon = program.icon;
            const title = t(`home.programs.${program.key}`);
            const desc = t(`home.programs.${program.key}Desc`);
            const href = getHref(program.hrefKey);

            return (
              <Link key={program.key} href={href} className="group">
                <Card className="h-full bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl">
                  <CardContent className="p-8 flex flex-col items-start">
                    <div className={`mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${program.color} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4 flex-1">
                      {desc}
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
