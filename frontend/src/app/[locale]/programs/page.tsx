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

function detailPathFor(slug: string): string | null {
  const paths: Record<string, string> = {
    chinese: 'chinese-dance',
    folk: 'chinese-dance',
    ballet: 'ballet',
    contemporary: 'contemporary',
    jazz: 'jazz',
    'hip-hop': 'hip-hop',
    'summer-camps': 'summer-camps',
  };
  return paths[slug] || null;
}

export default function ProgramsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timedOut = false;
    setLoading(true);
    setLoadFailed(false);
    const timeout = window.setTimeout(() => {
      if (!active) return;
      timedOut = true;
      setLoading(false);
      setLoadFailed(true);
    }, 12000);

    programApi
      .list(locale)
      .then((items) => {
        if (!active || timedOut) return;
        setPrograms(items);
        setLoading(false);
      })
      .catch(() => {
        if (!active || timedOut) return;
        setPrograms([]);
        setLoadFailed(true);
        setLoading(false);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [locale, loadAttempt]);

  const sortedPrograms = useMemo(
    () => [...programs].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)),
    [programs]
  );

  return (
    <div className="pt-16">
      <section className="relative min-h-[220px] overflow-hidden border-b border-border bg-foreground py-8 md:h-[340px] md:py-0">
        <div className="absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 left-[12%] h-72 w-72 rounded-full border border-primary/45" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary/70" />
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
              {t('programs.loading')}
            </div>
          ) : loadFailed ? (
            <div role="alert" className="mx-auto max-w-lg rounded-lg border border-primary/20 bg-white p-8 text-center">
              <p className="text-muted-foreground">{t('programs.loadFailed')}</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => setLoadAttempt((current) => current + 1)}>
                {t('programs.retry')}
              </Button>
            </div>
          ) : sortedPrograms.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-10 text-center text-muted-foreground">
              {t('programs.empty')}
            </div>
          ) : (
            sortedPrograms.map((program, index) => {
              const visual = visualFor(program.slug);
              const Icon = visual.icon;
              const detailPath = detailPathFor(program.slug);

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
                      {detailPath && (
                        <Link href={`/${locale}/programs/${detailPath}`}>
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
