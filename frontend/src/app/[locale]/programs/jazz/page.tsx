'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Clock, Users, Award } from 'lucide-react';

export default function JazzPage() {
  const t = useTranslations();
  const locale = useLocale();
  const registerHref = `/${locale}/classes/register`;

  const features = [
    { icon: CheckCircle, title: t('programs.jazz.features.broadway'), desc: t('programs.jazz.features.broadwayDesc') },
    { icon: Clock, title: t('programs.jazz.features.commercial'), desc: t('programs.jazz.features.commercialDesc') },
    { icon: Users, title: t('programs.jazz.features.lyrical'), desc: t('programs.jazz.features.lyricalDesc') },
    { icon: Award, title: t('programs.jazz.features.performances'), desc: t('programs.jazz.features.performancesDesc') },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[400px] bg-gradient-to-r from-amber-600 to-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.programs'), href: '/programs' },
                { label: t('programs.jazz.title'), href: '/programs/jazz' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('programs.jazz.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {t('programs.jazz.description')}
            </p>
            <Link href={registerHref}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                {t('common.buttons.register')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="heading-lg mb-6">{t('programs.jazz.title')}</h2>
              <p className="text-lead text-muted-foreground mb-6">
                {t('programs.jazz.description')}
              </p>
              <p className="text-body text-muted-foreground">
                {t('programs.jazzDesc')}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src="/programs/jazz.jpg" alt="Jazz Dance" className="w-full h-[400px] object-cover" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="heading-lg text-center mb-12">{t('programs.jazz.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="text-center">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mx-auto mb-4">
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="heading-sm">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Levels Section */}
          <div className="bg-accent/30 rounded-2xl p-8 mb-12">
            <h2 className="heading-lg mb-8 text-center">{t('programs.levels.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.children')}</h3>
                <p className="text-muted-foreground">Ages 7-12. Introduction to jazz technique and performance skills.</p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.teens')}</h3>
                <p className="text-muted-foreground">Ages 13-17. Advanced jazz technique and commercial dance styles.</p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.adults')}</h3>
                <p className="text-muted-foreground">Ages 18+. All levels welcome. Commercial jazz and Broadway styles.</p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.preProfessional')}</h3>
                <p className="text-muted-foreground">Advanced students pursuing professional dance careers.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="heading-md mb-4">{t('programs.register.title')}</h3>
            <p className="text-lead text-muted-foreground mb-8 max-w-xl mx-auto">
              {t('programs.register.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={registerHref}>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  {t('programs.register.form.submit')}
                </Button>
              </Link>
              <Link href="/classes/pricing">
                <Button variant="outline" size="lg">
                  {t('programs.pricing.title')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
