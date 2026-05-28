'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const archive = [
  { title: 'Swan Lake - 2025', year: '2025', type: 'Ballet' },
  { title: 'Romeo & Juliet', year: '2025', type: 'Classical' },
  { title: 'Contemporary Visions III', year: '2024', type: 'Contemporary' },
  { title: 'The Nutcracker', year: '2024', type: 'Ballet' },
  { title: 'Midsummer Night\'s Dream', year: '2024', type: 'Theatrical' },
  { title: 'Chinese Heritage Festival', year: '2023', type: 'Chinese Dance' },
  { title: 'Jazz Spectacular', year: '2023', type: 'Jazz' },
  { title: 'Urban Rhythms', year: '2023', type: 'Hip-Hop' },
];

export default function ArchivePage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.performances'), href: 'performances' }]} />
        <h1 className="heading-xl mb-4">{t('performances.archive')}</h1>
        <p className="text-lead mb-12">
          Explore our rich performance history spanning over four decades.
        </p>

        <div className="space-y-4">
          {archive.map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>
                <Badge variant="secondary">{item.year}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
