'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ticketOptions = [
  { name: 'Adult', price: '$45', desc: 'General admission for adults 18+' },
  { name: 'Senior', price: '$35', desc: 'Ages 65 and older' },
  { name: 'Student', price: '$25', desc: 'Valid student ID required' },
  { name: 'Child', price: '$15', desc: 'Ages 5-17' },
  { name: 'Family Pack', price: '$120', desc: '2 adults + 2 children' },
  { name: 'Group (10+)', price: '$30', desc: 'Per person for groups of 10 or more' },
];

export default function TicketsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.performances'), href: 'performances' }]} />
        <h1 className="heading-xl mb-4">{t('performances.tickets')}</h1>
        <p className="text-lead mb-12">
          Secure your seats for an unforgettable evening of dance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ticketOptions.map((option) => (
            <Card key={option.name}>
              <CardContent className="pt-6 text-center">
                <h3 className="heading-sm mb-2">{option.name}</h3>
                <p className="text-3xl font-bold text-primary mb-2">{option.price}</p>
                <p className="text-sm text-muted-foreground mb-4">{option.desc}</p>
                <Button size="sm" className="w-full">
                  {t('performances.tickets')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Ticket Information</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Tickets go on sale 2 weeks before each performance</p>
              <p>• Online booking available through the student portal</p>
              <p>• Box office open Mon-Fri 9 AM - 6 PM, Sat 9 AM - 3 PM</p>
              <p>• Season subscriptions save up to 20%</p>
              <p>• Contact us for accessibility seating arrangements</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
