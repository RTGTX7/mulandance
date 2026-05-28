'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

const pricing = [
  { program: 'Young Dancers (Ages 3-5)', monthly: '$120', term: '$340', hours: '45 min, 1x/week' },
  { program: 'Ballet (All Levels)', monthly: '$150', term: '$420', hours: '60 min, 1x/week' },
  { program: 'Contemporary', monthly: '$140', term: '$390', hours: '60 min, 1x/week' },
  { program: 'Chinese Dance', monthly: '$140', term: '$390', hours: '60 min, 1x/week' },
  { program: 'Jazz', monthly: '$140', term: '$390', hours: '60 min, 1x/week' },
  { program: 'Hip-Hop', monthly: '$130', term: '$360', hours: '60 min, 1x/week' },
  { program: 'Multi-Program Discount', monthly: '10% off 2nd program', term: '10% off 2nd program', hours: '' },
];

export default function PricingPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('programs.pricing.title')}</h1>
        <p className="text-lead mb-12">{t('programs.pricing.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {pricing.map((item) => (
            <Card key={item.program}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">{item.program}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('programs.pricing.monthly')}</p>
                    <p className="heading-sm text-primary">{item.monthly}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('programs.pricing.term')}</p>
                    <p className="heading-sm text-primary">{item.term}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm">{item.hours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-sm mb-2">{t('programs.pricing.financialAid')}</h3>
              <p className="text-sm text-muted-foreground">
                We believe dance should be accessible. Apply for our scholarship program through the student portal.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-sm mb-2">{t('programs.pricing.siblingDiscount')}</h3>
              <p className="text-sm text-muted-foreground">
                10% off for the second child, 15% off for the third and subsequent children enrolled.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-sm mb-2">{t('programs.pricing.freeIntro')}</h3>
              <p className="text-sm text-muted-foreground">
                New students can attend one class free of charge. Contact us to schedule your trial.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Payment Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Accepted Methods</h4>
                <ul className="space-y-1">
                  <li>• Credit/Debit Card</li>
                  <li>• Bank Transfer (EFT)</li>
                  <li>• Online Payment Portal</li>
                  <li>• Cash or Cheque (at studio)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Payment Schedule</h4>
                <ul className="space-y-1">
                  <li>• Monthly: Due on the 1st of each month</li>
                  <li>• Per Term: Due 2 weeks before term starts</li>
                  <li>• Annual: 10% discount for annual prepayment</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
