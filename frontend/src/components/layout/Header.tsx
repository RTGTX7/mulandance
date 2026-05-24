'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';

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
    links: [
      { labelKey: 'performance.currentSeason', href: '/performances' },
    ],
  },
];

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Helper to add locale prefix to href
  const href = (path: string) => `/${locale}${path}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href={href('/')}
          className="flex items-center gap-2"
        >
          <img src="/logo.png" alt="Mulan Dance Studio" className="h-10 w-10 rounded-full object-cover" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label={t('common.accessibility.navigation')}>
          <Link
            href={href('/')}
            className={cn(
              'px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
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
              <button
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md',
                  activeDropdown === section.key && 'text-foreground bg-accent/50'
                )}
              >
                {t(section.labelKey)}
                <ChevronDown className={cn("h-3 w-3 transition-transform", activeDropdown === section.key && "rotate-180")} />
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-popover p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1">
                {section.links.map((link) => {
                  // Ensure href starts with locale prefix - handle fragment (#) in path
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
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
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
                  // Ensure href starts with locale prefix - handle fragment (#) in path
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
            <div className="pt-4 border-t border-border mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}