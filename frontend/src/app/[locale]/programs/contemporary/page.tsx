import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContemporaryPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('programs.contemporary.title'), href: 'programs/contemporary' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('programs.contemporary.title')}</h1>
        <p className="text-lead mb-8">{t('programs.contemporary.description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.contemporary.features.technique')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Develop strength, flexibility, and expressive movement through our comprehensive modern technique curriculum based on Graham, Limon, and Cunningham methods.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.contemporary.features.improvisation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore creative freedom through structured improvisation exercises that develop your unique movement vocabulary and artistic voice.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.contemporary.features.choreography')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn choreographic processes from concept to stage, working on original pieces and collaborative group compositions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.contemporary.features.performances')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Perform in our seasonal contemporary showcase, an annual production featuring student and company choreography.
              </p>
            </CardContent>
          </Card>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="levels">
            <AccordionTrigger>{t('programs.levels.title')}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.children')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Ages 7-12. Introduction to contemporary movement through play-based exploration, basic technique, and creative expression.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.teens')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Ages 13-17. Intermediate technique, improvisation labs, and performance opportunities for developing dancers.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.adults')}</h4>
                  <p className="text-sm text-muted-foreground">
                    All levels welcome. From beginner contemporary fundamentals to advanced technique classes for experienced dancers.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/classes/register">
            <Button size="lg">{t('programs.register.form.submit')}</Button>
          </Link>
          <Link href="/classes/pricing">
            <Button variant="outline" size="lg">
              {t('programs.pricing.title')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
