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
    <section className="relative overflow-hidden bg-gradient-to-r from-primary to-purple-700 py-6 text-white md:py-14">
      <div className="container relative z-10">
        <div className="grid grid-cols-4 gap-2 md:gap-5">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <RevealOnScroll key={`${stat.label}-${index}`} delay={index * 90} className="group min-w-0 text-center">
                <div className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition-all duration-300 group-hover:bg-white/25 md:mb-2 md:h-12 md:w-12">
                  <Icon className="h-4 w-4 text-secondary md:h-6 md:w-6" />
                </div>
                <p className="mb-0.5 text-lg font-bold leading-none text-white md:text-4xl md:leading-tight">
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="text-[11px] font-medium leading-tight text-white/80 md:text-base md:leading-snug">{stat.label}</p>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
