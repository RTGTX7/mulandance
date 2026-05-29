'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Menu, X, ChevronDown, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isAuthenticated, clearAuthToken, settingsApi, type SystemSettings } from '@/lib/api';
import { useRouter } from 'next/navigation';

const navSections = [
  {
    key: 'about',
    labelKey: 'common.nav.about',
    links: [
      { labelKey: 'about.title', href: '/about' },
      { labelKey: 'about.leadership.title', href: '/about/leadership' },
      { labelKey: 'about.contact.title', href: '/about/contact' },
    ],
  },
  {
    key: 'programs',
    labelKey: 'common.nav.programs',
    links: [
      { labelKey: 'home.programs.chinese', href: '/programs#chinese' },
      { labelKey: 'home.programs.folk', href: '/programs#folk' },
      { labelKey: 'home.programs.ballet', href: '/programs#ballet' },
      { labelKey: 'home.programs.contemporary', href: '/programs#contemporary' },
      { labelKey: 'home.programs.jazz', href: '/programs#jazz' },
      { labelKey: 'home.programs.hiphop', href: '/programs#hiphop' },
      { labelKey: 'programs.summer.title', href: '/programs/summer-camps' },
    ],
  },
  {
    key: 'performances',
    labelKey: 'common.nav.performances',
    href: '/performances',
    links: [
      { labelKey: 'performanceTimeline.title', href: '/performances' },
      { labelKey: 'performanceTimeline.upcoming', href: '/performances#upcoming' },
      { labelKey: 'performanceTimeline.archive', href: '/performances#archive' },
    ],
  },
];

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
  youtube_url: '',
  xiaohongshu_url: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Helper to add locale prefix to href
  const href = (path: string) => `/${locale}${path}`;
  const configuredHref = (path: string) => {
    if (!path) return href('/');
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:') || path.startsWith('tel:')) {
      return path;
    }
    return href(path.startsWith('/') ? path : `/${path}`);
  };
  const ctaLabel =
    settings.header_cta_label && settings.header_cta_label !== defaultSettings.header_cta_label
      ? settings.header_cta_label
      : t('common.buttons.register');
  const ctaHref = settings.header_cta_href || defaultSettings.header_cta_href;

  useEffect(() => {
    const checkAuth = () => setAuthenticated(isAuthenticated());
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    settingsApi.site().then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setAuthenticated(false);
    router.push(href('/admin/login'));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {settings.announcement_enabled && settings.announcement_text && (
        <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          {settings.announcement_href ? (
            <a href={configuredHref(settings.announcement_href)} className="underline-offset-4 hover:underline">
              {settings.announcement_text}
            </a>
          ) : (
            settings.announcement_text
          )}
        </div>
      )}
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link
          href={href('/')}
          className="flex items-center gap-2"
        >
          <img src={settings.logo_url || '/logo.png'} alt={settings.site_name} className="h-10 w-10 rounded-full object-cover" />
          <span className="hidden text-sm font-semibold text-foreground 2xl:inline">{settings.site_name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label={t('common.accessibility.navigation')}>
          <Link
            href={href('/')}
            className={cn(
              'whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
              activeDropdown === null && 'text-foreground'
            )}
          >
            {t('common.nav.home')}
          </Link>
           {navSections.map((section) => (
            <div
              key={section.key}
              className="relative group"
            >
              {section.href ? (
                <Link
                  href={href(section.href)}
                  className={cn(
                    'flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
                    activeDropdown === section.key && 'text-foreground bg-accent/50'
                  )}
                >
                  {t(section.labelKey)}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", activeDropdown === section.key && "rotate-180")} />
                </Link>
              ) : (
                <button
                  className={cn(
                    'flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
                    activeDropdown === section.key && 'text-foreground bg-accent/50'
                  )}
                >
                  {t(section.labelKey)}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", activeDropdown === section.key && "rotate-180")} />
                </button>
              )}
              <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-popover p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1">
                {section.links.map((link) => {
                  const linkPath = link.href.split('#')[0];
                  const fragment = link.href.includes('#') ? link.href.split('#')[1] : '';
                  const fullPath = `/${locale}${linkPath}` + (fragment ? `#${fragment}` : '');
                  return (
                    <Link
                      key={link.href}
                      href={fullPath}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <Link
            href={href('/classes/schedule')}
            className="whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md"
          >
            {t('common.nav.schedule', { defaultMessage: 'Schedule' })}
          </Link>
          <Link
            href={href('/classrooms')}
            className="whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md"
          >
            {t('common.nav.classrooms', { defaultMessage: 'Rentals' })}
          </Link>
          <Link
            href={href('/news')}
            className="whitespace-nowrap px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md"
          >
            {t('common.nav.news')}
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="default" size="sm" asChild>
            <a href={configuredHref(ctaHref)}>
              {ctaLabel}
            </a>
          </Button>
          {authenticated ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={href('/admin/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 2xl:mr-1" />
                  <span className="hidden 2xl:inline">Dashboard</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 2xl:mr-1" />
                <span className="hidden 2xl:inline">{t('admin.common.logout')}</span>
              </Button>
            </>
          ) : settings.show_admin_login ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={href('/admin/login')}>
                <LogIn className="h-4 w-4 2xl:mr-1" />
                <span className="hidden 2xl:inline">Login</span>
              </Link>
            </Button>
          ) : null}
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('common.accessibility.close') : t('common.accessibility.menu')}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container py-4 space-y-1">
            <Link
              href={href('/')}
              className="block px-3 py-2 text-sm font-semibold text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.home')}
            </Link>
            {navSections.map((section) => (
              <div key={section.key}>
                <span className="block px-3 py-2 text-sm font-semibold text-foreground">
                  {t(section.labelKey)}
                </span>
                {section.links.map((link) => {
                  const linkPath = link.href.split('#')[0];
                  const fragment = link.href.includes('#') ? link.href.split('#')[1] : '';
                  const fullPath = `/${locale}${linkPath}` + (fragment ? `#${fragment}` : '');
                  return (
                    <Link
                      key={link.href}
                      href={fullPath}
                      className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
            ))}
            <Link
              href={href('/classes/schedule')}
              className="block px-3 py-2 text-sm font-semibold text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.schedule', { defaultMessage: 'Schedule' })}
            </Link>
            <Link
              href={href('/news')}
              className="block px-3 py-2 text-sm font-semibold text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.news')}
            </Link>
            <Link
              href={href('/classrooms')}
              className="block px-3 py-2 text-sm font-semibold text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.classrooms', { defaultMessage: 'Rentals' })}
            </Link>
            <div className="pt-4">
              <a
                href={configuredHref(ctaHref)}
                className="mb-2 flex w-full items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {ctaLabel}
              </a>
              {authenticated ? (
                <>
                  <Link href={href('/admin/dashboard')} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-md" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />
                    {t('admin.dashboard.title')}
                  </Link>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-md" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" />
                    {t('admin.common.logout')}
                  </button>
                </>
              ) : settings.show_admin_login ? (
                <Link href={href('/admin/login')} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-md" onClick={() => setMobileOpen(false)}>
                  <LogIn className="h-4 w-4" />
                  {t('admin.login.signIn')}
                </Link>
              ) : null}
            </div>
            <div className="pt-4 border-t border-border mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
