import type { Metadata } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const fontHeading = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const fontBody = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const fontAccent = Cormorant_Garamond({
  variable: '--font-accent',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: '木兰舞蹈学校 Mulan Dance Studio - 舞动艺术',
    template: '%s | 木兰舞蹈学校 Mulan Dance Studio',
  },
  description:
    '渥太华中文舞蹈学校，提供中国舞、芭蕾、现代舞、爵士舞、街舞课程。适合所有年龄段的舞者。Mulan Dance Studio in Ottawa - Chinese Dance, Ballet, Contemporary, Jazz, Hip-Hop for all ages.',
  keywords: [
    '木兰舞蹈',
    'Mulan Dance',
    '渥太华舞蹈',
    'Ottawa dance',
    'Chinese dance',
    'ballet',
    'contemporary dance',
    'jazz dance',
    'hip-hop',
    '舞蹈学校',
    'dance school',
    '中文舞蹈',
  ],
  authors: [{ name: '木兰舞蹈学校 Mulan Dance Studio' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '木兰舞蹈学校 Mulan Dance Studio',
    title: '木兰舞蹈学校 Mulan Dance Studio - 舞动艺术',
    description: '渥太华中文舞蹈学校，传承中国文化，培养舞者从第一步到舞台。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '木兰舞蹈学校 Mulan Dance Studio',
    description: '舞动艺术',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background antialiased',
          fontHeading.variable,
          fontBody.variable,
          fontAccent.variable
        )}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
