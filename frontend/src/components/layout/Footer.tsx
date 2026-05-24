'use client';

import Link from 'next/link';
import { useTranslations } from '@/components/ui/i18n-client';
import { Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

const socialLinks = [
  { icon: Youtube, href: 'https://www.youtube.com/@mulandancestudio21', label: 'YouTube' },
];

function XiaohongshuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
}

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
              {t('about.intro_intro')}
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
              <a
                href="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="小红书"
                className="text-muted-foreground hover:text-secondary transition-colors"
              >
                <XiaohongshuIcon />
              </a>
            </div>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
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
                  href="/about/contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.nav.contact')}
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
                <a href="tel:3437771766" className="hover:text-foreground transition-colors">
                  {t('common.footer.phone')}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@mulandance.com" className="hover:text-foreground transition-colors">
                  {t('common.footer.email')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.newsletter')}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {t('about.joinUs.subtitle')}
            </p>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
