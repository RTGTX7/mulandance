'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/ui/i18n-client';
import { FileText, CalendarDays, ClipboardList } from 'lucide-react';

const tabs = [
  { key: 'dashboard', labelKey: 'admin.tabs.newsArticles', icon: FileText, href: '/admin/dashboard' },
  { key: 'performances', labelKey: 'admin.tabs.performance', icon: CalendarDays, href: '/admin/performances' },
  { key: 'registrations', labelKey: 'admin.tabs.registration', icon: ClipboardList, href: '/admin/registrations' },
];

export function AdminSectionTabs() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const activeKey =
    tabs.find((tab) => pathname.includes(tab.href))?.key ?? 'dashboard';

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeKey === tab.key;

        return (
          <Button
            key={tab.key}
            type="button"
            size="sm"
            variant={active ? 'default' : 'ghost'}
            className={`h-9 rounded-md px-3 text-sm ${
              active
                ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => router.push(`/${locale}${tab.href}`)}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {t(tab.labelKey)}
          </Button>
        );
      })}
    </div>
  );
}
