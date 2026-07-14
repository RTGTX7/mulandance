'use client';

import { useLocale, useTranslations } from '@/components/ui/i18n-client';
import { Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { homepageApi, type HomepageCta } from '@/lib/api';
import { ExhibitHeading, ExhibitReveal } from '@/components/motion/ExhibitMotion';

function XiaohongshuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 50 50" fill="currentColor">
      <path d="M40.45,21.95s0-.09,0-.14c0-.02,0-.05,0-.07,0-.09-.01-.18-.02-.26-.15-.16-.33-.23-.53-.26-.04,0-.08-.01-.12-.01-.1,0-.21,0-.32,0,0,0,0,0,0,0-.15,0-.3.02-.45.03-.09,0-.17,0-.26,0-.04,0-.08,0-.12,0-.04,0-.08,0-.12-.01,0,.84,0,1.69.02,2.53h1.94c0-.61.03-1.21,0-1.81ZM25,0C11.2,0,0,11.2,0,25s11.2,25,25,25,25-11.2,25-25S38.8,0,25,0ZM44.33,18.59c.73-.6,1.93-.21,2.2.68.35.81-.3,1.82-1.17,1.9-.54.05-1.08.02-1.62.02.04-.87-.23-1.99.58-2.6ZM4.86,31.47c-.52-1.1-1-2.21-1.49-3.32.15-.4.24-.83.27-1.26.13-1.88.28-3.78.43-5.67.95,0,1.9.01,2.84-.02-.06,1.62-.24,3.24-.34,4.86-.12,1.9-.55,3.86-1.71,5.42ZM10.79,32.34c-.8.62-1.87.42-2.81.45-.37-.8-.73-1.61-1.07-2.44.5,0,1,.01,1.49-.02.24.01.44-.18.45-.42,0-.04,0-.08-.01-.12.02-4.13,0-8.26.03-12.38h2.83c.03,4.19.02,8.39.02,12.58.01.86-.21,1.81-.94,2.35ZM14.05,26.49c-.15-1.75-.27-3.52-.41-5.28h2.87c.15,1.89.29,3.77.43,5.66.03.44.12.87.27,1.28-.49,1.11-.98,2.22-1.49,3.32-1.08-1.43-1.53-3.23-1.68-4.98ZM21.74,32.79c-1.51-.08-3.07.22-4.54-.22.44-.97.88-1.93,1.33-2.9,1.48.38,3.02.16,4.53.22-.43.97-.87,1.93-1.32,2.89ZM19.84,28.76c-.61,0-1.16-.62-.94-1.23.4-1.23,1.03-2.37,1.5-3.57-.69-.05-1.51.15-2.06-.36-.44-.43-.18-1.07.02-1.55.73-1.61,1.46-3.22,2.16-4.83.97-.01,1.94,0,2.91,0-.51,1.29-1.22,2.51-1.62,3.84.81.34,1.82.06,2.7.16-.72,1.69-1.53,3.35-2.22,5.07.62.13,1.28.08,1.92.08-.35.81-.71,1.61-1.07,2.41-1.1-.02-2.2.05-3.3-.03ZM32.92,32.79h-9.64c.43-.96.87-1.93,1.32-2.89.86,0,1.73,0,2.59-.01v-8.67h-1.8c0-.97-.01-1.93,0-2.9h6.59v2.89h-1.81v8.67c.92.01,1.85,0,2.77.01v2.89ZM41.98,32.81c-.4-.81-.74-1.65-1.1-2.48.8-.02,1.6.03,2.4-.03.26-.02.46-.24.44-.5.04-.77.04-1.53,0-2.3.01-.54-.55-.89-1.04-.84-1.4-.02-2.8,0-4.2,0v6.14h-2.88v-6.14h-2.87v-2.89c.96,0,1.91,0,2.87-.01.02-.83.02-1.67,0-2.51-.64-.01-1.27-.02-1.91-.01v-2.89h1.91l.02-1.1h2.87v1.08c1.38-.05,2.98-.05,3.98,1.07,1.07,1.18.72,2.89.78,4.33,1.04.02,2.2.26,2.84,1.16.75,1.06.46,2.44.52,3.65-.04,1.16.25,2.55-.71,3.44-1,1.09-2.62.75-3.93.83Z"/>
    </svg>
  );
}

