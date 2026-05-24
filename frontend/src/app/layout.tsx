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
    default: 'Grace Dance Academy — Where Movement Becomes Art',
    template: '%s | Grace Dance Academy',
  },
  description:
    'Nurturing dancers from first steps to professional stages since 1985. Offering ballet, contemporary, Chinese dance, jazz, and hip-hop programs for all ages.',
  keywords: [
    'dance academy',
    'ballet',
    'contemporary dance',
    'Chinese dance',
    'jazz dance',
    'hip-hop',
    'dance classes',
    'dance school',
    'RAD examinations',
  ],
  authors: [{ name: 'Grace Dance Academy' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Grace Dance Academy',
    title: 'Grace Dance Academy — Where Movement Becomes Art',
    description:
      'Nurturing dancers from first steps to professional stages since 1985.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grace Dance Academy',
    description: 'Where Movement Becomes Art',
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
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
