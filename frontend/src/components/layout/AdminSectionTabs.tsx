'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/components/ui/i18n-client';
import { settingsApi, usersApi, type AdminAccount } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  DollarSign,
  DoorOpen,
  FileText,
  Home,
  LayoutGrid,
  Settings,
  UsersRound,
} from 'lucide-react';

type AdminTab = {
  key: string;
  labelKey: string;
  icon: typeof Home;
  href: string;
  superOnly: boolean;
  teacherAccess: boolean;
  permission: string;
};

type AdminGroup = {
  key: 'content' | 'teaching' | 'operations' | 'system';
  icon: typeof Home;
  tabs: AdminTab[];
};

const groups: AdminGroup[] = [
  {
    key: 'content',
    icon: LayoutGrid,
    tabs: [
      { key: 'homepage', labelKey: 'admin.tabs.homepage', icon: Home, href: '/admin/homepage', superOnly: false, teacherAccess: true, permission: 'content.homepage' },
      { key: 'pages', labelKey: 'admin.tabs.pages', icon: FileText, href: '/admin/pages', superOnly: false, teacherAccess: true, permission: 'content.pages' },
      { key: 'dashboard', labelKey: 'admin.tabs.newsArticles', icon: FileText, href: '/admin/dashboard', superOnly: false, teacherAccess: true, permission: 'content.news.articles' },
      { key: 'performances', labelKey: 'admin.tabs.performance', icon: CalendarDays, href: '/admin/performances', superOnly: false, teacherAccess: true, permission: 'content.performances' },
    ],
  },
  {
    key: 'teaching',
    icon: BookOpen,
    tabs: [
      { key: 'programs', labelKey: 'admin.tabs.programs', icon: BookOpen, href: '/admin/programs', superOnly: false, teacherAccess: true, permission: 'teaching.programs' },
      { key: 'schedules', labelKey: 'admin.tabs.schedules', icon: CalendarDays, href: '/admin/schedules', superOnly: false, teacherAccess: true, permission: 'teaching.schedules' },
      { key: 'pricing', labelKey: 'admin.tabs.pricing', icon: DollarSign, href: '/admin/pricing', superOnly: true, teacherAccess: false, permission: 'teaching.pricing' },
      { key: 'faculty', labelKey: 'admin.tabs.faculty', icon: UsersRound, href: '/admin/faculty', superOnly: true, teacherAccess: false, permission: 'teaching.faculty' },
      { key: 'registrations', labelKey: 'admin.tabs.registration', icon: ClipboardList, href: '/admin/registrations', superOnly: true, teacherAccess: false, permission: 'teaching.registration' },
    ],
  },
  {
    key: 'operations',
    icon: DoorOpen,
    tabs: [
      { key: 'classrooms', labelKey: 'admin.tabs.classrooms', icon: DoorOpen, href: '/admin/classrooms', superOnly: true, teacherAccess: false, permission: 'classrooms.rentals' },
    ],
  },
  {
    key: 'system',
    icon: Settings,
    tabs: [
      { key: 'settings', labelKey: 'admin.tabs.settings', icon: Settings, href: '/admin/settings', superOnly: false, teacherAccess: true, permission: 'system' },
    ],
  },
];

const groupLabels = {
  zh: {
    content: '网站内容',
    teaching: '教学管理',
    operations: '教室使用',
    system: '系统管理',
    teacherHint: '老师权限',
    superHint: '主管理员',
    current: '当前',
  },
  en: {
    content: 'Website Content',
    teaching: 'Teaching',
    operations: 'Classroom Use',
    system: 'System',
    teacherHint: 'Teacher Access',
    superHint: 'Super Admin',
    current: 'Current',
  },
  fr: {
    content: 'Contenu du site',
    teaching: 'Enseignement',
    operations: 'Utilisation des salles',
    system: 'Système',
    teacherHint: 'Accès professeur',
    superHint: 'Super admin',
    current: 'Actuel',
  },
} as const;

