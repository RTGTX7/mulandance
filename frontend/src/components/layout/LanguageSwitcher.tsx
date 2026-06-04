'use client';

import { useLocale } from '@/components/ui/i18n-client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, stripLocaleFromPathname } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const cleanPath = stripLocaleFromPathname(pathname);
    const query = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`/${newLocale}${cleanPath === '/' ? '' : cleanPath}${query}`);
    router.refresh();
  };

  const active = LANGUAGE_OPTIONS.find((item) => item.code === locale) || LANGUAGE_OPTIONS[0];

  return (
    <label
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border/50 bg-white/45 px-2 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:text-foreground',
        compact && 'h-9 gap-1 px-2 py-1 text-xs'
      )}
    >
      <Languages className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
      <span className="sr-only">Language</span>
      <select
        value={active.code}
        onChange={(event) => handleLocaleChange(event.target.value)}
        className={cn('bg-transparent text-sm font-medium outline-none', compact && 'max-w-[54px] text-xs')}
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
