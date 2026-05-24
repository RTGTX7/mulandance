'use client';

import Link from 'next/link';
import { useTranslations } from '@/components/ui/i18n-client';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';

const navSections = [
  {
    key: 'about',
    labelKey: 'common.nav.about',
    links: [
      { labelKey: 'about.mission.title', href: '/about/mission-values' },
      { labelKey: 'about.history.title', href: '/about/history' },
      { labelKey: 'about.leadership.title', href: '/about/leadership' },
      { labelKey: 'about.edi.title', href: '/about/equity-diversity-inclusion' },
      { labelKey: 'about.careers.title', href: '/about/careers' },
      { labelKey: 'about.contact.title', href: '/about/contact' },
    ],
  },
  {
    key: 'programs',
    labelKey: 'common.nav.programs',
    links: [
      { labelKey: 'programs.ballet.title', href: '/programs/ballet' },
      { labelKey: 'programs.contemporary.title', href: '/programs/contemporary' },
      { labelKey: 'programs.chinese.title', href: '/programs/chinese-dance' },
      { labelKey: 'programs.jazz.title', href: '/programs/jazz' },
      { labelKey: 'programs.hiphop.title', href: '/programs/hip-hop' },
      { labelKey: 'programs.pricing.title', href: '/classes/pricing' },
    ],
  },
  {
    key: 'performances',
    labelKey: 'common.nav.performances',
    links: [
      { labelKey: 'performances.currentSeason', href: '/performances/current-season' },
      { labelKey: 'performances.archive', href: '/performances/archive' },
      { labelKey: 'performances.tickets', href: '/performances/tickets' },
    ],
  },
  {
    key: 'events',
    labelKey: 'common.nav.events',
    links: [
      { labelKey: 'events.calendar', href: '/events/calendar' },
      { labelKey: 'events.gala', href: '/events/gala' },
      { labelKey: 'events.workshops', href: '/events/workshops' },
    ],
  },
  {
    key: 'classes',
    labelKey: 'common.nav.classes',
    links: [
      { labelKey: 'classes.schedule', href: '/classes/schedule' },
      { labelKey: 'classes.register', href: '/classes/register' },
      { labelKey: 'classes.absencePolicy', href: '/classes/absence-policy' },
      { labelKey: 'classes.faqs', href: '/classes/faqs' },
    ],
  },
  {
    key: 'support',
    labelKey: 'common.nav.support',
    links: [
      { labelKey: 'support.donate', href: '/support/donate' },
      { labelKey: 'support.membership', href: '/support/membership' },
      { labelKey: 'support.sponsorship', href: '/support/sponsorship' },
      { labelKey: 'support.volunteer', href: '/support/volunteer' },
    ],
  },
];

export function Header() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/en"
          className="flex items-center gap-2"
        >
          <span className="heading-sm text-primary">
            {t('common.appName')}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label={t('common.accessibility.navigation')}>
          {navSections.map((section) => (
            <div
              key={section.key}
              className="relative"
              onMouseEnter={() => setActiveDropdown(section.key)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
                  activeDropdown === section.key && 'text-foreground bg-accent/50'
                )}
              >
                {t(section.labelKey)}
                <ChevronDown className="h-3 w-3" />
              </button>
              {activeDropdown === section.key && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-popover p-2 shadow-lg animate-in fade-in slide-in-from-top-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={`/${link.href}`}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/portal/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t('common.nav.portal')}
          </Link>
          <Link
            href="/support/donate"
            className="btn-primary !px-4 !py-2 !text-xs"
          >
            {t('common.buttons.donate')}
          </Link>
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
            {navSections.map((section) => (
              <div key={section.key}>
                <span className="block px-3 py-2 text-sm font-semibold text-foreground">
                  {t(section.labelKey)}
                </span>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={`/${link.href}`}
                    className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-4 border-t border-border mt-4 space-y-3">
              <LanguageSwitcher />
              <Link
                href="/portal/login"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('common.nav.portal')}
              </Link>
              <Link
                href="/support/donate"
                className="block px-3 py-2"
              >
                <span className="btn-primary !w-full !text-xs">
                  {t('common.buttons.donate')}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
