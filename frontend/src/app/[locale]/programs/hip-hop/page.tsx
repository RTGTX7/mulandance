'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Clock, Users, Award } from 'lucide-react';

export default function HipHopPage() {
  const t = useTranslations();
  const locale = useLocale();
  const registerHref = `/${locale}/classes/register`;

  const features = [
    { icon: CheckCircle, title: t('programs.hiphop.features.fundamentals'), desc: t('programs.hiphop.features.fundamentalsDesc') },
    { icon: Clock, title: t('programs.hiphop.features.choreography'), desc: t('programs.hiphop.features.choreographyDesc') },
    { icon: Users, title: t('programs.hiphop.features.freestyle'), desc: t('programs.hiphop.features.freestyleDesc') },
    { icon: Award, title: t('programs.hiphop.features.styles'), desc: t('programs.hiphop.features.stylesDesc') },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[270px] overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 py-8 md:h-[400px] md:py-0">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.programs'), href: '/programs' },
                { label: t('programs.hiphop.title'), href: '/programs/hip-hop' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('programs.hiphop.title')}</h1>
            <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/90 md:mb-8 md:text-xl">
              {t('programs.hiphop.description')}
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
          <div className="mb-10 grid grid-cols-1 items-center gap-6 md:mb-16 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="heading-lg mb-6">{t('programs.hiphop.title')}</h2>
              <p className="text-lead text-muted-foreground mb-6">
                {t('programs.hiphop.description')}
              </p>
              <p className="text-body text-muted-foreground">
                {t('programs.hiphopDesc')}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img src="/programs/hip-hop.jpg" alt="Hip-Hop Dance" className="h-64 w-full object-cover sm:h-80 md:h-[400px]" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="heading-lg text-center mb-12">{t('programs.hiphop.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="text-center">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mx-auto mb-4">
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
                <p className="text-muted-foreground">Ages 6-12. Introduction to hip-hop basics and street dance styles.</p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.teens')}</h3>
                <p className="text-muted-foreground">Ages 13-17. Advanced technique, choreography, and freestyle skills.</p>
              </div>
              <div className="bg-background rounded-xl p-6 shadow-sm">
                <h3 className="heading-sm font-semibold mb-3">{t('programs.levels.adults')}</h3>
                <p className="text-muted-foreground">Ages 18+. All levels welcome. Fun and energetic hip-hop classes.</p>
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
              <Link href={`/${locale}/programs/pricing`}>
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
