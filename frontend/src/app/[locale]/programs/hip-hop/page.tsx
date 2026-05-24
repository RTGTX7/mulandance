import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HipHopPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('programs.hiphop.title'), href: 'programs/hip-hop' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('programs.hiphop.title')}</h1>
        <p className="text-lead mb-8">
          Our hip-hop program brings energy, creativity, and street culture into the studio, teaching everything from foundational moves to complex choreography.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Fundamentals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build a strong foundation with basic hip-hop moves, rhythm training, body isolation, and grooves.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Choreography</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Learn and perform full choreographed routines set to current hits and classic hip-hop tracks.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Freestyle & Improv</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Develop your unique style through freestyle sessions, battle techniques, and creative improvisation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">Styles Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Training in popping, locking, breaking, tutting, and contemporary urban dance styles.
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
                    Ages 5-12. Fun, high-energy introduction to hip-hop through games, basic moves, and simple routines.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.teens')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Ages 13-17. Advanced technique, choreography, and performance ensemble for competitive dancers.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.adults')}</h4>
                  <p className="text-sm text-muted-foreground">
                    All levels. Fitness-focused and technique classes for adults who love hip-hop culture.
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
