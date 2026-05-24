import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ChineseDancePage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs
          items={[
            { label: t('common.nav.programs'), href: 'programs' },
            { label: t('programs.chinese.title'), href: 'programs/chinese-dance' },
          ]}
        />
        <h1 className="heading-xl mb-4">{t('programs.chinese.title')}</h1>
        <p className="text-lead mb-8">{t('programs.chinese.description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.chinese.features.classical')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Master the elegant movements, precise hand gestures, and dynamic leaps of classical Chinese dance, rooted in centuries of artistic tradition.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.chinese.features.folk')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore the vibrant rhythms and colorful costumes of China's ethnic folk dances, from Tibetan to Mongolian to Uyghur traditions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.chinese.features.acrobatics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Develop extraordinary flexibility, balance, and power through dance acrobatics including spins, leaps, and aerial techniques.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="heading-sm text-sm">{t('programs.chinese.features.cultural')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Understand the cultural and historical context behind each dance form, deepening your appreciation and artistic expression.
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
                    Ages 5-12. Fun introduction to Chinese dance through stories, music, and basic movement patterns.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.teens')}</h4>
                  <p className="text-sm text-muted-foreground">
                    Ages 13-17. Advanced technique training with performance opportunities in seasonal productions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t('programs.levels.adults')}</h4>
                  <p className="text-sm text-muted-foreground">
                    All levels. Enjoy the beauty of Chinese dance at your own pace with expert instruction.
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
