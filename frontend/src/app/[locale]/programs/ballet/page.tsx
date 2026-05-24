import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BalletPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('programs.ballet.title'), href: 'programs/ballet' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('programs.ballet.title')}</h1>
        <p className="text-lead mb-8">{t('programs.ballet.description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.ballet.features.radSyllabus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our ballet program follows the Royal Academy of Dance syllabus, providing a structured pathway from early years to pre-professional training.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.ballet.features.exams')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Preparation for RAD graded examinations at all levels, from Pre-Primary to Advanced.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.ballet.features.performances')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Annual showcase performance giving students valuable stage experience.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.ballet.features.crossTraining')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pilates, conditioning, and anatomy classes included for comprehensive training.
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
                    Pre-Primary through Grade 3. Focus on foundational technique, musicality, and creativity in a fun, supportive environment.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.teens')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Grade 4 through Advanced. Intensive technique training with performance opportunities and examination preparation.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.adults')}</h4>
                  <p className="text-sm text-muted-foreground">
                    All adult levels from beginner to intermediate. Enjoy ballet at your own pace with qualified instruction.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.preProfessional')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Pre-professional track for serious students pursuing professional dance careers. Includes vocational training.
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
