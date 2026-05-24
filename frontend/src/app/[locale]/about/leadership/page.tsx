'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Achievement arrays for Kayley and Hailey
const kayleyAchievements = [
  "2022 Shandong Children's Spring Gala Outstanding Choreography Director",
  "China-Korea Street Dance Exchange Competition Third Prize",
  "Invited Guest at China Dance Festival",
  "Invited Guest at Beijing Yukou Cultural Festival",
  "Invited Guest at Tangshan May Fourth Youth Day",
  "Top 8 at 'Keep the Love' Freestyle Competition",
  "Top 8 at Qingdao Battle of the Wings 2v2 Freestyle",
  "Runner-up at Weifang Dance Out Miracles Group Competition",
  "Personal resume included in China Youth Talent Database",
  "Studied at Dance邦, HelloDance, Old Dog and other renowned dance studios",
  "Collaborated with artists: Zhuo Hai Tun, Wang OK, Li Tianze, Li Peiling, Park Jae-jung, Zhou Shen, Zhang Yuzi Stage 2023 Finals"
];

const haileyAchievements = [
  "Top 24 at Youth America Grand Prix",
  "Highest-scoring acro audition at Candance 2024",
  "Top 5 overall with jazz solo 2024",
  "Strong styles: Ballet, Jazz, and Acro",
  "Acro is a particular passion with extensive teaching experience"
];

export default function LeadershipPage() {
  const t = useTranslations();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[300px] bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.about'), href: '/about' },
                { label: t('about.leadership.title'), href: '/about/leadership' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('about.leadership.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('about.leadership.founderRole')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container">
          {/* Faculty Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Founder */}
            <Card>
              <CardHeader>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto mb-4" />
                <CardTitle className="text-center">{t('about.leadership.founder')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-primary font-semibold mb-2">{t('about.leadership.founderRole')}</p>
                <p className="text-muted-foreground">{t('about.leadership.founderDesc')}</p>
              </CardContent>
            </Card>

            {/* Kayley */}
            <Card>
              <CardHeader>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mx-auto mb-4" />
                <CardTitle className="text-center">{t('about.leadership.kayley')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-primary font-semibold mb-2">{t('about.leadership.kayleyRole')}</p>
                <p className="text-muted-foreground mb-4">{t('about.leadership.kayleyDesc')}</p>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground mb-2">Achievements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {kayleyAchievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Hailey Smith */}
            <Card>
              <CardHeader>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 mx-auto mb-4" />
                <CardTitle className="text-center">{t('about.leadership.hailey')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-primary font-semibold mb-2">{t('about.leadership.haileyRole')}</p>
                <p className="text-muted-foreground mb-4">{t('about.leadership.haileyDesc')}</p>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground mb-2">Achievements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {haileyAchievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Link href="/about/contact">
              <Button size="lg">{t('about.contact.title')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}