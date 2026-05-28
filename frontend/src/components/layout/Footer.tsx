'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { useEffect, useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Music2, Phone, Youtube } from 'lucide-react';
import { settingsApi, type SystemSettings } from '@/lib/api';

const defaultSettings: SystemSettings = {
  site_name: 'Mulan Dance Studio',
  logo_url: '/logo.png',
  header_cta_label: 'Register',
  header_cta_href: '/classes/register',
  show_admin_login: true,
  announcement_enabled: false,
  announcement_text: '',
  announcement_href: '',
  footer_description: '',
  footer_newsletter_title: 'Join Us',
  footer_newsletter_text: '',
  copyright_text: 'All rights reserved.',
  privacy_href: '/privacy',
  contact_email: 'info@mulandance.com',
  contact_phone: '3437771766',
  contact_address: '',
  youtube_url: 'https://www.youtube.com/@mulandancestudio21',
  xiaohongshu_url: 'https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  useEffect(() => {
    settingsApi.site().then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => {});
  }, []);

  const href = (path: string) => {
    if (!path) return `/${locale}`;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:') || path.startsWith('tel:')) {
      return path;
    }
    return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const socialLinks = [
    { icon: Youtube, href: settings.youtube_url, label: 'YouTube' },
    { icon: Instagram, href: settings.instagram_url, label: 'Instagram' },
    { icon: Facebook, href: settings.facebook_url, label: 'Facebook' },
    { icon: Music2, href: settings.tiktok_url, label: 'TikTok' },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-border bg-card">
      <div className="section-padding container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <h3 className="heading-sm mb-4 text-primary">
              {settings.site_name || t('common.appName')}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {settings.footer_description || t('about.intro_intro')}
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ icon: Icon, href: socialHref, label }) => (
                <a
                  key={label}
                  href={socialHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-secondary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
              {settings.xiaohongshu_url && (
                <a
                  href={settings.xiaohongshu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="RedNote"
                  className="rounded-sm text-xs font-bold text-muted-foreground transition-colors hover:text-secondary"
                >
                  RED
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              {[
                { label: t('common.nav.about'), path: '/about' },
                { label: t('common.nav.programs'), path: '/programs' },
                { label: t('common.nav.performances'), path: '/performances' },
                { label: t('common.nav.contact'), path: '/about/contact' },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={href(item.path)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {t('common.footer.contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{settings.contact_address || t('common.footer.address')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${settings.contact_phone}`} className="transition-colors hover:text-foreground">
                  {settings.contact_phone || t('common.footer.phone')}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${settings.contact_email}`} className="transition-colors hover:text-foreground">
                  {settings.contact_email || t('common.footer.email')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="heading-sm mb-4 text-sm font-semibold">
              {settings.footer_newsletter_title || t('common.footer.newsletter')}
            </h4>
            <p className="mb-3 text-sm text-muted-foreground">
              {settings.footer_newsletter_text || t('about.joinUs.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} {settings.site_name || t('common.appName')}. {settings.copyright_text || t('common.footer.copyright')}
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href={href(settings.privacy_href || '/privacy')} className="transition-colors hover:text-foreground">
              {t('common.footer.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
