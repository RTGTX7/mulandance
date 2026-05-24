'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Users, Award, CalendarDays, Users as TeacherIcon } from 'lucide-react';

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

  return (
    <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-purple-700 text-white relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.labelKey} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm mb-4 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-7 w-7 text-secondary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-2 text-white">{stat.value}</p>
                <p className="text-sm md:text-base text-white/80 font-medium">{t(stat.labelKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
