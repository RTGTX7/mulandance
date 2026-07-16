'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function LocaleChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = /\/(?:en|zh|zh-Hant|fr)\/admin(?:\/|$)/.test(pathname);

  if (isAdmin) {
    return <main id="main-content" className="min-h-screen bg-[#f7f5f8]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="page-enter flex-1">{children}</main>
      <Footer />
    </div>
  );
}
