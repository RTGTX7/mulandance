'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AbsencePolicyPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('classes.absencePolicy')}</h1>
        <p className="text-lead mb-12">
          Our policies to ensure a fair and supportive experience for all students.
        </p>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Attendance Policy</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Regular attendance is essential for progress and safety in dance training.</p>
              <p>• Students missing more than 3 classes per term without notice may be asked to review their enrollment.</p>
              <p>• Please notify the studio at least 2 hours before class if your child will be absent.</p>
              <p>• Contact us at info@gracedanceacademy.org or call +1 (555) 123-4567.</p>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible>
          <AccordionItem value="makeup">
            <AccordionTrigger>Makeup Classes</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Makeup classes are available for students with prior notice (24+ hours).</p>
                <p>• One makeup class per term is included in your tuition for full-time students.</p>
                <p>• Additional makeup classes can be purchased at $20 per session.</p>
                <p>• Makeup classes are held on designated make-up Saturdays or during open studio hours.</p>
                <p>• Summer camp absence: one makeup day available with prior notice.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="illness">
            <AccordionTrigger>Illness & Injury</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• If your child is ill, please keep them home to protect other students and staff.</p>
                <p>• Fever, vomiting, or contagious conditions require 24-hour absence.</p>
                <p>• For injuries, please consult with the instructor about modified participation options.</p>
                <p>• Our faculty can recommend physiotherapists and dance medicine specialists.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="closures">
            <AccordionTrigger>Studio Closures</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• The academy is closed on public holidays and during winter break (Dec 24 - Jan 5).</p>
                <p>• Summer closure: July 1-14 (all programs).</p>
                <p>• In case of extreme weather, check our website and social media for closure announcements.</p>
                <p>• Classes cancelled due to studio closures will be rescheduled or credited.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
