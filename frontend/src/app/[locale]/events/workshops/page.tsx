'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const workshops = [
  { title: 'Contemporary Improvisation Lab', instructor: 'Ms. Park', date: 'Jun 7, 2026', level: 'Intermediate', price: '$65' },
  { title: 'Ballet Masterclass: RAD Syllabus', instructor: 'Ms. Chen', date: 'Jun 14, 2026', level: 'All Levels', price: '$75' },
  { title: 'Hip-Hop Choreography Workshop', instructor: 'Mr. Davis', date: 'Jun 21, 2026', level: 'Beginner-Intermediate', price: '$55' },
  { title: 'Chinese Dance Technique', instructor: 'Ms. Li', date: 'Jun 28, 2026', level: 'Intermediate-Advanced', price: '$70' },
  { title: 'Jazz Dance Foundations', instructor: 'Ms. Williams', date: 'Jul 5, 2026', level: 'Beginner', price: '$50' },
  { title: 'Acrobatics for Dancers', instructor: 'Mr. Zhang', date: 'Jul 12, 2026', level: 'Advanced', price: '$80' },
];

export default function WorkshopsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.events'), href: 'events' }]} />
        <h1 className="heading-xl mb-4">{t('events.workshops')}</h1>
        <p className="text-lead mb-12">
          Enhance your skills with expert-led workshops from our faculty and guest artists.
        </p>

        <div className="space-y-4 mb-12">
          {workshops.map((workshop) => (
            <Card key={workshop.title}>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{workshop.title}</h3>
                    <Badge variant="secondary">{workshop.level}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workshop.instructor} • {workshop.date} • {workshop.price}
                  </p>
                </div>
                <Link href="/classes/register">
                  <Button size="sm">Register</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Workshop Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">What to Bring</h4>
                <ul className="space-y-1">
                  <li>• Comfortable dance attire</li>
                  <li>• Dance shoes (specified per workshop)</li>
                  <li>• Water bottle</li>
                  <li>• Notebook for notes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Policies</h4>
                <ul className="space-y-1">
                  <li>• Register at least 48 hours in advance</li>
                  <li>• Cancellation refund up to 24 hours before</li>
                  <li>• Academy students get 10% discount</li>
                  <li>• Limited spots available per workshop</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
