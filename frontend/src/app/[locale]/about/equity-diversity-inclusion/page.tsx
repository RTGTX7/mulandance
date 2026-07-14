'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function EDIPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.edi.title')}</h1>
        <p className="text-lead mb-12">{t('about.edi.statement')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">Equity</h3>
              <p className="text-sm text-muted-foreground">
                We ensure fair access to dance education regardless of background, income, or ability.
                Our scholarship programs and sliding-scale fees make dance accessible to all.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">Diversity</h3>
              <p className="text-sm text-muted-foreground">
                We celebrate the rich diversity of dance traditions from around the world, incorporating
                ballet, contemporary, Chinese, jazz, hip-hop, and more into our curriculum.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">Inclusion</h3>
              <p className="text-sm text-muted-foreground">
                Our studios are welcoming spaces where every dancer feels they belong. We adapt our
                teaching methods to accommodate different learning styles and physical abilities.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="heading-sm mb-3">Belonging</h3>
              <p className="text-sm text-muted-foreground">
                We foster a sense of community where students, families, and staff feel connected,
                valued, and empowered to contribute to our shared artistic vision.
              </p>
            </CardContent>
          </Card>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="commitments">
            <AccordionTrigger>Our Commitments</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Maintain diverse hiring practices across all levels of the organization</li>
                <li>• Offer inclusive programming that reflects diverse dance traditions</li>
                <li>• Provide accessible facilities and adaptive dance programs</li>
                <li>• Create safe spaces for open dialogue about equity and inclusion</li>
                <li>• Regularly assess and improve our DEI practices</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="contact">
            <AccordionTrigger>Get Involved</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                We welcome feedback and suggestions on how to improve our equity, diversity, and inclusion efforts.
                Please reach out to Mulan Dance Studio at info@mulandance.com.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
