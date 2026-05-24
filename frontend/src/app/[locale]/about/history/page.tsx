import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

const timeline = [
  { year: '1985', eventKey: 'about.history.founded' },
  { year: '1992', eventKey: 'history.expansion' },
  { year: '2000', eventKey: 'history.newStudio' },
  { year: '2008', eventKey: 'history.recognition' },
  { year: '2015', eventKey: 'history.expansion2' },
  { year: '2024', eventKey: 'history.present' },
];

export default function HistoryPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.history.title')}</h1>
        <p className="text-lead mb-12">{t('about.history.founded')}</p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <p className="leading-relaxed">
              {t('about.history.story')}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {timeline.map((item) => (
            <div key={item.year} className="flex gap-4">
              <div className="shrink-0 w-16 text-right">
                <span className="heading-sm text-primary">{item.year}</span>
              </div>
              <div className="border-l-2 border-secondary/30 pl-6 pb-2">
                <p className="text-muted-foreground">
                  {t(item.eventKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
