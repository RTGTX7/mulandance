import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const alumniSpotlights = [
  {
    name: 'Sarah Chen',
    gradYear: '2018',
    current: 'Principal Dancer, National Ballet',
    quote: 'Grace Dance Academy gave me the foundation and confidence to pursue my dreams.',
  },
  {
    name: 'Marcus Williams',
    gradYear: '2020',
    current: 'Choreographer, Broadway',
    quote: 'The contemporary program opened my eyes to what dance could be.',
  },
  {
    name: 'Yuki Tanaka',
    gradYear: '2016',
    current: 'Dance Therapist, Private Practice',
    quote: 'The discipline and creativity I learned here transformed my entire life.',
  },
];

export default function AlumniPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.alumni'), href: 'alumni' }]} />
        <h1 className="heading-xl mb-4">{t('alumni.title')}</h1>
        <p className="text-lead mb-12">{t('alumni.join')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-xl text-primary mb-2">2,500+</h3>
              <p className="text-sm text-muted-foreground">{t('alumni.directory')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-xl text-primary mb-2">45</h3>
              <p className="text-sm text-muted-foreground">{t('alumni.events')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="heading-xl text-primary mb-2">120</h3>
              <p className="text-sm text-muted-foreground">{t('alumni.awards')}</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="heading-lg mb-6">Alumni Spotlights</h2>
        <div className="space-y-6 mb-12">
          {alumniSpotlights.map((alum) => (
            <Card key={alum.name}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="heading-sm text-secondary">{alum.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{alum.name}</h3>
                    <p className="text-sm text-secondary mb-1">Class of {alum.gradYear}</p>
                    <p className="text-sm text-muted-foreground mb-2">{alum.current}</p>
                    <p className="text-sm italic text-muted-foreground">"{alum.quote}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('alumni.directory')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search our alumni directory to reconnect with former classmates and stay updated on their achievements.
              </p>
              <Link href="/portal/login">
                <Button size="sm" className="w-full">
                  {t('alumni.directory')}
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('alumni.story')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your success story and inspire current students. We feature alumni stories in our newsletter and website.
              </p>
              <Link href="/portal/login">
                <Button variant="outline" size="sm" className="w-full">
                  {t('alumni.story')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/portal/login">
            <Button size="lg">{t('alumni.join')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
