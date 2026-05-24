import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button');
import { Badge } from '@/components/ui/badge';

const tiers = [
  {
    nameKey: 'support.tiers.supporter',
    descKey: 'support.tiers.supporterDesc',
    price: '$50+',
    features: ['Name on supporter wall', 'Quarterly newsletter', 'Annual impact report'],
  },
  {
    nameKey: 'support.tiers.patron',
    descKey: 'support.tiers.patronDesc',
    price: '$250+',
    features: ['All Supporter benefits', '2 gala tickets annually', 'Private studio tours', 'Exclusive workshops'],
  },
  {
    nameKey: 'support.tiers.benefactor',
    descKey: 'support.tiers.benefactorDesc',
    price: '$1,000+',
    features: ['All Patron benefits', 'Named scholarship fund', 'Gala table for 10', 'Board recognition'],
  },
  {
    nameKey: 'support.tiers.visionary',
    descKey: 'support.tiers.visionaryDesc',
    price: '$5,000+',
    features: ['All Benefactor benefits', 'Naming rights opportunity', 'Advisory board seat', 'Media features'],
  },
];

export default function DonatePage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.support'), href: 'support' }]} />
        <h1 className="heading-xl mb-4">{t('support.donate')}</h1>
        <p className="text-lead mb-12">
          Your support helps us provide dance education to every community member who wants it.
        </p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <p className="mb-4">
              Every donation, regardless of size, makes a real difference. Your contributions fund scholarships,
              maintain our facilities, and help us reach more students through community programs.
            </p>
            <p className="text-sm text-muted-foreground">
              Grace Dance Academy is a registered non-profit. All donations are tax-deductible.
            </p>
          </CardContent>
        </Card>

        <h2 className="heading-lg mb-6">Support Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {tiers.map((tier) => (
            <Card key={tier.nameKey}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="heading-sm">{t(tier.nameKey)}</h3>
                  <Badge variant="secondary">{tier.price}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t(tier.descKey)}</p>
                <ul className="space-y-1.5 mb-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="sm" className="w-full">{t('support.donateForm.submit')}</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">{t('support.donateForm.amount')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {['$25', '$50', '$100', '$250'].map((amount) => (
                <Button key={amount} variant="outline" size="sm" className="w-full">
                  {amount}
                </Button>
              ))}
            </div>
            <Button size="lg" className="w-full">{t('support.donateForm.submit')}</Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('support.donateForm.secure')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
