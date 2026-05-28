import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocaleProvider, type TranslationMessages } from '@/components/ui/i18n-client';
import { SUPPORTED_LOCALES, convertMessagesToTraditional, isTraditionalLocale, normalizeLocale } from '@/lib/i18n';
import '../globals.css';
import en from '../../lib/locales/en.json';
import zh from '../../lib/locales/zh.json';
import fr from '../../lib/locales/fr.json';

const locales = SUPPORTED_LOCALES;
const messagesByLocale: Record<string, TranslationMessages> = {
  en,
  zh,
  'zh-Hant': convertMessagesToTraditional(zh),
  fr,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const normalizedLocale = normalizeLocale(locale);
  const zhTitle = isTraditionalLocale(normalizedLocale) ? '木蘭舞蹈學校 — 舞動藝術' : '木兰舞蹈学校 — 舞动艺术';
  const zhDescription = isTraditionalLocale(normalizedLocale)
    ? '渥太華中文舞蹈學校，提供中國舞、芭蕾、現代舞課程'
    : '渥太华中文舞蹈学校，提供中国舞、芭蕾、现代舞课程';

  return {
    title: normalizedLocale === 'zh' || normalizedLocale === 'zh-Hant' ? zhTitle : 'Mulan Dance Studio — Dance Arts',
    description: normalizedLocale === 'zh' || normalizedLocale === 'zh-Hant' ? zhDescription : 'Ottawa Chinese Dance Studio — Chinese Dance, Ballet, Contemporary for all ages.',
    alternates: {
      canonical: `/${normalizedLocale}`,
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
  const normalizedLocale = normalizeLocale(locale);
  const messages = messagesByLocale[normalizedLocale] || en;

  return (
    <div className="flex min-h-screen flex-col">
      <LocaleProvider key={normalizedLocale} locale={normalizedLocale} messages={messages}>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </LocaleProvider>
    </div>
  );
}
