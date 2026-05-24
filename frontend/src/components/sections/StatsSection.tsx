'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Users, Award, CalendarDays, Star } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '2,000+',
    labelKey: 'home.stats.students',
  },
  {
    icon: Award,
    value: '40',
    labelKey: 'home.stats.years',
  },
  {
    icon: CalendarDays,
    value: '50+',
    labelKey: 'home.stats.performances',
  },
  {
    icon: Star,
    value: '35',
    labelKey: 'home.stats.faculty',
  },
];

export function StatsSection() {
  const t = useTranslations();

  return (
    <section className="py-16 bg-primary text-white">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.labelKey} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                  <Icon className="h-6 w-6 text-secondary" />
                </div>
                <p className="heading-lg text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/70">{t(stat.labelKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
