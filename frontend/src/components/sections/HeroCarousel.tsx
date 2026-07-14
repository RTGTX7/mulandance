'use client';

import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { homepageApi, type HomepageHeroSlide } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

const fallbackMedia = ['/programs/chinese-dance.jpg', '/programs/ballet.jpg'];

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
    const mediaUrl = toPublicMediaUrl(slide.image_url || fallbackMedia[index % fallbackMedia.length]);
    const primaryHref = href(slide.primary?.href || '/programs');
    const secondaryHref = href(slide.secondary?.href || 'https://www.youtube.com/@mulandancestudio21');

    return (
      <article
        key={`${slide.title}-${index}`}
        className={`hero-slide relative h-full min-w-0 flex-[0_0_100%] overflow-hidden ${index === current ? 'hero-slide-active' : ''}`}
        aria-hidden={index !== current}
      >
        {isVideoUrl(mediaUrl) ? (
          <video
            key={mediaUrl}
            className="hero-media-drift absolute inset-0 h-full w-full object-cover"
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            className="hero-media-drift absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${mediaUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-[#160d1c]/60" />
        <div className={`absolute inset-0 opacity-20 ${slide.overlay || defaultSlides[0].overlay}`} />

        <div className="hero-slide-content relative z-10 flex h-full items-end">
          <div className="container w-full pb-24 pt-20 md:pb-28 md:pt-28">
            <div className="max-w-xl text-left text-white md:max-w-2xl">
              <Badge variant="outline" className="mb-5 w-fit border-white/45 bg-black/25 px-3 py-1 text-white shadow-none backdrop-blur-none">
                {slide.badge || t('common.appName')}
              </Badge>
              <h1 className="mb-4 font-heading text-4xl leading-tight text-white md:text-6xl">
                {slide.title}
              </h1>
              <p className="mb-7 max-w-xl text-base leading-7 text-white/90 md:mb-8 md:text-lg">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={primaryHref} target={primaryHref.startsWith('http') ? '_blank' : undefined}>
                  <Button size="lg" className="h-11 rounded-md bg-white text-primary shadow-none hover:bg-white/90 hover:shadow-none">
                    {slide.primary?.label || t('home.hero.slides.0.cta1')}
                  </Button>
                </Link>
                <Link href={secondaryHref} target={secondaryHref.startsWith('http') ? '_blank' : undefined}>
                  <Button size="lg" variant="outline" className="h-11 rounded-md border-white/70 bg-transparent text-white shadow-none hover:border-white hover:bg-white/10 hover:text-white hover:shadow-none">
                    <span className="inline-flex items-center gap-2">
                      {slide.secondary?.label || t('home.hero.slides.0.cta2')}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      className="hero-cinematic relative h-[min(520px,calc(100svh-4rem))] min-h-[410px] overflow-hidden md:h-[min(640px,calc(100svh-4rem))] md:min-h-[560px]"
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
        <div className="absolute inset-x-4 bottom-6 z-20 flex items-center justify-center gap-3 md:inset-x-8 md:bottom-8">
          <button
            onClick={prev}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/45 bg-black/20 text-white transition-colors hover:bg-white/15"
            aria-label={t('common.accessibility.previous')}
            title={t('common.accessibility.previous')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === current ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/85'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/45 bg-black/20 text-white transition-colors hover:bg-white/15"
            aria-label={t('common.accessibility.next')}
            title={t('common.accessibility.next')}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
