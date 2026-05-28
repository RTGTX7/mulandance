'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MembershipPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.support'), href: 'support' }]} />
        <h1 className="heading-xl mb-4">{t('support.membership')}</h1>
        <p className="text-lead mb-12">
          Join our membership community and enjoy exclusive benefits while supporting dance education.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h2 className="heading-lg mb-4">Individual Membership</h2>
              <div className="space-y-3 mb-6">
                <p className="text-3xl font-bold text-primary">$120<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 10% discount on all classes</li>
                  <li>• Priority registration for workshops</li>
                  <li>• Free attendance at open studio hours</li>
                  <li>• Monthly member newsletter</li>
                  <li>• 2 free guest passes per year</li>
                </ul>
              </div>
              <Link href="/portal/register">
                <Button size="lg" className="w-full">Join Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="heading-lg mb-4">Family Membership</h2>
              <div className="space-y-3 mb-6">
                <p className="text-3xl font-bold text-primary">$200<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• All Individual benefits</li>
                  <li>• Covers up to 4 family members</li>
                  <li>• Additional 5% off multi-program enrollment</li>
                  <li>• Family photo session annually</li>
                  <li>• 4 free guest passes per year</li>
                </ul>
              </div>
              <Link href="/portal/register">
                <Button size="lg" className="w-full">Join Now</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Membership Benefits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Save Money</h4>
                <p className="text-muted-foreground">
                  Class discounts and enrollment savings quickly pay for your membership.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Priority Access</h4>
                <p className="text-muted-foreground">
                  Register before non-members for popular classes and workshops.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Community</h4>
                <p className="text-muted-foreground">
                  Connect with fellow dance families through exclusive events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
