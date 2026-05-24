'use client';

import Link from 'next/link';
import { useTranslations } from '@/components/ui/i18n-client';
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  { icon: Twitter, href: 'https://twitter.com', label: 'X (Twitter)' },
];

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border bg-card">
      <div className="section-padding container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <h3 className="heading-sm mb-4 text-primary">
              {t('common.appName')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground hover:text-secondary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about/mission-values"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/ballet"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.programs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/performances/current-season"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.performances')}
                </Link>
              </li>
              <li>
                <Link
                  href="/events/calendar"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.events')}
                </Link>
              </li>
              <li>
                <Link
                  href="/support/donate"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.support')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('common.footer.address')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{t('common.footer.phone')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{t('common.footer.email')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.newsletter')}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Stay updated with our latest news and events.
            </p>
            <form className="space-y-2" action="#" method="POST">
              <input
                type="email"
                placeholder={t('common.footer.newsletterPlaceholder')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="btn-primary !w-full !py-2 !text-xs"
              >
                {t('common.footer.newsletterButton')}
              </button>
            </form>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} {t('common.appName')}. {t('common.footer.copyright')}
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              {t('common.footer.privacyPolicy')}
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              {t('common.footer.termsOfService')}
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-foreground transition-colors"
            >
              {t('common.footer.accessibility')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
