'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useLocale } from '@/components/ui/i18n-client';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const locale = useLocale();

  // Helper to add locale prefix to href if not already present
  const getHref = (path: string) => {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) {
      const withoutLeadingSlash = path.substring(1);
      return `/${locale}${withoutLeadingSlash}`;
    }
    return `/${locale}/${path}`;
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-3 md:mb-5">
      <ol className="flex items-center justify-center gap-1.5 text-xs text-white/70 md:text-sm">
        <li>
          <Link
            href={getHref('/')}
            className="hover:text-white transition-colors"
          >
            <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li
            key={item.href}
            className="flex items-center gap-1.5"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {index === items.length - 1 ? (
              <span className="text-white/80 font-medium">{item.label}</span>
            ) : (
              <Link
                href={getHref(item.href)}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
