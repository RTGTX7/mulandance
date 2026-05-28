'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const positions = [
  { title: 'Ballet Instructor', type: 'Part-time', dept: 'Artistic' },
  { title: 'Contemporary Dance Teacher', type: 'Full-time', dept: 'Artistic' },
  { title: 'Administrative Assistant', type: 'Part-time', dept: 'Operations' },
  { title: 'Marketing Coordinator', type: 'Full-time', dept: 'Marketing' },
  { title: 'Young Dancers Program Assistant', type: 'Part-time', dept: 'Artistic' },
];

export default function CareersPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.careers.title')}</h1>
        <p className="text-lead mb-12">{t('about.careers.subtitle')}</p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <p className="mb-4">
              Join our team of passionate dance professionals. We offer competitive compensation,
              professional development opportunities, and a supportive work environment dedicated
              to artistic excellence.
            </p>
            <p className="text-sm text-muted-foreground">
              All positions require a passion for dance education and a commitment to our values
              of excellence, inclusivity, and community.
            </p>
          </CardContent>
        </Card>

        <h2 className="heading-lg mb-6">{t('about.careers.openPositions')}</h2>
        <div className="space-y-4 mb-12">
          {positions.map((pos) => (
            <Card key={pos.title}>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{pos.title}</h3>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>{pos.dept}</span>
                    <span>•</span>
                    <span>{pos.type}</span>
                  </div>
                </div>
                <Link href="/portal/login">
                  <Button variant="outline" size="sm">
                    {t('about.careers.apply')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="heading-sm mb-3">Benefits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <p>• Competitive salary and benefits package</p>
              <p>• Free class attendance for staff</p>
              <p>• Professional development support</p>
              <p>• Collaborative team environment</p>
              <p>• Performance bonuses</p>
              <p>• Flexible scheduling</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
