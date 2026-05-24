'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  const t = useTranslations();
  const locale = useLocale();

  const href = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[300px] bg-gradient-to-r from-primary to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.about'), href: '/about' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('about.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('about.intro_intro')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container">
          {/* About Content */}
          <div className="space-y-12 mb-12">
            <section>
              <h2 className="heading-lg mb-4">{t('about.philosophy.heading')}</h2>
              <p className="text-lead mb-4">{t('about.philosophy.desc')}</p>
            </section>

            <section>
              <h2 className="heading-lg mb-4">{t('about.goals.title')}</h2>
              <div className="space-y-2 text-body text-muted-foreground">
                <p>• {t('about.goals.items.0')}</p>
                <p>• {t('about.goals.items.1')}</p>
                <p>• {t('about.goals.items.2')}</p>
                <p>• {t('about.goals.items.3')}</p>
                <p>• {t('about.goals.items.4')}</p>
              </div>
            </section>

            <section>
              <h2 className="heading-lg mb-4">{t('about.vision.title')}</h2>
              <div className="space-y-2 text-body text-muted-foreground">
                <p>• {t('about.vision.items.0')}</p>
                <p>• {t('about.vision.items.1')}</p>
                <p>• {t('about.vision.items.2')}</p>
                <p>• {t('about.vision.items.3')}</p>
                <p>• {t('about.vision.items.4')}</p>
              </div>
            </section>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-accent/30 rounded-2xl p-12 text-center">
            <h2 className="heading-lg mb-4">Coming Soon</h2>
            <p className="text-lead text-muted-foreground mb-6">
              More content is under development.
            </p>
            <p className="text-body text-muted-foreground">
              {t('about.joinUs.subtitle')}
            </p>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Link href={href('about/contact')}>
              <Button size="lg">{t('about.contact.title')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}