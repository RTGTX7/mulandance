import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CurrentSeasonPage() {
  const t = useTranslations();

  const productions = [
    {
      titleKey: 'performance.showcase.title',
      descKey: 'performance.showcase.desc',
      date: t('performance.showcase.date'),
      venue: t('performance.showcase.venue'),
      icon: '🎭',
    },
    {
      titleKey: 'performance.xiaohe.title',
      descKey: 'performance.xiaohe.desc',
      date: t('performance.xiaohe.date'),
      venue: t('performance.xiaohe.venue'),
      icon: '🏆',
    },
    {
      titleKey: 'performance.summer.title',
      descKey: 'performance.summer.desc',
      date: t('performance.summer.date'),
      venue: t('performance.summer.venue'),
      icon: '☀️',
    },
  ];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.performances'), href: 'performances' }]} />
        <h1 className="heading-xl mb-4">{t('performance.currentSeason')}</h1>
        <p className="text-lead mb-8">{t('performance.seasonSubtle')}</p>
        <p className="text-body text-muted-foreground mb-12">{t('performance.seasonDesc')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {productions.map((prod) => (
            <Card key={prod.titleKey} className="card-hover">
              <CardHeader className="pb-3">
                <span className="text-3xl mb-2 block">{prod.icon}</span>
                <CardTitle className="heading-sm">{t(prod.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{t(prod.descKey)}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{prod.date}</span>
                  <span>{prod.venue}</span>
                </div>
                <Link href="/about/contact" className="block">
                  <Button size="sm" variant="outline" className="w-full">
                    {t('programs.register.title')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center bg-card rounded-xl p-8 border">
          <h2 className="heading-md mb-4">{t('about.joinUs.title')}</h2>
          <p className="text-body text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t('about.joinUs.subtitle')}
          </p>
          <Link href="/about/contact">
            <Button size="lg">{t('about.contact.title')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
