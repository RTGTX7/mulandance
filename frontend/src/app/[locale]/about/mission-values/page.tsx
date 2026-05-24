import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MissionValuesPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.mission.title')}</h1>
        <p className="text-lead mb-12">{t('about.mission.mission')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('about.mission.values.excellence')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.mission.values.excellenceDesc')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('about.mission.values.inclusivity')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.mission.values.inclusivityDesc')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('about.mission.values.community')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.mission.values.communityDesc')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">{t('about.mission.values.innovation')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.mission.values.innovationDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="philosophy">
            <AccordionTrigger>Our Philosophy</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                At Grace Dance Academy, we believe that dance is a universal language that transcends boundaries.
                Our teaching philosophy centers on nurturing each student's unique potential while building a
                strong technical foundation.
              </p>
              <p>
                We combine traditional dance pedagogy with modern educational approaches, ensuring that every
                student receives personalized attention and guidance on their artistic journey.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="approach">
            <AccordionTrigger>Our Approach</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                Our approach to dance education is holistic, addressing the physical, creative, and emotional
                development of each dancer. We emphasize proper technique, artistic expression, and a deep
                appreciation for dance as an art form.
              </p>
              <p>
                Through regular performances, workshops, and cross-training opportunities, our students
                develop not only as dancers but as well-rounded artists and confident individuals.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
