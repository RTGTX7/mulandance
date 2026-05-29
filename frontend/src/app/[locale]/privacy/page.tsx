'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

type LegalSection = {
  title: string;
  text: string;
};

export default function PrivacyPage() {
  const t = useTranslations();
  const sections = (t.raw('legal.privacy.sections') || []) as LegalSection[];

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.footer.privacyPolicy'), href: 'privacy' }]} />
        <h1 className="heading-xl mb-4">{t('common.footer.privacyPolicy')}</h1>
      </div>
      <div className="container container-narrow space-y-8 text-body text-muted-foreground">
        <div className="mb-8">
          <p className="text-muted-foreground">{t('legal.lastUpdated')}</p>
        </div>

        {sections.map((section, index) => (
          <section key={index}>
            <h2 className="heading-md mb-3 text-foreground">{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
