'use client';

import { useLocale } from '@/components/ui/i18n-client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, stripLocaleFromPathname } from '@/lib/i18n';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const cleanPath = stripLocaleFromPathname(pathname);
    router.push(`/${newLocale}${cleanPath === '/' ? '' : cleanPath}`);
    router.refresh();
  };

  const active = LANGUAGE_OPTIONS.find((item) => item.code === locale) || LANGUAGE_OPTIONS[0];

  return (
    <label className="flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      <Languages className="h-4 w-4" />
      <span className="sr-only">Language</span>
      <select
        value={active.code}
        onChange={(event) => handleLocaleChange(event.target.value)}
        className="bg-transparent text-sm font-medium outline-none"
        aria-label="Language"
      >
        {LANGUAGE_OPTIONS.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
