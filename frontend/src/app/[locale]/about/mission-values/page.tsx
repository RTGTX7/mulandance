import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

export default function MissionValuesPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-6">{t('about.philosophy.title')}</h1>
        <p className="text-lead mb-8">
          {t('about.philosophy.heading')}
        </p>
        <p className="text-body text-muted-foreground mb-12">
          {t('about.philosophy.desc')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/5 to-purple-400/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="heading-md mb-4 text-primary">{t('about.title')}</h3>
              <p className="text-body">{t('about.intro_intro')}</p>
              <p className="text-body mt-4">{t('about.intro_experience')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/5 to-amber-400/5 border-secondary/20">
            <CardContent className="pt-6">
              <h3 className="heading-md mb-4 text-secondary">{t('about.goals.title')}</h3>
              <ul className="space-y-2 text-body">
                {t.raw('about.goals.items').map((item: string, i: number) => (
                  <li key={i}>
                    <span className="text-secondary mr-2">★</span>{item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="heading-lg mb-6">{t('about.vision.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.raw('about.vision.items').map((item: string, i: number) => (
              <Card key={i} className="border-primary/10">
                <CardContent className="pt-6 flex items-start gap-4">
                  <span className="text-2xl text-secondary mt-1">✦</span>
                  <p className="text-body flex-1">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
