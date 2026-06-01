'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { homepageApi, type HomepageHeroSlide } from '@/lib/api';

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function HeroCarousel() {
  const t = useTranslations();
  const locale = useLocale();

  // Helper to add locale prefix to href
  const href = (path: string) => {
    if (!path) return `/${locale}`;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  const defaultSlides: HomepageHeroSlide[] = [
    {
      badge: t('common.appName'),
      title: t('home.hero.slides.0.title'),
      subtitle: t('home.hero.slides.0.subtitle'),
      primary: { label: t('home.hero.slides.0.cta1'), href: '/programs' },
      secondary: { label: t('home.hero.slides.0.cta2'), href: 'https://www.youtube.com/@mulandancestudio21' },
      image_url: '',
      overlay: 'from-primary/90 via-primary/70 to-primary/40',
      is_active: true,
    },
    {
      badge: t('common.appName'),
      title: t('home.hero.slides.1.title'),
      subtitle: t('home.hero.slides.1.subtitle'),
      primary: { label: t('home.hero.slides.1.cta1'), href: '/performances' },
      secondary: { label: t('home.hero.slides.1.cta2'), href: 'https://www.youtube.com/@mulandancestudio21' },
      image_url: '',
      overlay: 'from-primary/95 via-primary/80 to-purple-900/60',
      is_active: true,
    },
    {
      badge: t('common.appName'),
      title: t('home.hero.slides.2.title'),
      subtitle: t('home.hero.slides.2.subtitle'),
      primary: { label: t('home.hero.slides.2.cta1'), href: '/classes/register' },
      secondary: { label: t('home.hero.slides.2.cta2'), href: '/programs/summer-camps' },
      image_url: '',
      overlay: 'from-violet-800 via-purple-800 to-primary/80',
      is_active: true,
    },
  ];

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customSlides, setCustomSlides] = useState<HomepageHeroSlide[] | null>(null);

  const slides = (customSlides?.filter((item) => item.is_active) || defaultSlides).filter(
    (item) => item.title || item.subtitle
  );

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo, slides.length]);

  useEffect(() => {
    homepageApi
      .get(locale)
      .then((settings) => {
        const activeSlides = settings.hero_slides.filter((item) => item.is_active);
        if (activeSlides.length > 0) setCustomSlides(activeSlides);
      })
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  const slide = slides[current] || defaultSlides[0];
  const primaryHref = href(slide.primary?.href || '/programs');
  const secondaryHref = href(slide.secondary?.href || 'https://www.youtube.com/@mulandancestudio21');

  return (
    <section
      className="relative h-[62svh] min-h-[410px] max-h-[540px] overflow-hidden md:h-[70vh] md:min-h-[560px] md:max-h-[800px]"
      aria-label={t('common.sections.featuredPerformances')}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.overlay || defaultSlides[0].overlay} transition-all duration-700`}
      />
      {slide.image_url && (
        isVideoUrl(slide.image_url) ? (
          <video
            key={slide.image_url}
            className="absolute inset-0 h-full w-full object-cover opacity-45 transition-opacity duration-700"
            src={slide.image_url}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45 transition-all duration-700"
            style={{ backgroundImage: `url(${slide.image_url})` }}
          />
        )
      )}

      <div className="relative h-full container flex flex-col justify-center items-center px-4 pb-14 pt-4 text-center text-white md:pb-20 md:pt-6">
        <div
          className={`max-w-3xl transition-all duration-500 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="mb-3 inline-block rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal backdrop-blur-sm md:mb-6 md:text-xs">
            {slide.badge || t('common.appName')}
          </span>
          <h1 className="heading-xl mb-3 text-white md:mb-4">
            {slide.title}
          </h1>
          <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/80 md:mb-8 md:text-xl">
            {slide.subtitle}
          </p>
          <div className="mx-auto flex w-full max-w-sm justify-center gap-2 sm:max-w-none md:gap-4">
            <Link href={primaryHref} target={primaryHref.startsWith('http') ? '_blank' : undefined} className="min-w-0 flex-1 sm:flex-none">
              <Button 
                size="lg" 
                className="w-full px-3 bg-white text-primary transition-all duration-300 hover:bg-white/90 hover:shadow-xl sm:w-auto"
              >
                {slide.primary?.label || t('home.hero.slides.0.cta1')}
              </Button>
            </Link>
            <Link href={secondaryHref} target={secondaryHref.startsWith('http') ? '_blank' : undefined} className="min-w-0 flex-1 sm:flex-none">
              <Button
                size="lg"
                className="w-full px-3 bg-white/90 font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-white hover:shadow-2xl sm:w-auto"
              >
                <Play className="mr-1.5 h-4 w-4" />
                {slide.secondary?.label || t('home.hero.slides.0.cta2')}
              </Button>
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2 md:bottom-8 md:gap-3">
          <button
            onClick={prev}
            className="rounded-lg bg-white/10 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:p-2"
            aria-label={t('common.accessibility.previous')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 md:h-2 ${
                  index === current ? 'w-7 bg-white md:w-8' : 'w-1.5 bg-white/40 hover:bg-white/60 md:w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="rounded-lg bg-white/10 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:p-2"
            aria-label={t('common.accessibility.next')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        )}
      </div>
    </section>
  );
}
