'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

export default function HistoryPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-6">{t('about.vision.title')}</h1>
        <p className="text-lead mb-12">{t('about.vision.items.0')}</p>

        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
                21
              </div>
              <div>
                <h2 className="heading-lg mb-1">2021 — {t('about.history.founded')}</h2>
                <p className="text-body text-muted-foreground">{t('about.intro_intro')}</p>
              </div>
            </div>
            <Card className="ml-6 md:ml-20">
              <CardContent className="pt-6">
                <p className="text-body">
                  {t('about.intro_experience')}
                </p>
                <p className="text-body mt-4">
                  {t('about.philosophy.desc')}
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="heading-lg mb-6">{t('about.goals.title')}</h2>
            <ul className="space-y-4">
              {t.raw('about.goals.items').map((item: string, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-6 flex items-start gap-4">
                    <span className="text-xl font-bold text-secondary min-w-[24px]">{i + 1}</span>
                    <p className="text-body text-muted-foreground flex-1">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="heading-lg mb-6">{t('about.vision.title')}</h2>
            <ul className="space-y-4">
              {t.raw('about.vision.items').map((item: string, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-6 flex items-start gap-4">
                    <span className="text-2xl min-w-[32px]">✨</span>
                    <p className="text-body text-muted-foreground flex-1">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
