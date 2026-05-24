'use client';

import { useLocale } from '@/components/ui/i18n-client';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const locales = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    router.push(`/${newLocale}`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{locale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleLocaleChange(loc.code)}
            className={locale === loc.code ? 'bg-accent' : ''}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
