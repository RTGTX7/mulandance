'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, usersApi } from '@/lib/api';
import { ADMIN_ROUTE_PERMISSIONS, firstAllowedAdminRoute, hasPermission } from '@/lib/permissions';

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

        if (normalized.startsWith('/admin/profile')) {
          setAllowed(true);
          return;
        }
        const routePermission = ADMIN_ROUTE_PERMISSIONS.find((item) => normalized.startsWith(item.path));
        if (routePermission && !hasPermission(user, routePermission.permission)) {
          router.replace(`/${locale}${firstAllowedAdminRoute(user)}`);
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
