import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const programs = [
  {
    titleKey: 'home.programs.ballet',
    descKey: 'home.programs.balletDesc',
    href: '/programs/ballet',
    icon: '🩰',
  },
  {
    titleKey: 'home.programs.contemporary',
    descKey: 'home.programs.contemporaryDesc',
    href: '/programs/contemporary',
    icon: '🌊',
  },
  {
    titleKey: 'home.programs.chinese',
    descKey: 'home.programs.chineseDesc',
    href: '/programs/chinese-dance',
    icon: '🏮',
  },
  {
    titleKey: 'home.programs.jazz',
    descKey: 'home.programs.jazzDesc',
    href: '/programs/jazz',
    icon: '🎷',
  },
  {
    titleKey: 'home.programs.hiphop',
    descKey: 'home.programs.hiphopDesc',
    href: '/programs/hip-hop',
    icon: '🎤',
  },
  {
    titleKey: 'home.programs.summer',
    descKey: 'home.programs.summerDesc',
    href: '/programs/summer-camps',
    icon: '☀️',
  },
];

export default function ProgramsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.programs'), href: 'programs' }]} />
        <h1 className="heading-xl mb-4">{t('programs.title')}</h1>
        <p className="text-lead mb-12">{t('programs.subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {programs.map((prog) => (
            <Link key={prog.href} href={prog.href}>
              <Card className="card-hover h-full cursor-pointer">
                <CardContent className="pt-6">
                  <span className="text-4xl mb-4 block">{prog.icon}</span>
                  <h3 className="heading-sm mb-2">{t(prog.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t(prog.descKey)}
                  </p>
                  <Button variant="outline" size="sm">
                    {t('common.buttons.learnMore')}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/classes/pricing">
            <Button size="lg" className="mr-4">
              {t('programs.pricing.title')}
            </Button>
          </Link>
          <Link href="/classes/register">
            <Button variant="outline" size="lg">
              {t('programs.register.title')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
