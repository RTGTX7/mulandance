import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-6">{t('about.title')}</h1>
        <p className="text-lead mb-12">{t('home.hero.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/about/mission-values">
            <Card className="card-hover h-full cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-2">{t('about.mission.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.mission.mission')}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/about/history">
            <Card className="card-hover h-full cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-2">{t('about.history.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.history.founded')}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/about/leadership">
            <Card className="card-hover h-full cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-2">{t('about.leadership.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.leadership.artisticStaff')}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="mission">
            <AccordionTrigger>{t('about.mission.title')}</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">{t('about.mission.mission')}</p>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="excellence">
                  <AccordionTrigger>{t('about.mission.values.excellence')}</AccordionTrigger>
                  <AccordionContent>
                    {t('about.mission.values.excellenceDesc')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="inclusivity">
                  <AccordionTrigger>{t('about.mission.values.inclusivity')}</AccordionTrigger>
                  <AccordionContent>
                    {t('about.mission.values.inclusivityDesc')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="community">
                  <AccordionTrigger>{t('about.mission.values.community')}</AccordionTrigger>
                  <AccordionContent>
                    {t('about.mission.values.communityDesc')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="innovation">
                  <AccordionTrigger>{t('about.mission.values.innovation')}</AccordionTrigger>
                  <AccordionContent>
                    {t('about.mission.values.innovationDesc')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="edi">
            <AccordionTrigger>{t('about.edi.title')}</AccordionTrigger>
            <AccordionContent>
              {t('about.edi.statement')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 text-center">
          <Link href="/about/contact">
            <Button size="lg">{t('about.contact.title')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
