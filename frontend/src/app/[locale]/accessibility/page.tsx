'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function AccessibilityPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.footer.accessibility'), href: 'accessibility' }]} />
        <h1 className="heading-xl mb-4">{t('common.footer.accessibility')}</h1>
        <p className="text-muted-foreground mb-8">
          Grace Dance Academy is committed to ensuring accessibility for all members of our community.
        </p>

        <div className="space-y-8 text-sm text-muted-foreground">
          <section>
            <h2 className="heading-md mb-3 text-foreground">Our Commitment</h2>
            <p>
              We believe that dance is for everyone. We are committed to providing an inclusive
              environment where students and visitors of all abilities can participate fully in our
              programs and activities.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Physical Accessibility</h2>
            <p>
              Our facilities are wheelchair accessible with ramps, wide doorways, and accessible
              restrooms. Please contact us in advance if you require specific accommodations.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Adaptive Dance Programs</h2>
            <p>
              We offer adaptive dance classes for students with physical and cognitive disabilities.
              Our trained instructors work with each student to create an inclusive and enjoyable
              experience tailored to their needs.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Website Accessibility</h2>
            <p>
              We strive to make our website accessible to all users. Our site follows WCAG 2.1
              guidelines and is regularly reviewed for accessibility improvements.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Communication Accessibility</h2>
            <p>
              We provide materials in multiple formats upon request, including large print, audio,
              and digital formats. Sign language interpreters are available for events with advance notice.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Feedback & Improvements</h2>
            <p>
              We welcome your feedback on how we can improve accessibility. Please contact us at
              accessibility@gracedanceacademy.org or call +1 (555) 123-4567.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
