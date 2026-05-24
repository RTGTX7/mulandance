import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocaleProvider } from '@/components/ui/i18n-client';
import { cn } from '@/lib/utils';
import '../globals.css';
import en from '../../lib/locales/en.json';
import zh from '../../lib/locales/zh.json';

const locales = ['en', 'zh'] as const;
const messagesByLocale: Record<string, typeof en> = { en, zh };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: locale === 'zh' ? '优雅舞蹈学院' : 'Grace Dance Academy',
    description: 'Nurturing dancers from first steps to professional stages since 1985.',
    alternates: {
      canonical: `/${locale}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = messagesByLocale[locale] || en;

  return (
    <div className="flex min-h-screen flex-col">
      <LocaleProvider locale={locale} messages={messages}>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </LocaleProvider>
    </div>
  );
}
