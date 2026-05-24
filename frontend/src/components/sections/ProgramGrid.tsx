'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import {
  Feather,
  Music,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const programs = [
  {
    key: 'ballet',
    icon: Feather,
    href: '/programs/ballet',
  },
  {
    key: 'contemporary',
    icon: Sparkles,
    href: '/programs/contemporary',
  },
  {
    key: 'chinese',
    icon: Trophy,
    href: '/programs/chinese-dance',
  },
  {
    key: 'jazz',
    icon: Music,
    href: '/programs/jazz',
  },
  {
    key: 'hiphop',
    icon: Music,
    href: '/programs/hip-hop',
  },
  {
    key: 'summer',
    icon: Sparkles,
    href: '/programs/summer-camps',
  },
];

export function ProgramGrid() {
  const t = useTranslations();

  return (
    <section className="section-padding bg-card/50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-3">{t('home.programs.title')}</h2>
          <p className="text-lead max-w-2xl mx-auto">
            {t('home.programs.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => {
            const Icon = program.icon;
            const title = t(`home.programs.${program.key}`);
            const desc = t(`home.programs.${program.key}Desc`);

            return (
              <Link key={program.key} href={program.href}>
                <Card className="card-hover h-full group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="heading-sm">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {desc}
                    </p>
                    <span className="text-sm font-medium text-secondary group-hover:underline">
                      {t('common.buttons.learnMore')} &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/programs">
            <Button variant="outline" size="lg">
              {t('home.programs.viewAll')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
