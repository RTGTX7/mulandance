import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function PrivacyPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.footer.privacyPolicy'), href: 'privacy' }]} />
        <h1 className="heading-xl mb-4">{t('common.footer.privacyPolicy')}</h1>
        <p className="text-muted-foreground mb-8">Last updated: May 1, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground">
          <section>
            <h2 className="heading-md mb-3 text-foreground">Information We Collect</h2>
            <p>
              We collect information you provide directly, such as name, email address, phone number,
              and payment information when you register for classes, make donations, or contact us.
              We also collect information about your child(ren) for enrollment purposes.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">How We Use Your Information</h2>
            <p>
              We use the information we collect to provide and improve our services, process registrations
              and payments, communicate with you about classes and events, send newsletters (with your
              consent), and ensure the safety of our students.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share
              information with service providers who assist us in operating our website and services,
              or when required by law.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. Contact us
              at privacy@gracedanceacademy.org to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Contact</h2>
            <p>
              If you have questions about this privacy policy, please contact us at
              privacy@gracedanceacademy.org.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
