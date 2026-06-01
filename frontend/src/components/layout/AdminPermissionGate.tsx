'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, usersApi } from '@/lib/api';

const SUPER_ADMIN_ONLY = [
  '/admin/accounts',
  '/admin/settings',
  '/admin/registrations',
  '/admin/pricing',
];

export function AdminPermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';
  const normalized = useMemo(() => pathname.replace(`/${locale}`, ''), [pathname, locale]);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(false);

    if (normalized.startsWith('/admin/login')) {
      setAllowed(true);
      return;
    }

    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    usersApi.me()
      .then((user) => {
        if (user.role !== 'super_admin' && user.role !== 'admin') {
          router.push(`/${locale}/admin/login`);
          return;
        }

        const needsSuperAdmin = SUPER_ADMIN_ONLY.some((path) => normalized.startsWith(path));
        if (needsSuperAdmin && user.role !== 'super_admin') {
          router.push(`/${locale}/admin/dashboard`);
          return;
        }

        setAllowed(true);
      })
      .catch(() => router.push(`/${locale}/admin/login`));
  }, [normalized, router, locale]);

  if (!allowed) {
    return <div className="min-h-screen bg-muted/30" />;
  }

  return <>{children}</>;
}
