'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const volunteerRoles = [
  { title: 'Event Support', desc: 'Help set up and manage performances, galas, and community events.', time: 'Flexible, event-based' },
  { title: 'Class Assistant', desc: 'Support instructors with young dancers classes and classroom management.', time: '1-2 hours per week' },
  { title: 'Marketing Helper', desc: 'Assist with social media, photography, and promotional materials.', time: 'Flexible, remote options' },
  { title: 'Admin Support', desc: 'Help with front desk, registration, and office tasks.', time: '2-4 hours per week' },
  { title: 'Alumni Relations', desc: 'Help maintain our alumni network and organize reunions.', time: 'Flexible' },
  { title: 'Fundraising', desc: 'Support our development team with donor outreach and event planning.', time: 'Flexible' },
];

export default function VolunteerPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.support'), href: 'support' }]} />
        <h1 className="heading-xl mb-4">{t('support.volunteer')}</h1>
        <p className="text-lead mb-12">
          Give back to the dance community that has given so much. Volunteer your time and skills.
        </p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <p className="mb-4">
              Our volunteers are the backbone of Grace Dance Academy. From helping at performances to
              supporting daily operations, your contribution makes a real difference in the lives of
              our students and the broader community.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">150+</p>
                <p className="text-sm text-muted-foreground">Active Volunteers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">5,000+</p>
                <p className="text-sm text-muted-foreground">Hours Per Year</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">All Ages</p>
                <p className="text-sm text-muted-foreground">Welcome</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="heading-lg mb-6">Volunteer Opportunities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {volunteerRoles.map((role) => (
            <Card key={role.title}>
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{role.desc}</p>
                <p className="text-xs text-secondary font-medium">{role.time}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Get Started</h2>
            <div className="space-y-3 text-sm text-muted-foreground mb-6">
              <p>1. Fill out the volunteer application form</p>
              <p>2. Attend an orientation session (monthly)</p>
              <p>3. Complete a brief background check (required for working with children)</p>
              <p>4. Begin volunteering in your chosen area</p>
            </div>
            <Button size="lg" className="w-full">Apply to Volunteer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