const CentralAdminNavigationContext = createContext(false);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [brand, setBrand] = useState({ site_name: 'Mulan Dance Studio', logo_url: '/logo.png' });
  const isLogin = pathname.includes('/admin/login');

  useEffect(() => {
    settingsApi.site(locale)
      .then((settings) => setBrand({ site_name: settings.site_name || 'Mulan Dance Studio', logo_url: settings.logo_url || '/logo.png' }))
      .catch(() => {});
  }, [locale]);

  if (isLogin) return <>{children}</>;
  return (
    <CentralAdminNavigationContext.Provider value>
      <div className="min-h-screen bg-[#f7f5f8]">
        <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
            <Link href={`/${locale}`} className="flex min-h-10 shrink-0 items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-muted/70" aria-label={`${brand.site_name} - home`}>
              <img src={brand.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-full border border-border object-cover" />
              <span className="max-w-24 truncate text-xs font-semibold text-foreground sm:max-w-40 sm:text-sm lg:max-w-52">{brand.site_name}</span>
            </Link>
            <div className="min-w-0 flex-1"><AdminSectionTabs force /></div>
          </div>
        </header>
        <div className="min-w-0">{children}</div>
      </div>
    </CentralAdminNavigationContext.Provider>
  );
}

export function AdminSectionTabs({ force = false }: { force?: boolean }) {
  const centralized = useContext(CentralAdminNavigationContext);
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = groupLabels[locale === 'zh' || locale === 'zh-Hant' || locale === 'fr' ? (locale === 'fr' ? 'fr' : 'zh') : 'en'];
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeMobileGroupRef = useRef<HTMLButtonElement | null>(null);
  const [mobileGroupKey, setMobileGroupKey] = useState<AdminGroup['key'] | null>(null);

  useEffect(() => {
    usersApi.me()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => hasPermission(account, tab.permission)),
    }))
    .filter((group) => group.tabs.length > 0);
  const visibleTabs = visibleGroups.flatMap((group) => group.tabs);
  const allTabs = groups.flatMap((group) => group.tabs);
  const systemSettingsRoutes = ['/admin/studio-resources', '/admin/school-policy', '/admin/profile', '/admin/accounts'];
  const activeKey = systemSettingsRoutes.some((href) => pathname.includes(href))
    ? 'settings'
    : allTabs.find((tab) => pathname.includes(tab.href))?.key ?? 'dashboard';
  const activeTab = visibleTabs.find((tab) => tab.key === activeKey);
  const activeGroup = visibleGroups.find((group) => group.tabs.some((tab) => tab.key === activeKey));
  const selectedMobileGroup = visibleGroups.find((group) => group.key === mobileGroupKey);

  useEffect(() => {
    activeMobileGroupRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeKey, visibleGroups.length]);

  if (centralized && !force) return null;

  return (
    <div className="relative -mx-2 w-[calc(100%+1rem)] rounded-lg border border-white/60 bg-white/75 p-1.5 shadow-sm shadow-purple-950/5 backdrop-blur-xl sm:mx-0 sm:w-full">
      <div className="pointer-events-none absolute bottom-1.5 left-0 top-1.5 z-10 w-5 bg-gradient-to-r from-white/90 to-transparent lg:hidden" />
      <div className="pointer-events-none absolute bottom-1.5 right-0 top-1.5 z-10 w-5 bg-gradient-to-l from-white/90 to-transparent lg:hidden" />

      <div
        className="flex touch-pan-x items-center gap-1.5 overflow-x-scroll overscroll-x-contain scroll-px-4 px-3 pb-2 pt-0.5 [scrollbar-color:rgba(107,33,168,0.42)_transparent] [scrollbar-width:thin] lg:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="Admin function groups"
      >
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = activeGroup?.key === group.key;
          const selected = selectedMobileGroup?.key === group.key;
          const highlighted = selected || groupActive;
          const groupLabel = labels[group.key];

          return (
            <button
              key={group.key}
              ref={groupActive ? activeMobileGroupRef : undefined}
              type="button"
              onClick={() => {
                if (group.tabs.length === 1) {
                  router.push(`/${locale}${group.tabs[0].href}`);
                  return;
                }
                setMobileGroupKey((current) => (current === group.key ? null : group.key));
              }}
              className={`inline-flex h-9 min-w-max shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors active:scale-[0.98] ${
                highlighted
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20'
                  : 'bg-white/45 text-gray-650 hover:bg-white/80 hover:text-gray-950'
              }`}
              aria-expanded={selected}
            >
              <GroupIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{groupLabel}</span>
            </button>
          );
        })}
      </div>

      {selectedMobileGroup && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 px-1 pb-1 lg:hidden">
          {selectedMobileGroup.tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeKey === tab.key;
            const label = t(tab.labelKey, { defaultMessage: tab.key === 'accounts' ? 'Accounts' : tab.key });

            return (
              <Link
                key={tab.key}
                href={`/${locale}${tab.href}`}
                className={`inline-flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98] ${
                  active
                    ? 'border border-purple-200 bg-purple-50 text-purple-700'
                    : 'border border-white/60 bg-white/45 text-gray-650 hover:bg-white/85 hover:text-gray-950'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div
        className="hidden items-center gap-1.5 lg:flex lg:flex-wrap"
        aria-label="Admin function sections"
      >
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = activeGroup?.key === group.key;
          const currentInGroup = group.tabs.find((tab) => tab.key === activeKey);
          const groupLabel = labels[group.key];

          if (group.tabs.length === 1) {
            const tab = group.tabs[0];
            const tabLabel = t(tab.labelKey, { defaultMessage: tab.key });
            return (
              <Button
                key={group.key}
                ref={groupActive ? activeTriggerRef : undefined}
                type="button"
                size="sm"
                variant={groupActive ? 'default' : 'ghost'}
                onClick={() => router.push(`/${locale}${tab.href}`)}
                className={`h-9 min-w-max shrink-0 rounded-lg px-3 text-xs md:h-9 md:text-sm ${
                  groupActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20 hover:bg-purple-700'
                    : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                }`}
              >
                <GroupIcon className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="whitespace-nowrap">{groupLabel}</span>
                {tabLabel !== groupLabel && (
                  <span className={`ml-1 max-w-[10rem] truncate text-[11px] md:text-xs ${groupActive ? 'text-white/75' : 'text-muted-foreground'}`}>
                    / {tabLabel}
                  </span>
                )}
              </Button>
            );
          }

          return (
            <DropdownMenu key={group.key}>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={groupActive ? activeTriggerRef : undefined}
                  type="button"
                  size="sm"
                  variant={groupActive ? 'default' : 'ghost'}
                  className={`h-9 min-w-max shrink-0 rounded-lg px-3 text-xs md:h-9 md:text-sm ${
                    groupActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20 hover:bg-purple-700'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  }`}
                >
                  <GroupIcon className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="whitespace-nowrap">{groupLabel}</span>
                  {currentInGroup && (
                    <span className={`ml-1 max-w-[7.5rem] truncate text-[11px] sm:max-w-[10rem] md:text-xs ${groupActive ? 'text-white/75' : 'text-muted-foreground'}`}>
                      / {t(currentInGroup.labelKey, { defaultMessage: currentInGroup.key })}
                    </span>
                  )}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56 max-w-[calc(100vw-1.5rem)]">
                <DropdownMenuLabel className="flex items-center justify-between gap-3">
                  <span>{groupLabel}</span>
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                    {account?.role === 'super_admin' ? labels.superHint : labels.teacherHint}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeKey === tab.key;
                  const label = t(tab.labelKey, { defaultMessage: tab.key === 'accounts' ? 'Accounts' : tab.key });

                  return (
                    <DropdownMenuItem
                      key={tab.key}
                      className={`cursor-pointer gap-2 ${active ? 'bg-purple-50 text-purple-700' : ''}`}
                      onClick={() => router.push(`/${locale}${tab.href}`)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{label}</span>
                      {active && <span className="text-xs text-purple-600">{labels.current}</span>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
        {activeTab && (
          <div className="ml-auto hidden items-center rounded-lg border border-white/60 bg-white/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl lg:flex">
            {labels.current}: <span className="ml-1 font-semibold text-foreground">{t(activeTab.labelKey, { defaultMessage: activeTab.key })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
