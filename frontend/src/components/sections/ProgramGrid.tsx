'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { BookOpen, Footprints, Sparkles, Music, Zap, Globe, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const programs = [
  {
    key: 'chinese',
    icon: BookOpen,
    hrefKey: '/programs#chinese',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
  },
  {
    key: 'folk',
    icon: Globe,
    hrefKey: '/programs#folk',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
  },
  {
    key: 'ballet',
    icon: Footprints,
    hrefKey: '/programs#ballet',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'contemporary',
    icon: Sparkles,
    hrefKey: '/programs#contemporary',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'jazz',
    icon: Music,
    hrefKey: '/programs#jazz',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  {
    key: 'hiphop',
    icon: Zap,
    hrefKey: '/programs#hiphop',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
  },
];

export function ProgramGrid() {
  const t = useTranslations();
  const locale = useLocale();

  const getHref = (hrefKey: string) => `/${locale}${hrefKey}`;

  return (
    <section className="section-padding bg-background" aria-label={t('common.sections.ourPrograms')}>
      <div className="container">
        <div className="text-center mb-16">
          <span className="label-tag-secondary mb-4 inline-block">{t('common.appName')}</span>
          <h2 className="heading-lg md:heading-xl mb-4 text-foreground">
            {t('home.programs.title')}
          </h2>
          <p className="text-lead max-w-2xl mx-auto text-muted-foreground">
            {t('home.programs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {programs.map((program) => {
            const Icon = program.icon;
            const title = t(`home.programs.${program.key}`);
            const desc = t(`home.programs.${program.key}Desc`);
            const href = getHref(program.hrefKey);

            return (
              <Link key={program.key} href={href}>
                <Card className="card-hover h-full group cursor-pointer border-0 shadow-soft">
                  <CardHeader className="pb-4">
                    <div className={`mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${program.color} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="heading-sm text-foreground">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-5 leading-relaxed">{desc}</p>
                    <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:text-secondary transition-colors">
                      {t('common.buttons.learnMore')}
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href={getHref('/programs')}>
            <Button variant="outline" size="lg" className="border-2">
              {t('common.buttons.viewAll')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
