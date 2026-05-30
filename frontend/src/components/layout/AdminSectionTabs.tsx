'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/ui/i18n-client';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  DollarSign,
  DoorOpen,
  FileText,
  Settings,
  UsersRound,
} from 'lucide-react';

const tabs = [
  { key: 'dashboard', labelKey: 'admin.tabs.newsArticles', icon: FileText, href: '/admin/dashboard' },
  { key: 'performances', labelKey: 'admin.tabs.performance', icon: CalendarDays, href: '/admin/performances' },
  { key: 'programs', labelKey: 'admin.tabs.programs', icon: BookOpen, href: '/admin/programs' },
  { key: 'schedules', labelKey: 'admin.tabs.schedules', icon: CalendarDays, href: '/admin/schedules' },
  { key: 'registrations', labelKey: 'admin.tabs.registration', icon: ClipboardList, href: '/admin/registrations' },
  { key: 'faculty', labelKey: 'admin.tabs.faculty', icon: UsersRound, href: '/admin/faculty' },
  { key: 'classrooms', labelKey: 'admin.tabs.classrooms', icon: DoorOpen, href: '/admin/classrooms' },
  { key: 'pricing', labelKey: 'admin.tabs.pricing', icon: DollarSign, href: '/admin/pricing' },
  { key: 'settings', labelKey: 'admin.tabs.settings', icon: Settings, href: '/admin/settings' },
];

export function AdminSectionTabs() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const activeKey = tabs.find((tab) => pathname.includes(tab.href))?.key ?? 'dashboard';

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      <div className="flex min-w-max items-center gap-0.5 whitespace-nowrap">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeKey === tab.key;

        return (
          <Button
            key={tab.key}
            type="button"
            size="sm"
            variant={active ? 'default' : 'ghost'}
            className={`h-9 shrink-0 rounded-md px-2.5 text-sm ${
              active
                ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => router.push(`/${locale}${tab.href}`)}
          >
            <Icon className="mr-1 h-4 w-4" />
            {t(tab.labelKey)}
          </Button>
        );
      })}
      </div>
    </div>
  );
}
