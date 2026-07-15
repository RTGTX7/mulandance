'use client';

import { type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import AnimatedContent from '@/components/AnimatedContent';
import { cn } from '@/lib/utils';

export function HomepageReveal({ children, className = '', delay = 0, animation = 'fade_up' }: { children: ReactNode; className?: string; delay?: number; animation?: string }) {
  if (animation === 'none') return <div className={className}>{children}</div>;
  return <AnimatedContent className={className} distance={animation === 'soft_zoom' ? 10 : 24} duration={0.65} delay={delay} scale={animation === 'soft_zoom' ? 0.98 : 1}>{children}</AnimatedContent>;
}

export function SpotlightSurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  function move(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  }
  return <div onMouseMove={move} className={cn('homepage-spotlight', className)}>{children}</div>;
}

export function MasonrySurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('columns-1 gap-4 sm:columns-2 lg:columns-3', className)}>{children}</div>;
}

export function LogoLoopSurface({ children, reverse = false, speed = 'normal', className = '' }: { children: ReactNode; reverse?: boolean; speed?: string; className?: string }) {
  const duration = speed === 'slow' ? '42s' : speed === 'fast' ? '18s' : '28s';
  const style = { '--loop-duration': duration } as CSSProperties;
  return (
    <div className={cn('homepage-logo-loop overflow-hidden', className)} style={style}>
      <div className={cn('homepage-logo-loop-track flex w-max items-center gap-4 py-2', reverse && 'homepage-logo-loop-reverse')}>
        {children}
      </div>
    </div>
  );
}
