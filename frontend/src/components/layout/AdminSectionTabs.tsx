'use client';

import { useEffect, useRef, useState } from 'react';
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
import { usersApi, type AdminRole } from '@/lib/api';
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
  ShieldCheck,
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
      { key: 'homepage', labelKey: 'admin.tabs.homepage', icon: Home, href: '/admin/homepage', superOnly: false, teacherAccess: true },
      { key: 'dashboard', labelKey: 'admin.tabs.newsArticles', icon: FileText, href: '/admin/dashboard', superOnly: false, teacherAccess: true },
      { key: 'performances', labelKey: 'admin.tabs.performance', icon: CalendarDays, href: '/admin/performances', superOnly: false, teacherAccess: true },
    ],
  },
  {
    key: 'teaching',
    icon: BookOpen,
    tabs: [
      { key: 'programs', labelKey: 'admin.tabs.programs', icon: BookOpen, href: '/admin/programs', superOnly: false, teacherAccess: true },
      { key: 'schedules', labelKey: 'admin.tabs.schedules', icon: CalendarDays, href: '/admin/schedules', superOnly: false, teacherAccess: true },
      { key: 'faculty', labelKey: 'admin.tabs.faculty', icon: UsersRound, href: '/admin/faculty', superOnly: false, teacherAccess: true },
    ],
  },
  {
    key: 'operations',
    icon: DoorOpen,
    tabs: [
      { key: 'classrooms', labelKey: 'admin.tabs.classrooms', icon: DoorOpen, href: '/admin/classrooms', superOnly: false, teacherAccess: true },
      { key: 'registrations', labelKey: 'admin.tabs.registration', icon: ClipboardList, href: '/admin/registrations', superOnly: true, teacherAccess: false },
    ],
  },
  {
    key: 'system',
    icon: Settings,
    tabs: [
      { key: 'pricing', labelKey: 'admin.tabs.pricing', icon: DollarSign, href: '/admin/pricing', superOnly: true, teacherAccess: false },
      { key: 'schoolPolicy', labelKey: 'admin.tabs.schoolPolicy', icon: FileText, href: '/admin/school-policy', superOnly: true, teacherAccess: false },
      { key: 'settings', labelKey: 'admin.tabs.settings', icon: Settings, href: '/admin/settings', superOnly: true, teacherAccess: false },
      { key: 'accounts', labelKey: 'admin.tabs.accounts', icon: ShieldCheck, href: '/admin/accounts', superOnly: true, teacherAccess: false },
    ],
  },
];

const groupLabels = {
  zh: {
    content: '网站内容',
    teaching: '教学管理',
    operations: '教室与报名',
    system: '系统管理',
    teacherHint: '老师权限',
    superHint: '主管理员',
    current: '当前',
  },
  en: {
    content: 'Website Content',
    teaching: 'Teaching',
    operations: 'Rooms & Registration',
    system: 'System',
    teacherHint: 'Teacher Access',
    superHint: 'Super Admin',
    current: 'Current',
  },
  fr: {
    content: 'Contenu du site',
    teaching: 'Enseignement',
    operations: 'Salles et inscriptions',
    system: 'Système',
    teacherHint: 'Accès professeur',
    superHint: 'Super admin',
    current: 'Actuel',
  },
} as const;

export function AdminSectionTabs() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const labels = groupLabels[locale === 'zh' || locale === 'zh-Hant' || locale === 'fr' ? (locale === 'fr' ? 'fr' : 'zh') : 'en'];
  const [role, setRole] = useState<AdminRole | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeMobileGroupRef = useRef<HTMLButtonElement | null>(null);
  const [mobileGroupKey, setMobileGroupKey] = useState<AdminGroup['key'] | null>(null);

  useEffect(() => {
    usersApi.me()
      .then((user) => setRole(user.role))
      .catch(() => setRole(null));
  }, []);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => role === 'super_admin' || (!tab.superOnly && tab.teacherAccess)),
    }))
    .filter((group) => group.tabs.length > 0);
  const visibleTabs = visibleGroups.flatMap((group) => group.tabs);
  const allTabs = groups.flatMap((group) => group.tabs);
  const activeKey = allTabs.find((tab) => pathname.includes(tab.href))?.key ?? 'dashboard';
  const activeTab = visibleTabs.find((tab) => tab.key === activeKey);
  const activeGroup = visibleGroups.find((group) => group.tabs.some((tab) => tab.key === activeKey));
  const selectedMobileGroup = visibleGroups.find((group) => group.key === (mobileGroupKey || activeGroup?.key)) || visibleGroups[0];

  useEffect(() => {
    activeMobileGroupRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeKey, visibleGroups.length]);

  useEffect(() => {
    if (activeGroup && !mobileGroupKey) {
      setMobileGroupKey(activeGroup.key);
    }
  }, [activeGroup, mobileGroupKey]);

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
          const currentInGroup = group.tabs.find((tab) => tab.key === activeKey);
          const groupLabel = labels[group.key];

          return (
            <button
              key={group.key}
              ref={groupActive ? activeMobileGroupRef : undefined}
              type="button"
              onClick={() => setMobileGroupKey(group.key)}
              className={`inline-flex h-9 min-w-max shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors active:scale-[0.98] ${
                selected
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/20'
                  : 'bg-white/45 text-gray-650 hover:bg-white/80 hover:text-gray-950'
              }`}
              aria-expanded={selected}
            >
              <GroupIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{groupLabel}</span>
              {currentInGroup && (
                <span className={`max-w-[6.75rem] truncate text-[11px] ${selected ? 'text-white/75' : 'text-muted-foreground'}`}>
                  / {t(currentInGroup.labelKey, { defaultMessage: currentInGroup.key })}
                </span>
              )}
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
                    {role === 'super_admin' ? labels.superHint : labels.teacherHint}
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
