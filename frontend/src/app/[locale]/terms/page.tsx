'use client';

import { useTranslations } from '@/components/ui/i18n-client';

type LegalSection = {
  title: string;
  text: string;
};

export default function TermsPage() {
  const t = useTranslations();
  const sections = (t.raw('legal.terms.sections') || []) as LegalSection[];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <h1 className="heading-xl mb-6">{t('legal.terms.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('legal.lastUpdated')}</p>

        <div className="space-y-8 text-body text-muted-foreground">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="heading-md mb-3 text-foreground">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
