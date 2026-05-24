import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sponsorshipLevels = [
  {
    name: 'Presenting Sponsor',
    price: '$10,000+',
    benefits: ['Logo on all marketing materials', 'Speaking opportunity at gala', 'Full-page ad in program', 'VIP table at all performances'],
  },
  {
    name: 'Gold Sponsor',
    price: '$5,000+',
    benefits: ['Logo on website and programs', 'Logo on performance programs', 'Reserved seating at 2 performances', 'Social media features'],
  },
  {
    name: 'Silver Sponsor',
    price: '$2,500+',
    benefits: ['Logo on website', 'Name in program booklet', 'Reserved seating at 1 performance', 'Social media mention'],
  },
  {
    name: 'Bronze Sponsor',
    price: '$1,000+',
    benefits: ['Logo on website', 'Name in program booklet', 'Group ticket package'],
  },
];

export default function SponsorshipPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.support'), href: 'support' }]} />
        <h1 className="heading-xl mb-4">{t('support.sponsorship')}</h1>
        <p className="text-lead mb-12">
          Partner with Grace Dance Academy to support dance education while gaining valuable visibility.
        </p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <p className="mb-4">
              Our sponsors enable us to offer scholarships, maintain world-class facilities, and present
              high-quality productions. In return, you receive meaningful exposure to our community of
              2,000+ students and their families.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">2,000+</p>
                <p className="text-sm text-muted-foreground">Students & Families</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Annual Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">40</p>
                <p className="text-sm text-muted-foreground">Years in Community</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">Non-Profit</p>
                <p className="text-sm text-muted-foreground">Tax Deductible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="heading-lg mb-6">Sponsorship Levels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {sponsorshipLevels.map((level) => (
            <Card key={level.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-sm">{level.name}</h3>
                  <span className="text-sm font-semibold text-secondary">{level.price}</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {level.benefits.map((benefit) => (
                    <li key={benefit} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button size="sm" className="w-full">Inquire Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Custom Sponsorship Packages</h2>
            <p className="text-muted-foreground mb-4">
              We also create custom sponsorship packages tailored to your organization's goals.
              Whether you want to sponsor a specific program, event, or scholarship fund, we would
              love to discuss a partnership that works for both parties.
            </p>
            <a href="mailto:sponsor@gracedanceacademy.org">
              <Button variant="outline">Contact Our Development Team</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
