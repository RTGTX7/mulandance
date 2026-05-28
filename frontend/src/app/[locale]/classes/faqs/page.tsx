'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'What age can my child start dance classes?',
    a: 'Our Young Dancers program accepts children from age 3. Children under 5 participate in creative movement classes focused on fun and basic coordination.',
  },
  {
    q: 'What should my child wear to their first class?',
    a: 'For ballet, a leotard and tights with ballet slippers. For other styles, comfortable athletic wear and clean dance shoes or sneakers. We provide a detailed dress code upon enrollment.',
  },
  {
    q: 'Do I need to buy a uniform?',
    a: 'Each program has a recommended dress code. Basic dancewear can be purchased at our academy shop. Uniforms for performances are provided by the academy.',
  },
  {
    q: 'How do I know which level is appropriate?',
    a: 'Our instructors will assess your child during the first class and recommend the appropriate level. We also offer placement classes at the start of each term.',
  },
  {
    q: 'Can my child try a class before registering?',
    a: 'Yes! We offer a free introductory class for new students. Contact us to schedule a trial session.',
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Term fees can be cancelled with 30 days written notice. Monthly fees can be cancelled with 14 days notice. Refunds are processed within 10 business days.',
  },
  {
    q: 'Do you offer sibling discounts?',
    a: 'Yes, we offer a 10% discount for the second child and 15% for the third child enrolled in any combination of programs.',
  },
  {
    q: 'Are examinations available?',
    a: 'Our ballet program offers RAD graded examinations from Pre-Primary to Advanced. We also provide internal assessment reports for all other programs.',
  },
];

export default function FAQsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('classes.faqs')}</h1>
        <p className="text-lead mb-12">
          Find answers to the most common questions about our programs and policies.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We are happy to help.
          </p>
          <a href="mailto:info@gracedanceacademy.org" className="text-secondary hover:underline font-medium">
            info@gracedanceacademy.org
          </a>
        </div>
      </div>
    </div>
  );
}
