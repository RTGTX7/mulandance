'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Slide {
  title: string;
  subtitle: string;
  cta1: string;
  cta2: string;
  cta1Href: string;
  cta2Href: string;
  bgGradient: string;
}

const slides: Slide[] = [
  {
    title: 'Where Movement Becomes Art',
    subtitle: 'Nurturing dancers from first steps to professional stages since 1985',
    cta1: 'Explore Programs',
    cta2: 'Watch Our Story',
    cta1Href: '/programs/ballet',
    cta2Href: '#',
    bgGradient: 'from-primary/90 via-primary/70 to-primary/40',
  },
  {
    title: '2025/2026 Season',
    subtitle: 'Five productions, one unforgettable season. Get your tickets now.',
    cta1: 'Get Tickets',
    cta2: 'View Season',
    cta1Href: '/performances/tickets',
    cta2Href: '/performances/current-season',
    bgGradient: 'from-secondary/90 via-secondary/70 to-accent/40',
  },
  {
    title: 'Summer Camps 2026',
    subtitle: 'Two weeks of dance, fun, and creativity for ages 5-17',
    cta1: 'Register Now',
    cta2: 'Learn More',
    cta1Href: '/classes/register',
    cta2Href: '/programs/summer-camps',
    bgGradient: 'from-accent/90 via-accent/70 to-secondary/40',
  },
];

export function HeroCarousel() {
  const t = useTranslations();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section
      className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden"
      aria-label={t('common.sections.featuredPerformances')}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} transition-all duration-700`}
      />

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
            {t('common.appName')}
          </span>
          <h1 className="heading-xl text-white mb-4 leading-tight">
            {slide.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={slide.cta1Href}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 !px-8">
                {slide.cta1}
              </Button>
            </Link>
            <Link href={slide.cta2Href}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 !px-8"
              >
                <Play className="mr-2 h-4 w-4" />
                {slide.cta2}
              </Button>
            </Link>
          </div>
        </div>

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
      </div>
    </section>
  );
}
