'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Users, Award, CalendarDays, Users as TeacherIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { homepageApi, type HomepageStat } from '@/lib/api';
import { AnimatedNumber, RevealOnScroll } from '@/components/motion/ScrollEffects';

const stats = [
  {
    icon: Users,
    value: '200+',
    labelKey: 'home.stats.students',
  },
  {
    icon: CalendarDays,
    value: '5+',
    labelKey: 'home.stats.years',
  },
  {
    icon: Award,
    value: '100+',
    labelKey: 'home.stats.performances',
  },
  {
    icon: TeacherIcon,
    value: '5+',
    labelKey: 'home.stats.teachers',
  },
];

export function StatsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [customStats, setCustomStats] = useState<HomepageStat[] | null>(null);
  const displayStats = useMemo(() => {
    if (!customStats?.length) {
      return stats.map((stat) => ({ ...stat, label: t(stat.labelKey) }));
    }

    return customStats.slice(0, 4).map((stat, index) => ({
      icon: stats[index]?.icon || Users,
      value: stat.value,
      label: stat.label,
    }));
  }, [customStats, t]);

  useEffect(() => {
    homepageApi
      .get(locale)
      .then((settings) => {
        if (settings.stats.length > 0) setCustomStats(settings.stats);
      })
      .catch(() => {});
  }, [locale]);

  return (
    <section className="stats-glass-band relative overflow-hidden py-5 text-white md:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(88,28,135,0.82),rgba(126,58,242,0.72)_48%,rgba(88,28,135,0.78)),radial-gradient(circle_at_22%_12%,rgba(255,255,255,0.20),transparent_26%),radial-gradient(circle_at_78%_90%,rgba(245,158,11,0.13),transparent_30%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-white/[0.035] backdrop-blur-[2px]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/28" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/16" aria-hidden="true" />
      <div className="stats-scanline absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
      <div className="container relative z-10">
        <div className="grid grid-cols-4 gap-2 md:gap-5">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <RevealOnScroll key={`${stat.label}-${index}`} delay={index * 90} className="group min-w-0 text-center">
                <div className="stats-glass-card mx-auto flex min-h-[92px] max-w-[8.5rem] flex-col items-center justify-center px-2 py-2 transition-all duration-300 group-hover:-translate-y-0.5 md:min-h-[126px] md:max-w-none md:px-4 md:py-4">
                  <div className="stats-candy-icon relative mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/16 backdrop-blur-xl md:mb-3 md:h-12 md:w-12">
                    <span className="absolute inset-0 rounded-2xl bg-secondary/18 blur-md" />
                    <span className="absolute inset-[1px] rounded-2xl bg-white/12" />
                    <Icon className="relative h-4 w-4 text-secondary md:h-6 md:w-6" />
                  </div>
                  <p className="stats-number stats-glass-text mb-0.5 text-lg font-bold leading-none text-white md:text-4xl md:leading-tight">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="stats-label-glass mx-auto max-w-[5.5rem] text-[10px] font-semibold leading-tight text-white/80 md:max-w-none md:text-base md:leading-snug">
                    {stat.label}
                  </p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
