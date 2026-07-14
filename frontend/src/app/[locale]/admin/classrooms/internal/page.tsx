'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** The legacy weekly internal-room form is retired in favour of unified scheduling. */
export default function InternalClassroomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh';

  useEffect(() => {
    router.replace(`/${locale}/admin/schedules`);
  }, [locale, router]);

  return <div className="min-h-screen bg-muted/30" />;
}
