import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function JazzPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('programs.jazz.title'), href: 'programs/jazz' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('programs.jazz.title')}</h1>
        <p className="text-lead mb-8">
          Our jazz program combines technical precision with dynamic energy, covering styles from Broadway to commercial jazz.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Broadway Jazz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn the theatrical jazz techniques that power Broadway productions, from classic choreography to contemporary stage styles.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Commercial Jazz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Develop the sharp, energetic style used in music videos, commercials, and entertainment industry performances.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Lyrical Jazz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Blend jazz technique with fluid, expressive movement to create emotionally powerful choreography.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Performance Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Regular performance opportunities in our seasonal showcases and special jazz ensemble productions.
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
                    Ages 6-12. Introduction to jazz fundamentals through fun, energetic routines and basic combinations.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.teens')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Ages 13-17. Intermediate to advanced jazz technique with performance ensemble opportunities.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.adults')}</h4>
                  <p className="text-sm text-muted-foreground">
                    All levels. From beginner jazz fundamentals to advanced commercial and Broadway styles.
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
