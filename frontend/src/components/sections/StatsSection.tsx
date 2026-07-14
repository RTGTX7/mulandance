'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Users, Award, CalendarDays, Users as TeacherIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { homepageApi, type HomepageStat } from '@/lib/api';
import { AnimatedNumber } from '@/components/motion/ScrollEffects';
import { ExhibitReveal } from '@/components/motion/ExhibitMotion';

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
    <section className="homepage-stat-band relative border-y border-primary/10 bg-white py-7 md:py-12">
      <div className="container relative z-10">
        <div className="grid grid-cols-4 gap-2 md:gap-5">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <ExhibitReveal key={`${stat.label}-${index}`} delay={index * 0.09} className="group min-w-0 text-center" from={index % 2 === 0 ? 'bottom' : 'top'} distance={24}>
                <div className="mx-auto flex min-h-[92px] max-w-[8.5rem] flex-col items-center justify-center px-2 py-2 transition-transform duration-300 group-hover:-translate-y-1 md:min-h-[126px] md:max-w-none md:px-4 md:py-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-primary/15 bg-accent text-primary md:mb-3 md:h-12 md:w-12">
                    <Icon className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                  <p className="mb-0.5 text-lg font-bold leading-none text-foreground md:text-4xl md:leading-tight">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="mx-auto max-w-[5.5rem] text-[10px] font-medium leading-tight text-muted-foreground md:max-w-none md:text-base md:leading-snug">
                    {stat.label}
                  </p>
                </div>
              </ExhibitReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
