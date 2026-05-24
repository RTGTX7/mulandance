import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const productions = [
  { titleKey: 'performances.season.productions.swanLake', descKey: 'performances.season.productions.swanLakeDesc', date: 'Jun 15-20, 2026', venue: 'Grand Theatre' },
  { titleKey: 'performances.season.productions.midsummer', descKey: 'performances.season.productions.midsummerDesc', date: 'Jul 8-12, 2026', venue: 'Studio Mainstage' },
  { titleKey: 'performances.season.productions.contemporary', descKey: 'performances.season.productions.contemporaryDesc', date: 'Aug 1-5, 2026', venue: 'Black Box Theatre' },
  { titleKey: 'performances.season.productions.nutcracker', descKey: 'performances.season.productions.nutcrackerDesc', date: 'Dec 20-24, 2026', venue: 'Grand Theatre' },
  { titleKey: 'performances.season.productions.galas', descKey: 'performances.season.productions.galasDesc', date: 'May 10, 2026', venue: 'Academy Studios' },
];

export default function CurrentSeasonPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.performances'), href: 'performances' }]} />
        <h1 className="heading-xl mb-4">{t('performances.currentSeason')}</h1>
        <p className="text-lead mb-12">{t('performances.season.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {productions.map((prod) => (
            <Card key={prod.titleKey} className="card-hover">
              <CardHeader>
                <CardTitle className="heading-sm">{t(prod.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{t(prod.descKey)}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{prod.date}</span>
                  <span>{prod.venue}</span>
                </div>
                <Link href="/performances/tickets" className="mt-4 block">
                  <Button size="sm" className="w-full">{t('performances.season.tickets')}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
