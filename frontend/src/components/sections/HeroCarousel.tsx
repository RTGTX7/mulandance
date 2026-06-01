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
      className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden"
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

      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(201,169,110,0.2),transparent_40%)]" />
      </div>

      <div className="relative h-full container flex flex-col justify-center items-center text-center text-white px-4">
        <div
          className={`max-w-3xl transition-all duration-500 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/20 backdrop-blur-sm">
            {slide.badge || t('common.appName')}
          </span>
          <h1 className="heading-xl text-white mb-4 leading-tight">
            {slide.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={primaryHref} target={primaryHref.startsWith('http') ? '_blank' : undefined}>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 !px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {slide.primary?.label || t('home.hero.slides.0.cta1')}
              </Button>
            </Link>
            <Link href={secondaryHref} target={secondaryHref.startsWith('http') ? '_blank' : undefined}>
              <Button
                size="lg"
                className="bg-white/95 text-primary hover:bg-white !px-8 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <Play className="mr-2 h-4 w-4" />
                {slide.secondary?.label || t('home.hero.slides.0.cta2')}
              </Button>
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3">
          <button
            onClick={prev}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
            aria-label={t('common.accessibility.previous')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
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
