'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from './i18n-client';

interface BackButtonProps {
  /** Optional explicit fallback route when browser history is unavailable.
   * Defaults to /[locale]/admin/dashboard. */
  fallbackRoute?: string;
  /** Override the default label. When empty, uses i18n. */
  label?: string;
  /** CSS className for customization. */
  className?: string;
}

/**
 * A reusable "Back" button for admin sub-pages.
 *
 * Behavior:
 * - Uses `router.back()` (browser history) when there is usable history.
 * - Falls back to `fallbackRoute` when `router.back()` would not navigate.
 *   - The fallbackRoute is resolved relative to the current locale.
 *   - Defaults to `/[locale]/admin/dashboard`.
 *
 * Usage:
 * - Show on sub-pages: article editor, category editor, tag editor, etc.
 * - Do NOT show on main list pages (dashboard, articles list, categories list, tags list).
 */
export function BackButton({ fallbackRoute, label, className }: BackButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const locale = pathname.split('/')[1] || 'en';

  const defaultFallback = `/${locale}/admin/dashboard`;
  const resolvedFallback = fallbackRoute || defaultFallback;

  const handleClick = () => {
    // Attempt browser back first
    router.back();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`text-muted-foreground hover:text-foreground hover:bg-muted/80 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      {label || t('admin.common.back')}
    </Button>
  );
}