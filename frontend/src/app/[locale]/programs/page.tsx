'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Footprints, Globe, Loader2, Music, Sparkles, Sun, Zap } from 'lucide-react';
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

export default function ProgramsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programApi
      .list(locale)
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const sortedPrograms = useMemo(
    () => [...programs].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)),
    [programs]
  );

  return (
    <div className="pt-16">
      <section className="relative min-h-[220px] overflow-hidden bg-gradient-to-r from-primary to-purple-700 py-8 md:h-[340px] md:py-0">
        <div className="absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-b from-transparent via-purple-700/35 to-accent/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent via-purple-500/20 to-accent/20 blur-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs items={[{ label: t('common.nav.programs'), href: '/programs' }]} />
            <h1 className="heading-xl mb-4 text-white">{t('home.programs.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('home.programs.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-accent/20">
        <div className="container space-y-10 md:space-y-20">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading programs...
            </div>
          ) : sortedPrograms.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-10 text-center text-muted-foreground">
              Program information is being updated.
            </div>
          ) : (
            sortedPrograms.map((program, index) => {
              const visual = visualFor(program.slug);
              const Icon = visual.icon;
              const isSummerCamp = program.slug.includes('summer');

              return (
                <div key={program.id} id={program.slug} className="scroll-mt-24">
                  <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-12">
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${visual.color} text-white mb-6`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h2 className="heading-lg mb-4">{program.name}</h2>
                      {program.level && <p className="text-sm font-semibold text-primary mb-3">{program.level}</p>}
                      <p className="text-lead text-muted-foreground mb-4">{program.description}</p>
                      {program.syllabus_ref && <p className="text-body text-muted-foreground mb-6">{program.syllabus_ref}</p>}
                      {isSummerCamp && (
                        <Link href={`/${locale}/programs/summer-camps`}>
                          <Button size="lg">{t('common.buttons.learnMore')}</Button>
                        </Link>
                      )}
                    </div>
                    <div className={`overflow-hidden rounded-2xl shadow-xl ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      {program.cover_image ? (
                        <img src={program.cover_image} alt={program.name} className="h-64 w-full object-cover sm:h-80 md:h-[400px]" />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-white text-muted-foreground sm:h-80 md:h-[400px]">
                          {program.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container text-center">
          <h3 className="heading-lg mb-4">{t('programs.register.title')}</h3>
          <p className="text-lead text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('programs.register.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/classes/register`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                {t('programs.register.form.submit')}
              </Button>
            </Link>
            <Link href={`/${locale}/programs/pricing`}>
              <Button variant="outline" size="lg">
                {t('programs.pricing.title')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
