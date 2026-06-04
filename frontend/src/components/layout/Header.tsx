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

type NavSection = {
  key: string;
  labelKey: string;
  href?: string;
  links: Array<{
    labelKey: string;
    href: string;
  }>;
};

const navSections: NavSection[] = [
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
    key: 'performances',
    labelKey: 'common.nav.performances',
    links: [
      { labelKey: 'performanceTimeline.title', href: '/performances' },
      { labelKey: 'performanceTimeline.upcoming', href: '/performances#upcoming' },
      { labelKey: 'performanceTimeline.archive', href: '/performances#archive' },
    ],
  },
  {
    key: 'programs',
    labelKey: 'common.nav.programs',
    links: [
      { labelKey: 'common.nav.programs', href: '/programs' },
      { labelKey: 'programs.pricing.title', href: '/programs/pricing' },
    ],
  },
  {
    key: 'rentals',
    labelKey: 'common.nav.classrooms',
    links: [
      { labelKey: 'classroomsPage.navSchedule', href: '/classrooms#schedule' },
      { labelKey: 'classroomsPage.navBook', href: '/classrooms#book' },
      { labelKey: 'classroomsPage.navPricing', href: '/classrooms/pricing' },
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
  program_pricing_json: '',
  classroom_pricing_json: '',
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
    settingsApi.site(locale).then((data) => setSettings({ ...defaultSettings, ...data })).catch(() => {});
  }, [locale]);

  const handleLogout = () => {
    clearAuthToken();
    setAuthenticated(false);
    router.push(href('/admin/login'));
  };

  return (
    <header className="glass-nav sticky top-0 z-40 w-full supports-[backdrop-filter]:bg-white/75">
      {settings.announcement_enabled && settings.announcement_text && (
        <div className="bg-primary/90 px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm backdrop-blur-xl">
          {settings.announcement_href ? (
            <a href={configuredHref(settings.announcement_href)} className="underline-offset-4 hover:underline">
              {settings.announcement_text}
            </a>
          ) : (
            settings.announcement_text
          )}
        </div>
      )}
      <div className="container flex h-12 items-center justify-between gap-2 md:h-14 md:gap-3">
        <Link
          href={href('/')}
          className="flex min-w-0 items-center gap-2"
        >
          <img src={settings.logo_url || '/logo.png'} alt={settings.site_name} className="h-8 w-8 shrink-0 rounded-full object-cover md:h-9 md:w-9" />
          <span className="truncate text-sm font-semibold text-foreground sm:max-w-[180px] md:max-w-[220px] lg:hidden 2xl:inline">{settings.site_name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label={t('common.accessibility.navigation')}>
          <Link
            href={href('/')}
            className={cn(
                  'whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:shadow-sm',
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
                    'flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:shadow-sm',
                    activeDropdown === section.key && 'bg-white/60 text-foreground shadow-sm'
                  )}
                >
                  {t(section.labelKey)}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", activeDropdown === section.key && "rotate-180")} />
                </Link>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:shadow-sm',
                    activeDropdown === section.key && 'bg-white/60 text-foreground shadow-sm'
                  )}
                >
                  {t(section.labelKey)}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", activeDropdown === section.key && "rotate-180")} />
                </button>
              )}
              <div className="invisible absolute left-0 top-full mt-2 w-56 translate-y-1 rounded-lg border border-white/70 bg-white/90 p-2 opacity-0 shadow-xl shadow-purple-950/10 backdrop-blur-xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {section.links.map((link) => {
                  const linkPath = link.href.split('#')[0];
                  const fragment = link.href.includes('#') ? link.href.split('#')[1] : '';
                  const fullPath = `/${locale}${linkPath}` + (fragment ? `#${fragment}` : '');
                  return (
                    <Link
                      key={link.href}
                      href={fullPath}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-white/70 hover:text-foreground"
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
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:shadow-sm"
          >
            {t('common.nav.schedule', { defaultMessage: 'Schedule' })}
          </Link>
          <Link
            href={href('/news')}
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/60 hover:text-foreground hover:shadow-sm"
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

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          {authenticated && (
            <Link
              href={href('/admin/dashboard')}
              className="glass-control inline-flex h-8 items-center gap-1.5 px-2 text-xs font-semibold text-primary transition-all hover:bg-white/80 active:scale-95"
              aria-label={t('admin.dashboard.title')}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden min-[390px]:inline">Dashboard</span>
            </Link>
          )}
          <LanguageSwitcher compact />
          <button
            className="glass-control p-1.5 transition-all hover:bg-white/80 active:scale-95"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('common.accessibility.close') : t('common.accessibility.menu')}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100svh-3rem)] overflow-y-auto border-t border-white/60 bg-white/80 shadow-lg shadow-purple-950/10 backdrop-blur-xl lg:hidden">
          <div className="container space-y-2 py-2">
            <Link
              href={href('/')}
              className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.home')}
            </Link>
            {navSections.map((section) => (
              <div key={section.key} className="rounded-lg border border-white/60 bg-white/50 p-1 shadow-sm">
                <span className="block px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
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
                      className="block rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-white/70"
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
              className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.schedule', { defaultMessage: 'Schedule' })}
            </Link>
            <Link
              href={href('/news')}
              className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60"
              onClick={() => setMobileOpen(false)}
            >
              {t('common.nav.news')}
            </Link>
            <div className="sticky bottom-0 -mx-1 rounded-lg border border-white/60 bg-white/80 p-1.5 shadow-lg shadow-purple-950/10 backdrop-blur-xl">
              <a
                href={configuredHref(ctaHref)}
                className="mb-1.5 flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all active:scale-[0.98]"
                onClick={() => setMobileOpen(false)}
              >
                {ctaLabel}
              </a>
              {authenticated ? (
                <>
                  <Link href={href('/admin/dashboard')} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />
                    {t('admin.dashboard.title')}
                  </Link>
                  <button className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" />
                    {t('admin.common.logout')}
                  </button>
                </>
              ) : settings.show_admin_login ? (
                <Link href={href('/admin/login')} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-white/60" onClick={() => setMobileOpen(false)}>
                  <LogIn className="h-4 w-4" />
                  {t('admin.login.signIn')}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
