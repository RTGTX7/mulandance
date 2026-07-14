'use client';

import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

function useInViewOnce<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px', ...options }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, options]);

  return { ref, inView };
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function parseNumericText(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([^0-9]*)([0-9][0-9,]*)(.*)$/);
  if (!match) return null;

  return {
    prefix: match[1],
    target: Number(match[2].replace(/,/g, '')),
    suffix: match[3],
  };
}

export function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const parsed = useMemo(() => parseNumericText(value), [value]);
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const [current, setCurrent] = useState(parsed ? parsed.target : null);

  useEffect(() => {
    if (!parsed || !inView) return;

    setCurrent(0);

    let frame = 0;
    let start: number | null = null;
    const duration = 1100;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCurrent(Math.round(parsed.target * easeOutCubic(progress)));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, parsed]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {current?.toLocaleString() ?? 0}
      {parsed.suffix}
    </span>
  );
}

export function RevealOnScroll({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn('scroll-reveal', inView && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function AnimatedLineHeading({
  text,
  className,
  align = 'center',
}: {
  text: string;
  className?: string;
  align?: 'center' | 'left';
}) {
  const { ref, inView } = useInViewOnce<HTMLHeadingElement>({ threshold: 0.55 });
  const leftAligned = align === 'left';

  return (
    <h2
      ref={ref}
      className={cn('dance-line-heading', leftAligned && 'dance-line-heading-left', inView && 'is-visible', className)}
      aria-label={text}
    >
      <span>{text}</span>
    </h2>
  );
}