export function CTABanner() {
  const t = useTranslations();
  const locale = useLocale();
  const [customCta, setCustomCta] = useState<HomepageCta | null>(null);

  useEffect(() => {
    homepageApi
      .get(locale)
      .then((settings) => setCustomCta(settings.cta))
      .catch(() => {});
  }, [locale]);

  const localHref = (path: string) => {
    if (!path) return `/${locale}`;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  const title = customCta?.title || t('home.cta.title');
  const subtitle = customCta?.subtitle || t('home.cta.subtitle');
  const subtitleParts = subtitle.split('|').map((part) => part.trim()).filter(Boolean);
  const note = customCta?.note || t('about.joinUs.subtitle');
  const primaryHref = localHref(customCta?.primary?.href || '/classes/register');
  const secondaryHref = localHref(customCta?.secondary?.href || '/about/contact');

  return (
    <section className="exhibit-cta relative overflow-hidden bg-[#251326] py-12 text-white md:py-20">
      <div className="container relative z-10 text-center">
        <ExhibitReveal distance={26}>
          <ExhibitHeading align="center" className="mx-auto mb-3">{title}</ExhibitHeading>
        </ExhibitReveal>
        <ExhibitReveal delay={0.1} distance={22}>
        <p className="mx-auto mb-3 flex max-w-2xl flex-col items-center gap-0.5 text-sm font-semibold leading-snug text-white/85 sm:flex-row sm:justify-center sm:gap-2 md:mb-5 md:text-lg">
          {subtitleParts.length > 1 ? (
            subtitleParts.map((part, index) => (
              <span key={part} className="inline-flex items-center gap-2">
                {index > 0 && <span className="hidden text-white/45 sm:inline">|</span>}
                <span>{part}</span>
              </span>
            ))
          ) : (
            subtitle
          )}
        </p>
        <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-white/72 md:mb-8 md:text-base">
          {note}
        </p>
        </ExhibitReveal>

        <ExhibitReveal delay={0.18} distance={20}>
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2 md:flex md:max-w-none md:justify-center md:gap-3">
          <Link href={primaryHref} target={primaryHref.startsWith('http') ? '_blank' : undefined}>
            <Button 
              size="lg"
              className="h-11 w-full rounded-lg bg-white px-3 text-sm font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-white/90 hover:shadow-xl md:w-auto md:px-6"
            >
              {customCta?.primary?.label || t('home.cta.register')}
            </Button>
          </Link>
          <Link href={secondaryHref} target={secondaryHref.startsWith('http') ? '_blank' : undefined}>
            <Button 
              size="lg" 
              variant="outline"
              className="h-11 w-full rounded-lg border border-white/70 bg-transparent px-3 text-sm font-semibold text-white shadow-none transition-all duration-300 hover:border-white hover:bg-white/10 hover:text-white md:w-auto md:px-6"
            >
              {customCta?.secondary?.label || t('home.cta.contact')}
            </Button>
          </Link>
        </div>
        </ExhibitReveal>

        <ExhibitReveal delay={0.24} distance={18}>
        <div className="mt-4 flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-5 md:mt-8">
          <a
            href="https://www.youtube.com/@mulandancestudio21"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/72 transition-colors hover:text-white"
          >
            <Youtube className="h-4 w-4" />
            <span>@mulandancestudio21</span>
          </a>
          <a
            href="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/72 transition-colors hover:text-white"
          >
            <XiaohongshuIcon />
            <span>Mulan Dance Studio</span>
          </a>
        </div>
        </ExhibitReveal>
      </div>
    </section>
  );
}
