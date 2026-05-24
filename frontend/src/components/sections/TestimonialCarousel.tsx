'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  affiliation: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    quote:
      'Grace Dance Academy transformed my daughter\'s confidence. The faculty is world-class and the community feels like family.',
    affiliation: 'Parent, RAD Level 5 Student',
    image: '',
  },
  {
    id: '2',
    name: 'James Park',
    quote:
      'The contemporary program pushed me to discover movement I never knew I was capable of. The training here is truly exceptional.',
    affiliation: 'Pre-Professional Program, Class of 2024',
    image: '',
  },
  {
    id: '3',
    name: 'Li Mei',
    quote:
      'Learning Chinese dance at Grace Academy connected me to my cultural heritage in the most beautiful way. Every class is a celebration.',
    affiliation: 'Chinese Dance, Advanced Level',
    image: '',
  },
  {
    id: '4',
    name: 'Emma Rodriguez',
    quote:
      'As an adult beginner, I was nervous about starting dance. The supportive environment and patient instructors made all the difference.',
    affiliation: 'Adult Beginner Ballet',
    image: '',
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
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>

            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-14 w-14 border-2 border-secondary/30">
                <AvatarImage src={testimonial.image} />
                <AvatarFallback className="bg-secondary/10 text-secondary">
                  {testimonial.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.affiliation}</p>
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
          <Link href="/media/testimonials">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.testimonials.viewAll')} &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
