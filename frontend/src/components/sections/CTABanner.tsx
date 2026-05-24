'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Phone, MapPin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function XiaohongshuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
}

export function CTABanner() {
  const t = useTranslations();

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-purple-800 to-primary/90 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container relative z-10 text-center">
        <h2 className="heading-xl mb-4 text-white">{t('home.cta.title')}</h2>
        <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl mx-auto">
          {t('home.cta.subtitle')}
        </p>
        <p className="text-body text-white/60 mb-10 max-w-xl mx-auto">
          {t('about.joinUs.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/classes/register">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 !px-8 text-base font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {t('home.cta.register')}
            </Button>
          </Link>
          <Link href="/about/contact">
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white bg-white text-primary hover:bg-white/90 hover:border-white !px-8 text-base font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {t('home.cta.contact')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-10">
          <a
            href="https://www.youtube.com/@mulandancestudio21"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <Youtube className="h-5 w-5" />
            <span className="text-sm">@mulandancestudio21</span>
          </a>
          <a
            href="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <XiaohongshuIcon />
            <span className="text-sm">小红书</span>
          </a>
        </div>
      </div>
    </section>
  );
}
