import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function TermsPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.footer.termsOfService'), href: 'terms' }]} />
        <h1 className="heading-xl mb-4">{t('common.footer.termsOfService')}</h1>
        <p className="text-muted-foreground mb-8">Last updated: May 1, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground">
          <section>
            <h2 className="heading-md mb-3 text-foreground">Acceptance of Terms</h2>
            <p>
              By accessing and using the Grace Dance Academy website and services, you agree to be
              bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Registration</h2>
            <p>
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account credentials and for all
              activities under your account.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Enrollment & Payments</h2>
            <p>
              Class enrollment is subject to availability. Tuition fees are non-refundable after the
              first 14 days of a term. Cancellation requests must be submitted in writing. See our
              Absence & Makeup Policy for details.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Code of Conduct</h2>
            <p>
              All students, parents, and visitors must adhere to our code of conduct, which includes
              respecting staff and other students, following studio rules, and maintaining a safe
              and welcoming environment for everyone.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Intellectual Property</h2>
            <p>
              All content on this website, including text, images, videos, and choreography, is the
              property of Grace Dance Academy and is protected by copyright laws.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Limitation of Liability</h2>
            <p>
              Grace Dance Academy is not liable for any injuries sustained during dance activities.
              Participants engage in dance at their own risk. A waiver must be signed before
              participation in any class or performance.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-3 text-foreground">Contact</h2>
            <p>
              For questions about these terms, contact us at legal@gracedanceacademy.org.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
