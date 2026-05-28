'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Footprints, Sparkles, Music, Zap, Globe, Sun } from 'lucide-react';

export default function ProgramsPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[340px] bg-gradient-to-r from-primary to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-b from-transparent via-purple-700/35 to-accent/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent via-purple-500/20 to-accent/20 blur-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.programs'), href: '/programs' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('home.programs.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('home.programs.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Programs Section */}
      <section className="section-padding bg-accent/20">
        <div className="container space-y-20">
          {/* Chinese Dance */}
          <div id="chinese" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-white mb-6">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.chinese')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.chineseDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.chinese.description')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/chinese-dance.jpg" alt="Chinese Dance" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Folk Dance */}
          <div id="folk" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white mb-6">
                  <Globe className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.folk')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.folkDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.folkDesc')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/folk-dance.jpg" alt="Folk Dance" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Ballet */}
          <div id="ballet" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 text-white mb-6">
                  <Footprints className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.ballet')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.balletDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.ballet.description')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/ballet.jpg" alt="Ballet" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Contemporary */}
          <div id="contemporary" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-6">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.contemporary')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.contemporaryDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.contemporary.description')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/contemporary.jpg" alt="Contemporary Dance" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Jazz */}
          <div id="jazz" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-6">
                  <Music className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.jazz')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.jazzDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.jazz.description')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/jazz.jpg" alt="Jazz Dance" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Hip-Hop */}
          <div id="hiphop" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-6">
                  <Zap className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('home.programs.hiphop')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('home.programs.hiphopDesc')}
                </p>
                <p className="text-body text-muted-foreground">
                  {t('programs.hiphop.description')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/hip-hop.jpg" alt="Hip-Hop Dance" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>

          {/* Summer Camps */}
          <div id="summer-camps" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-6">
                  <Sun className="h-7 w-7" />
                </div>
                <h2 className="heading-lg mb-4">{t('programs.summer.title')}</h2>
                <p className="text-lead text-muted-foreground mb-4">
                  {t('programs.summer.description')}
                </p>
                <p className="text-body text-muted-foreground mb-6">
                  {t('programs.summerDesc')}
                </p>
                <Link href={`/${locale}/programs/summer-camps`}>
                  <Button size="lg">
                    {t('common.buttons.learnMore')}
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/programs/summer-camps.jpg" alt="Summer Camps" className="w-full h-[400px] object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-background">
        <div className="container text-center">
          <h3 className="heading-lg mb-4">{t('programs.register.title')}</h3>
          <p className="text-lead text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('programs.register.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classes/register">
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
      </section>
    </div>
  );
}
