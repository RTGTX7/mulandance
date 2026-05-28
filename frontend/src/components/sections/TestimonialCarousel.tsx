'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const testimonials = [
  {
    id: '1',
    nameKey: 'testimonials.tangtang',
    quoteKey: 'testimonials.tangtangQuote',
    affiliationKey: 'testimonials.tangtangAff',
  },
  {
    id: '2',
    nameKey: 'testimonials.gege',
    quoteKey: 'testimonials.gegeQuote',
    affiliationKey: 'testimonials.gegeAff',
  },
  {
    id: '3',
    nameKey: 'testimonials.tangtang2',
    quoteKey: 'testimonials.tangtang2Quote',
    affiliationKey: 'testimonials.tangtang2Aff',
  },
  {
    id: '4',
    nameKey: 'testimonials.gege2',
    quoteKey: 'testimonials.gege2Quote',
    affiliationKey: 'testimonials.gege2Aff',
  },
];

export function TestimonialCarousel() {
  const t = useTranslations();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const testimonial = testimonials[current];

  return (
    <section className="section-padding bg-card">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="heading-lg mb-2">{t('home.testimonials.title')}</h2>
          <p className="text-lead">{t('home.testimonials.subtitle')}</p>
        </div>

        <div className="relative">
          <Quote className="absolute -top-2 left-0 h-12 w-12 text-secondary/20" />

          <div className="text-center py-8 px-4">
            <blockquote className="text-lg md:text-xl font-accent leading-relaxed text-foreground mb-8 max-w-2xl mx-auto">
              &ldquo;{t(testimonial.quoteKey)}&rdquo;
            </blockquote>

            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-14 w-14 border-2 border-secondary/30">
                <AvatarFallback className="bg-secondary/10 text-secondary">
                  {t(testimonial.nameKey)
                    .split('')
                    .slice(0, 2)
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-foreground">{t(testimonial.nameKey)}</p>
                <p className="text-sm text-muted-foreground">{t(testimonial.affiliationKey)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              aria-label={t('common.accessibility.previous')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current ? 'w-8 bg-secondary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              aria-label={t('common.accessibility.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/about/contact">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
