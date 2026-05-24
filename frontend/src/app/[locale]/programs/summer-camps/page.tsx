import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const camps = [
  {
    title: 'Young Dancers Camp',
    ages: 'Ages 4-7',
    desc: 'Play-based dance exploration introducing ballet, contemporary, and creative movement through fun activities.',
  },
  {
    title: 'Intermediate Dance Camp',
    ages: 'Ages 8-12',
    desc: 'Skill-building camp covering multiple dance styles with choreography projects and a final showcase.',
  },
  {
    title: 'Pre-Professional Intensive',
    ages: 'Ages 13-17',
    desc: 'Advanced training with daily technique classes, choreography labs, and masterclasses from guest artists.',
  },
  {
    title: 'Adult Dance Immersion',
    ages: 'Ages 18+',
    desc: 'A week-long dance experience for adults featuring varied styles, wellness workshops, and social dance events.',
  },
];

export default function SummerCampsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('home.programs.summer'), href: 'programs/summer-camps' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('home.programs.summer')}</h1>
        <p className="text-lead mb-12">{t('home.programs.summerDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {camps.map((camp) => (
            <Card key={camp.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="heading-sm">{camp.title}</CardTitle>
                  <Badge variant="secondary">{camp.ages}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{camp.desc}</p>
                <Link href="/classes/register">
                  <Button size="sm" className="w-full">
                    {t('common.buttons.register')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Camp Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">What's Included</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 5 days of dance classes (9 AM - 3 PM)</li>
                  <li>• All dance styles covered</li>
                  <li>• Final showcase performance</li>
                  <li>• Lunch and snacks provided</li>
                  <li>• Take-home craft project</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Early Bird Pricing</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Register by May 15: 15% off</li>
                  <li>• Sibling discount: 10% off</li>
                  <li>• Academy students: additional 10% off</li>
                  <li>• Financial aid available</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
