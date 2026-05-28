'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GalaPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.events'), href: 'events' }]} />
        <h1 className="heading-xl mb-4">{t('events.gala')}</h1>
        <p className="text-lead mb-12">
          Join us for an unforgettable evening of celebration, performances, and philanthropy.
        </p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="heading-lg mb-4">Event Details</h2>
                <div className="space-y-3 text-sm">
                  <p><strong>Date:</strong> October 15, 2026</p>
                  <p><strong>Time:</strong> 6:00 PM - 11:00 PM</p>
                  <p><strong>Venue:</strong> Grand Ballroom, Arts Centre</p>
                  <p><strong>Dress Code:</strong> Black Tie</p>
                  <p><strong>Tickets:</strong> $200 per person, $1,800 per table (10)</p>
                </div>
              </div>
              <div>
                <h2 className="heading-lg mb-4">Evening Includes</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Welcome cocktail reception</li>
                  <li>• Four-course dinner</li>
                  <li>• Live performances from all programs</li>
                  <li>• Silent auction</li>
                  <li>• Keynote address by guest artist</li>
                  <li>• Dancing until midnight</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/support/donate">
            <Button size="lg" className="mr-4">{t('common.buttons.donate')}</Button>
          </Link>
          <Link href="/support/sponsorship">
            <Button variant="outline" size="lg">
              Become a Sponsor
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
