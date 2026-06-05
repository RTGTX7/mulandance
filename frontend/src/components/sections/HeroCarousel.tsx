'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Play } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { homepageApi, type HomepageHeroSlide } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function HeroCarousel() {
  const t = useTranslations();
  const locale = useLocale();
  const touchStartX = useRef<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

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
  const [customSlides, setCustomSlides] = useState<HomepageHeroSlide[] | null>(null);

  const slides = (customSlides?.filter((item) => item.is_active) || defaultSlides).filter(
    (item) => item.title || item.subtitle
  );

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setCurrent((index + slides.length) % slides.length);
      setTouchDeltaX(0);
    },
    [slides.length]
  );

  const next = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo(current - 1);
  }, [current, goTo]);

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
    if (slides.length <= 1 || touchDeltaX !== 0) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length, touchDeltaX]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (slides.length <= 1) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setTouchDeltaX(0);
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (touchStartX.current == null) return;
    const nextDelta = (event.touches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    setTouchDeltaX(Math.max(-90, Math.min(90, nextDelta)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX) > 42) {
      if (touchDeltaX < 0) next();
      else prev();
    } else {
      setTouchDeltaX(0);
    }
    touchStartX.current = null;
  };

  const renderSlide = (slide: HomepageHeroSlide, index: number) => {
    const mediaUrl = toPublicMediaUrl(slide.image_url || '');
    const primaryHref = href(slide.primary?.href || '/programs');
    const secondaryHref = href(slide.secondary?.href || 'https://www.youtube.com/@mulandancestudio21');

    return (
      <article
        key={`${slide.title}-${index}`}
        className="relative h-full min-w-0 flex-[0_0_100%] overflow-hidden"
        aria-hidden={index !== current}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.overlay || defaultSlides[0].overlay}`} />
        {mediaUrl && (
          isVideoUrl(mediaUrl) ? (
            <video
              key={mediaUrl}
              className="hero-media-drift absolute inset-0 h-full w-full object-cover opacity-48"
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div
              className="hero-media-drift absolute inset-0 bg-cover bg-center opacity-48"
              style={{ backgroundImage: `url(${mediaUrl})` }}
            />
          )
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.20),transparent_34%),linear-gradient(to_top,rgba(15,23,42,0.42),rgba(15,23,42,0.14)_46%,rgba(15,23,42,0.34))]" />
        <div className="hero-stage-beams absolute inset-0 opacity-80" aria-hidden="true" />
        <div className="hero-film-grain absolute inset-0 opacity-[0.13]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/18 via-black/5 to-transparent md:h-48" />

        <div className="relative z-10 flex h-full items-center justify-center px-4 pb-24 pt-10 text-center text-white md:px-6 md:pb-20 md:pt-6">
          <div className="hero-copy-glass w-full max-w-3xl rounded-2xl bg-white/[0.01] px-5 py-6 shadow-[0_22px_72px_rgba(20,8,45,0.1)] backdrop-blur-lg md:rounded-3xl md:px-10 md:py-8">
            <span className="hero-kicker mb-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-semibold tracking-normal backdrop-blur-lg md:mb-6 md:rounded-lg md:px-3 md:py-1.5 md:text-xs">
              {slide.badge || t('common.appName')}
            </span>
            <h1 className="hero-draw-title heading-xl mx-auto mb-4 max-w-[12ch] text-balance text-white md:mb-4 md:max-w-none">
              {slide.title}
            </h1>
            <p className="hero-copy mx-auto mb-7 max-w-[22rem] text-[15px] leading-relaxed text-white/[0.84] md:mb-8 md:max-w-2xl md:text-xl">
              {slide.subtitle}
            </p>
            <div className="mx-auto grid w-full max-w-[22rem] grid-cols-2 items-center gap-3 md:max-w-[24rem]">
              <Link href={primaryHref} target={primaryHref.startsWith('http') ? '_blank' : undefined} className="min-w-0">
                <Button
                  size="lg"
                  className="hero-button hero-button-primary h-11 w-full rounded-xl px-3 text-sm font-semibold shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl md:h-11"
                >
                  {slide.primary?.label || t('home.hero.slides.0.cta1')}
                </Button>
              </Link>
              <Link href={secondaryHref} target={secondaryHref.startsWith('http') ? '_blank' : undefined} className="min-w-0">
                <Button
                  size="lg"
                  className="hero-button hero-button-secondary h-11 w-full rounded-xl px-3 text-sm font-semibold shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl md:h-11"
                >
                  <span className="inline-flex min-w-0 items-center justify-center gap-1.5">
                    <Play className="h-4 w-4 shrink-0" />
                    <span className="truncate">{slide.secondary?.label || t('home.hero.slides.0.cta2')}</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      className="hero-cinematic relative h-[62svh] min-h-[410px] max-h-[560px] overflow-hidden md:h-[70vh] md:min-h-[560px] md:max-h-[800px]"
      aria-label={t('common.sections.featuredPerformances')}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full will-change-transform"
        style={{
          transform: `translate3d(calc(${-current * 100}% + ${touchDeltaX}px), 0, 0)`,
          transition: touchDeltaX === 0 ? 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        {(slides.length > 0 ? slides : defaultSlides).map(renderSlide)}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-full border border-white/12 bg-black/14 px-2.5 py-1.5 shadow-lg shadow-black/10 backdrop-blur-md md:bottom-8 md:gap-3 md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none">
          <button
            onClick={prev}
            className="hidden rounded-lg border border-white/12 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
            aria-label={t('common.accessibility.previous')}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div className="flex items-center gap-1.5 md:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 md:h-2 ${
                  index === current ? 'w-5 bg-white md:w-8' : 'w-1.5 bg-white/45 hover:bg-white/60 md:w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="hidden rounded-lg border border-white/12 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
            aria-label={t('common.accessibility.next')}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </section>
  );
}
