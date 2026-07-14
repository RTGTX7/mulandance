'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  outbound_email: '',
  classroom_request_limit_per_contact: 0,
  program_pricing_json: '',
  classroom_pricing_json: '',
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
    settingsApi.site(locale).then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => {});
  }, [locale]);

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
    <footer className="border-t border-white/60 bg-white/70 shadow-inner shadow-white/40 backdrop-blur-xl">
      <div className="container py-7 md:py-14">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <h3 className="mb-2 text-xl font-bold leading-tight text-primary md:text-2xl">
              {settings.site_name || t('common.appName')}
            </h3>
            <p className="mb-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:max-w-none">
              {settings.footer_description || t('about.intro_intro')}
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ icon: Icon, href: socialHref, label }) => (
                <a
                  key={label}
                  href={socialHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white/45 text-primary shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:text-secondary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              {settings.xiaohongshu_url && (
                <a
                  href={settings.xiaohongshu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="RedNote"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#fe2442]/20 bg-[#fe2442] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e81f3b]"
                >
                  <Image src="/xiaohongshu-icon.svg" alt="" width={16} height={16} />
                </a>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="mb-2 text-sm font-semibold leading-tight text-foreground">
              {t('common.footer.quickLinks')}
            </h4>
            <ul className="space-y-1.5">
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

          <div className="min-w-0">
            <h4 className="mb-2 text-sm font-semibold leading-tight text-foreground">
              {t('common.footer.contact')}
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5 text-sm leading-snug text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{settings.contact_address || t('common.footer.address')}</span>
              </li>
              <li className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${settings.contact_phone}`} className="transition-colors hover:text-foreground">
                  {settings.contact_phone || t('common.footer.phone')}
                </a>
              </li>
              <li className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${settings.contact_email}`} className="min-w-0 break-all transition-colors hover:text-foreground">
                  {settings.contact_email || t('common.footer.email')}
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="mb-2 text-sm font-semibold leading-tight text-foreground">
              {settings.footer_newsletter_title || t('common.footer.newsletter')}
            </h4>
            <p className="mb-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:max-w-none">
              {settings.footer_newsletter_text || t('about.joinUs.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t border-white/60 pt-4 sm:flex-row sm:items-center md:mt-8">
          <p className="text-xs leading-snug text-muted-foreground">
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
