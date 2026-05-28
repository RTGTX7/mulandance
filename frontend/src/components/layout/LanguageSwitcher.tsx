'use client';

import { useLocale } from '@/components/ui/i18n-client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = () => {
    const newLocale = locale === 'en' ? 'zh' : 'en';
    // Split pathname into segments, remove locale if present, add new locale
    const segments = pathname.split('/').filter(Boolean);
    const localeSegment = segments[0];
    
    let pathWithoutLocale: string;
    if (localeSegment === 'en' || localeSegment === 'zh') {
      pathWithoutLocale = '/' + segments.slice(1).join('/');
    } else {
      pathWithoutLocale = pathname;
    }
    
    // Ensure pathWithoutLocale doesn't have double locale
    const cleanPath = pathWithoutLocale.replace(/^\/(en|zh)/, '');
    router.push(`/${newLocale}${cleanPath || ''}`);
    router.refresh();
  };

  return (
    <button
      onClick={handleLocaleChange}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border/50"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === 'en' ? 'EN' : '中文'}</span>
    </button>
  );
}
