'use client';

import type { ReactNode } from 'react';
import AnimatedContent from '@/components/AnimatedContent';
import ScrollReveal from '@/components/ScrollReveal';
import { cn } from '@/lib/utils';

export function ExhibitReveal({
  children,
  className,
  delay = 0,
  from = 'bottom',
  distance = 32,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: 'bottom' | 'top' | 'left' | 'right';
  distance?: number;
}) {
  const horizontal = from === 'left' || from === 'right';
  const reverse = from === 'top' || from === 'left';

  return (
    <AnimatedContent
      className={cn(className)}
      direction={horizontal ? 'horizontal' : 'vertical'}
      reverse={reverse}
      distance={distance}
      duration={0.78}
      ease="power3.out"
      scale={0.985}
      threshold={0.2}
      delay={delay}
    >
      {children}
    </AnimatedContent>
  );
}

export function ExhibitHeading({
  children,
  className,
  align = 'left',
}: {
  children: string;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <ScrollReveal
      enableBlur
      baseOpacity={0.2}
      baseRotation={1.5}
      blurStrength={3}
      containerClassName={cn('exhibit-heading', align === 'center' && 'text-center', className)}
      textClassName="text-3xl font-semibold md:text-5xl"
      rotationEnd="bottom 72%"
      wordAnimationEnd="bottom 70%"
    >
      {children}
    </ScrollReveal>
  );
}
