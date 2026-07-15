'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { ExhibitHeading, ExhibitReveal } from '@/components/motion/ExhibitMotion';
import { type HomepageSection, type ProgramItem, homepageApi, programApi } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
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

function courseHref(locale: string, program: ProgramItem) {
  const detailPath = detailPathFor(program.slug);
  return detailPath ? `/${locale}/programs/${detailPath}` : `/${locale}/programs#${program.slug}`;
}

function ProgramMedia({ program, className }: { program: ProgramItem; className?: string }) {
  const mediaUrl = toPublicMediaUrl(program.cover_image || '');

  if (mediaUrl && isVideoUrl(mediaUrl)) {
    return <video src={mediaUrl} className={cn('h-full w-full object-cover', className)} muted loop playsInline autoPlay />;
  }

  if (mediaUrl) {
    return <div className={cn('h-full w-full bg-cover bg-center', className)} style={{ backgroundImage: `url(${mediaUrl})` }} />;
  }

  return <div className={cn('flex h-full w-full items-end bg-[#2b1a2c] p-6 font-heading text-3xl font-semibold text-white', className)}>{program.name}</div>;
}

export function ProgramGrid({ sectionOverride, limit, category, sort = 'default' }: { sectionOverride?: HomepageSection; limit?: number; category?: string; sort?: 'default' | 'newest' | 'oldest' | 'manual' } = {}) {
  const t = useTranslations();
  const locale = useLocale();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [section, setSection] = useState<HomepageSection | null>(sectionOverride || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    programApi
      .list(locale)
      .then((items) => {
        if (active) setPrograms(items);
      })
      .catch(() => {
        if (active) setPrograms([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (sectionOverride) { setSection(sectionOverride); return; }
    let active = true;
    homepageApi.get(locale)
      .then((settings) => {
        if (active) setSection(settings.sections.programs);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [locale, sectionOverride]);

  const orderedPrograms = useMemo(
    () => [...programs]
      .filter((item) => !category || item.category?.toLowerCase() === category.toLowerCase() || item.slug?.toLowerCase() === category.toLowerCase())
      .sort((a, b) => sort === 'oldest' ? b.order_index - a.order_index : a.order_index - b.order_index || a.name.localeCompare(b.name))
      .slice(0, limit || undefined),
    [programs, limit, category, sort]
  );

  if (section && !section.is_enabled) return null;

  return (
    <section className="exhibit-programs section-padding" aria-label={t('common.sections.ourPrograms')}>
      <div className="container">
        <ExhibitReveal className="mb-10 text-center md:mb-16" distance={24}>
          <div className="mx-auto max-w-3xl">
            <ExhibitHeading align="center" className="mx-auto mb-3">{section?.title || t('home.programs.title')}</ExhibitHeading>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-lg">{section?.subtitle || t('home.programs.subtitle')}</p>
            <Link href={`/${locale}/programs`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground">
              {section?.link_label || t('common.buttons.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ExhibitReveal>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('programs.loading')}
          </div>
        ) : orderedPrograms.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t('programs.empty')}</p>
        ) : (
          <div className="border-t border-primary/15">
            {orderedPrograms.map((program, index) => {
              const mediaOnRight = index % 2 === 0;
              return (
                <article key={program.id} className="program-exhibit-row grid border-b border-primary/15 py-7 md:grid-cols-12 md:items-center md:gap-8 md:py-12 lg:gap-12">
                  <ExhibitReveal
                    className={cn('order-2 md:col-span-6', mediaOnRight ? 'md:order-1' : 'md:order-2')}
                    from={mediaOnRight ? 'left' : 'right'}
                    distance={36}
                  >
                    <div className="max-w-xl">
                      <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-primary">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <span className="h-px w-8 bg-primary/35" />
                        <span>{program.level || program.category}</span>
                      </div>
                      <h3 className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-5xl">{program.name}</h3>
                      <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">{program.description}</p>
                      {program.syllabus_ref && <p className="mt-3 text-sm leading-6 text-muted-foreground">{program.syllabus_ref}</p>}
                      <Link href={courseHref(locale, program)} className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-foreground">
                        {t('common.buttons.learnMore')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </ExhibitReveal>

                  <ExhibitReveal
                    className={cn('order-1 mb-6 md:col-span-6 md:mb-0', mediaOnRight ? 'md:order-2' : 'md:order-1')}
                    delay={0.08}
                    from={mediaOnRight ? 'right' : 'left'}
                    distance={36}
                  >
                    <Link href={courseHref(locale, program)} className="program-exhibit-media group relative block aspect-[16/10] overflow-hidden rounded-md bg-[#2b1a2c]">
                      <ProgramMedia program={program} className="transition-transform duration-700 group-hover:scale-[1.035]" />
                      <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/5" />
                      <span className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-md border border-white/70 bg-black/20 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </ExhibitReveal>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
