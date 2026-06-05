'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProgramItem, programApi } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';
import { AnimatedLineHeading, RevealOnScroll } from '@/components/motion/ScrollEffects';

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function ProgramCard({ program, href, compact = false }: { program: ProgramItem; href: string; compact?: boolean }) {
  const t = useTranslations();
  const mediaUrl = toPublicMediaUrl(program.cover_image || '');

  return (
    <Link
      href={href}
      className={`program-media-card homepage-glass-card group flex flex-col justify-end overflow-hidden ${
        compact ? 'min-h-[136px] p-3' : 'min-h-[216px] p-5 md:min-h-[242px] md:p-6'
      }`}
    >
      {mediaUrl && (
        isVideoUrl(mediaUrl) ? (
          <video
            src={mediaUrl}
            className="program-card-media h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-105"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <div
            className="program-card-media bg-cover bg-center opacity-95 transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${mediaUrl})` }}
          />
        )
      )}
      <div
        className={
          mediaUrl
            ? 'program-card-shade bg-[rgba(10,8,18,0.30)]'
            : 'program-card-shade bg-transparent'
        }
      />
      <div className={`program-copy-glass ${compact ? 'min-h-[100px]' : 'min-h-[156px] md:min-h-[160px]'} flex flex-col justify-start`}>
        <h3 className={`${compact ? 'min-h-[34px] text-sm' : 'min-h-[50px] text-lg md:min-h-[56px] md:text-xl'} program-glass-title line-clamp-2 font-semibold leading-snug transition-colors`}>
          {program.name}
        </h3>
        <p className={`${compact ? 'mt-1 line-clamp-2 text-xs' : 'mt-2 line-clamp-3 text-sm md:text-base'} program-glass-summary leading-relaxed`}>
          {program.description}
        </p>
        <span className={`${compact ? 'mt-auto pt-2 text-xs' : 'mt-auto pt-4 text-sm'} program-glass-link inline-flex items-center gap-2 font-semibold transition-colors`}>
          {t('common.buttons.learnMore')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
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
    <section className="section-padding homepage-glass-section" aria-label={t('common.sections.ourPrograms')}>
      <div className="container mx-auto">
        <div className="homepage-glass-heading mb-6 px-4 py-4 text-center md:mb-10 md:px-8 md:py-5">
          <AnimatedLineHeading text={t('home.programs.title')} className="mx-auto mb-2 md:mb-4" />
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-lg">
            {t('home.programs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          {visiblePrograms.map((program, index) => {
            const href = `/${locale}/programs#${program.slug}`;

            return (
              <RevealOnScroll key={program.id} delay={(index % 2) * 70}>
                <ProgramCard program={program} href={href} compact />
              </RevealOnScroll>
            );
          })}
        </div>

        <div className="mx-auto hidden max-w-7xl grid-cols-1 gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {visiblePrograms.map((program, index) => {
            const href = `/${locale}/programs#${program.slug}`;

            return (
              <RevealOnScroll key={program.id} delay={(index % 3) * 90}>
                <ProgramCard program={program} href={href} />
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
