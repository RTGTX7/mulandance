'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award, CalendarDays, ExternalLink, Pause, Play, Quote, Users } from 'lucide-react';
import { ProgramGrid } from '@/components/sections/ProgramGrid';
import { EventCards } from '@/components/sections/EventCards';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { AnimatedNumber } from '@/components/motion/ScrollEffects';
import { Button } from '@/components/ui/button';
import type { HomepageDocumentV2, HomepageSection, HomepageV2Block, HomepageV2Item } from '@/lib/api';
import { homepageHref, localizedHomepageContent } from '@/lib/homepage-v2';
import { toPublicMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { HomepageReveal, LogoLoopSurface, MasonrySurface, SpotlightSurface } from './HomepagePrimitives';

const FALLBACK_HERO = ['/programs/chinese-dance.jpg', '/programs/ballet.jpg'];
const statisticIcons = [Users, CalendarDays, Award, Quote];

function isVideo(url: string) { return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url); }
function ratioClass(ratio: HomepageV2Block['design']['media_ratio']) { return ratio === 'square' ? 'aspect-square' : ratio === 'portrait' ? 'aspect-[3/4]' : ratio === 'cinematic' ? 'aspect-video' : ratio === 'auto' ? '' : 'aspect-[4/3]'; }
function contentFor(block: HomepageV2Block, locale: string) { return localizedHomepageContent(block.content, locale); }
function itemContent(item: HomepageV2Item, locale: string) { return localizedHomepageContent(item.content, locale); }
function external(href: string) { return /^(https?:)?\/\//i.test(href); }

function SafeLink({ href, locale, sponsored = false, newTab = false, children, className = '' }: { href: string; locale: string; sponsored?: boolean; newTab?: boolean; children: React.ReactNode; className?: string }) {
  const resolved = homepageHref(href, locale);
  if (!resolved) return <>{children}</>;
  const openNew = newTab || external(resolved);
  return <Link href={resolved} className={className} target={openNew ? '_blank' : undefined} rel={openNew ? `${sponsored ? 'sponsored ' : ''}noopener noreferrer` : undefined}>{children}</Link>;
}

function BlockHeading({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale);
  if (!content.title && !content.subtitle && !content.eyebrow) return null;
  return (
    <HomepageReveal className={cn('mb-8 md:mb-12', block.design.alignment === 'center' && 'text-center', block.design.alignment === 'right' && 'text-right')} animation={block.behavior.animation}>
      {content.eyebrow && <p className="mb-2 text-xs font-semibold uppercase text-primary">{content.eyebrow}</p>}
      {content.title && <h2 className="font-heading text-3xl font-semibold leading-tight md:text-5xl">{content.title}</h2>}
      {content.subtitle && <p className={cn('mt-3 max-w-2xl text-sm leading-7 opacity-70 md:text-base', block.design.alignment === 'center' && 'mx-auto', block.design.alignment === 'right' && 'ml-auto')}>{content.subtitle}</p>}
    </HomepageReveal>
  );
}

function HeroCarouselBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const slides = block.items.filter((item) => item.is_enabled);
  const [current, setCurrent] = useState(0);
  useEffect(() => { if (current >= slides.length) setCurrent(0); }, [current, slides.length]);
  if (!slides.length) return null;
  const slide = slides[current] || slides[0];
  const content = itemContent(slide, locale);
  const media = toPublicMediaUrl(slide.media_url || FALLBACK_HERO[current % FALLBACK_HERO.length]);
  const secondaryHref = String(slide.meta.secondary_href || '');
  return (
    <section className="relative min-h-[440px] overflow-hidden bg-[#241328] text-white md:min-h-[620px]">
      {isVideo(media) || slide.media_type === 'video' ? <video key={media} poster={toPublicMediaUrl(slide.poster_url)} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline>{slide.mobile_url && <source src={toPublicMediaUrl(slide.mobile_url)} media="(max-width: 640px)" />}<source src={media} /></video> : <picture>{slide.mobile_url && <source srcSet={toPublicMediaUrl(slide.mobile_url)} media="(max-width: 640px)" />}<img src={media} alt={content.alt_text || ''} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${slide.focal_x}% ${slide.focal_y}%` }} /></picture>}
      <div className="absolute inset-0 bg-black/55" />
      <div className="container relative flex min-h-[440px] items-end pb-20 pt-28 md:min-h-[620px] md:pb-24">
        <HomepageReveal className="max-w-3xl" animation={block.behavior.animation}>
          {content.eyebrow && <p className="mb-4 text-sm font-semibold text-white/80">{content.eyebrow}</p>}
          <h1 className="font-heading text-4xl font-semibold leading-tight md:text-6xl">{content.title}</h1>
          {content.subtitle && <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 md:text-lg">{content.subtitle}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {content.primary_label && <SafeLink href={slide.link.href} locale={locale} newTab={slide.link.new_tab}><Button className="bg-white text-primary hover:bg-white/90">{content.primary_label}</Button></SafeLink>}
            {content.secondary_label && secondaryHref && <SafeLink href={secondaryHref} locale={locale}><Button variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white">{content.secondary_label}</Button></SafeLink>}
          </div>
        </HomepageReveal>
      </div>
      {slides.length > 1 && <div className="absolute bottom-6 right-6 flex items-center gap-2 md:right-10">
        <button className="grid h-11 w-11 place-items-center rounded-md border border-white/50 bg-black/20" onClick={() => setCurrent((current - 1 + slides.length) % slides.length)} aria-label="Previous slide"><ArrowLeft className="h-4 w-4" /></button>
        <span className="min-w-12 text-center text-sm">{current + 1} / {slides.length}</span>
        <button className="grid h-11 w-11 place-items-center rounded-md border border-white/50 bg-black/20" onClick={() => setCurrent((current + 1) % slides.length)} aria-label="Next slide"><ArrowRight className="h-4 w-4" /></button>
      </div>}
    </section>
  );
}

function VideoHeroBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const item = block.items.find((entry) => entry.is_enabled);
  const content = contentFor(block, locale);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  if (!item) return null;
  const media = toPublicMediaUrl(item.media_url);
  const poster = toPublicMediaUrl(item.poster_url);
  return <section className="relative min-h-[480px] overflow-hidden bg-[#241328] text-white md:min-h-[680px]">
    {reduceMotion || paused ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <video poster={poster} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline>{item.mobile_url && <source src={toPublicMediaUrl(item.mobile_url)} media="(max-width: 640px)" />}<source src={media} /></video>}
    <div className={cn('absolute inset-0', block.design.overlay === 'light' ? 'bg-black/25' : block.design.overlay === 'medium' ? 'bg-black/45' : 'bg-black/60')} />
    <div className="container relative flex min-h-[480px] items-end pb-20 pt-28 md:min-h-[680px] md:pb-28"><HomepageReveal className="max-w-3xl" animation={block.behavior.animation}>
      {content.eyebrow && <p className="mb-3 text-sm font-semibold text-white/80">{content.eyebrow}</p>}
      <h1 className="font-heading text-4xl font-semibold leading-tight md:text-7xl">{content.title}</h1>
      {content.subtitle && <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg">{content.subtitle}</p>}
      {content.primary_label && <SafeLink href={block.primary_link.href} locale={locale} newTab={block.primary_link.new_tab}><Button className="mt-7 bg-white text-primary hover:bg-white/90">{content.primary_label}</Button></SafeLink>}
    </HomepageReveal></div>
    <button onClick={() => setPaused((value) => !value)} className="absolute bottom-6 right-6 grid h-11 w-11 place-items-center rounded-md border border-white/50 bg-black/25" aria-label={paused ? 'Play background video' : 'Pause background video'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
  </section>;
}

function MediaStoryBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale); const item = block.items[0];
  const reverse = block.config.legacy_layout === 'media_right' || block.config.media_position === 'right';
  return <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
    <HomepageReveal className={cn(reverse && 'md:order-2')} animation={block.behavior.animation}>{item && <Media item={item} locale={locale} className={cn(ratioClass(block.design.media_ratio), 'w-full rounded-md object-cover')} />}</HomepageReveal>
    <HomepageReveal className={cn(reverse && 'md:order-1')} delay={0.08} animation={block.behavior.animation}>
      {content.eyebrow && <p className="mb-2 text-xs font-semibold text-primary">{content.eyebrow}</p>}<h2 className="font-heading text-3xl font-semibold md:text-5xl">{content.title}</h2>
      {content.subtitle && <p className="mt-3 text-lg opacity-75">{content.subtitle}</p>} {content.body && <p className="mt-5 whitespace-pre-line text-sm leading-7 opacity-75 md:text-base">{content.body}</p>}
      {content.link_label && <SafeLink href={block.primary_link.href} locale={locale} newTab={block.primary_link.new_tab} className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">{content.link_label}<ArrowRight className="h-4 w-4" /></SafeLink>}
    </HomepageReveal>
  </div>;
}

function Media({ item, locale, className = '' }: { item: HomepageV2Item; locale: string; className?: string }) {
  const content = itemContent(item, locale); const url = toPublicMediaUrl(item.media_url);
  if (item.media_type === 'video' || isVideo(url)) return <video poster={toPublicMediaUrl(item.poster_url)} controls className={className} preload="metadata">{item.mobile_url && <source src={toPublicMediaUrl(item.mobile_url)} media="(max-width: 640px)" />}<source src={url} />{Boolean(item.meta[`caption_${locale}`]) && <track kind="captions" src={String(item.meta[`caption_${locale}`])} srcLang={locale} label={locale.toUpperCase()} default />}</video>;
  return <picture>{item.mobile_url && <source srcSet={toPublicMediaUrl(item.mobile_url)} media="(max-width: 640px)" />}<img src={url} alt={content.alt_text || content.title || ''} className={className} loading="lazy" style={{ objectPosition: `${item.focal_x}% ${item.focal_y}%` }} /></picture>;
}

function MarqueeBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const rows = [0, 1, 2].map((row) => block.items.filter((_, index) => index % 3 === row));
  return <div className="space-y-3">{rows.map((items, row) => items.length ? <LogoLoopSurface key={row} reverse={row === 1} speed={block.behavior.speed}>{[...items, ...items].map((item, index) => <SafeLink key={`${item.id}-${index}`} href={item.link.href} locale={locale} newTab={item.link.new_tab}><Media item={item} locale={locale} className="h-28 w-44 rounded-md object-cover sm:h-36 sm:w-56" /></SafeLink>)}</LogoLoopSurface> : null)}</div>;
}

function GalleryBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><MasonrySurface>{block.items.map((item, index) => <HomepageReveal key={item.id} className="mb-4 break-inside-avoid" delay={Math.min(index, 5) * .05} animation={block.behavior.animation}><SafeLink href={item.link.href} locale={locale} newTab={item.link.new_tab}><Media item={item} locale={locale} className="h-auto w-full rounded-md object-cover" />{itemContent(item, locale).caption && <p className="mt-2 text-sm opacity-70">{itemContent(item, locale).caption}</p>}</SafeLink></HomepageReveal>)}</MasonrySurface></>;
}

function AwardsBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{block.items.map((item, index) => { const content = itemContent(item, locale); return <HomepageReveal key={item.id} delay={index * .06} animation={block.behavior.animation}><SpotlightSurface className="h-full overflow-hidden rounded-md border bg-white"><Media item={item} locale={locale} className="aspect-[4/3] w-full object-cover" /><div className="p-5"><div className="flex items-center gap-2 text-xs font-semibold text-primary"><Award className="h-4 w-4" />{String(item.meta.year || '')}</div><h3 className="mt-2 text-xl font-semibold">{content.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{content.subtitle || content.body}</p></div></SpotlightSurface></HomepageReveal>; })}</div></>;
}

function SponsorBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><LogoLoopSurface speed={block.behavior.speed}>{[...block.items, ...block.items].map((item, index) => { const content = itemContent(item, locale); return <SafeLink key={`${item.id}-${index}`} href={item.link.href} locale={locale} sponsored newTab><div className="flex h-24 w-48 items-center justify-center rounded-md border bg-white p-4"><img src={toPublicMediaUrl(item.media_url)} alt={content.alt_text || content.title} className="max-h-14 max-w-full object-contain" /></div></SafeLink>; })}</LogoLoopSurface></>;
}

function CampaignBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale); const item = block.items[0]; const disclosure = locale === 'fr' ? 'Commandité' : locale === 'en' ? 'Sponsored' : '推广内容';
  return <SpotlightSurface className="grid overflow-hidden rounded-md border bg-white md:grid-cols-[1.15fr_.85fr]">{item && <Media item={item} locale={locale} className="h-full min-h-64 w-full object-cover" />}<div className="flex flex-col justify-center p-7 md:p-10"><p className="text-xs font-semibold text-primary">{disclosure}</p><h2 className="mt-3 font-heading text-3xl font-semibold">{content.title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{content.subtitle || content.body}</p>{content.primary_label && <SafeLink href={block.primary_link.href} locale={locale} sponsored newTab={block.primary_link.new_tab}><Button className="mt-6">{content.primary_label}<ExternalLink className="ml-2 h-4 w-4" /></Button></SafeLink>}</div></SpotlightSurface>;
}

function TestimonialsBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><div className="grid gap-4 md:grid-cols-3">{block.items.map((item, index) => { const content = itemContent(item, locale); return <HomepageReveal key={item.id} delay={index * .07} animation={block.behavior.animation}><blockquote className="h-full rounded-md border bg-white p-6"><Quote className="h-6 w-6 text-primary" /><p className="mt-4 text-base leading-7">{content.body || content.caption}</p><footer className="mt-5 text-sm font-semibold">{content.title}<span className="block font-normal text-muted-foreground">{content.subtitle}</span></footer></blockquote></HomepageReveal>; })}</div></>;
}

function StatisticsBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{block.items.map((item, index) => { const Icon = statisticIcons[index % statisticIcons.length]; const content = itemContent(item, locale); return <HomepageReveal key={item.id} delay={index * .06} className="text-center" animation={block.behavior.animation}><div className="py-6"><Icon className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 text-3xl font-bold md:text-5xl"><AnimatedNumber value={String(item.meta.value || '0')} /></p><p className="mt-2 text-sm text-muted-foreground">{content.label || content.title}</p></div></HomepageReveal>; })}</div>;
}

function FeatureBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{block.items.map((item, index) => { const content = itemContent(item, locale); return <HomepageReveal key={item.id} delay={index * .06} animation={block.behavior.animation}><SpotlightSurface className="h-full rounded-md border bg-white p-6">{item.media_url && <Media item={item} locale={locale} className="mb-5 aspect-[16/9] w-full rounded-md object-cover" />}<h3 className="text-xl font-semibold">{content.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{content.body || content.subtitle}</p></SpotlightSurface></HomepageReveal>; })}</div></>;
}

function TimelineBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  return <><BlockHeading block={block} locale={locale} /><div className="mx-auto max-w-4xl border-l border-primary/25 pl-6 md:pl-10">{block.items.map((item, index) => { const content = itemContent(item, locale); return <HomepageReveal key={item.id} className="relative pb-10" delay={index * .05} animation={block.behavior.animation}><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary md:-left-[47px]" /><p className="text-xs font-semibold text-primary">{String(item.meta.year || content.eyebrow || '')}</p><h3 className="mt-1 text-2xl font-semibold">{content.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{content.body || content.subtitle}</p></HomepageReveal>; })}</div></>;
}

function QuoteBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale); const item = block.items[0];
  return <div className={cn('grid items-center gap-8', item && 'md:grid-cols-[.8fr_1.2fr]')} >{item && <Media item={item} locale={locale} className="aspect-[4/5] w-full rounded-md object-cover" />}<HomepageReveal animation={block.behavior.animation}><Quote className="h-8 w-8 text-primary" /><blockquote className="mt-5 font-heading text-3xl font-semibold leading-tight md:text-5xl">{content.body || content.title}</blockquote><p className="mt-5 text-sm text-muted-foreground">{content.subtitle}</p></HomepageReveal></div>;
}

function CtaBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale);
  return <HomepageReveal className="text-center" animation={block.behavior.animation}><h2 className="font-heading text-3xl font-semibold md:text-5xl">{content.title}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 opacity-75">{content.subtitle}</p>{content.body && <p className="mx-auto mt-3 max-w-2xl text-sm opacity-65">{content.body}</p>}<div className="mt-7 flex flex-wrap justify-center gap-3">{content.primary_label && <SafeLink href={block.primary_link.href} locale={locale} newTab={block.primary_link.new_tab}><Button>{content.primary_label}</Button></SafeLink>}{content.secondary_label && <SafeLink href={block.secondary_link.href} locale={locale} newTab={block.secondary_link.new_tab}><Button variant="outline">{content.secondary_label}</Button></SafeLink>}</div></HomepageReveal>;
}

function SectionFrame({ block, children }: { block: HomepageV2Block; children: React.ReactNode }) {
  const theme = block.design.theme === 'dark_plum' ? 'bg-[#2a172d] text-white' : block.design.theme === 'soft_lilac' ? 'bg-[#f6f2f7] text-foreground' : block.design.theme === 'transparent' ? 'bg-transparent text-foreground' : 'bg-white text-foreground';
  const spacing = block.design.spacing === 'compact' ? 'py-8 md:py-12' : block.design.spacing === 'spacious' ? 'py-20 md:py-28' : 'py-12 md:py-20';
  const width = block.design.width === 'full' ? 'w-full' : block.design.width === 'wide' ? 'mx-auto w-full max-w-[1440px] px-4 sm:px-6' : 'container';
  return <section className={cn(theme, spacing)}><div className={width}>{children}</div></section>;
}

function DynamicSection({ block, locale }: { block: HomepageV2Block; locale: string }) {
  const content = contentFor(block, locale);
  const section: HomepageSection = { title: content.title, subtitle: content.subtitle, link_label: content.link_label, is_enabled: true };
  if (block.type === 'program_directory') return <ProgramGrid sectionOverride={section} limit={block.data_source.limit} category={block.data_source.category} sort={block.data_source.sort} />;
  if (block.type === 'performances') return <EventCards sectionOverride={section} limit={block.data_source.limit} />;
  return <NewsGrid sectionOverride={section} limit={block.data_source.limit} category={block.data_source.category} sort={block.data_source.sort} />;
}

function RenderBlock({ block, locale }: { block: HomepageV2Block; locale: string }) {
  if (block.type === 'hero_carousel') return <HeroCarouselBlock block={block} locale={locale} />;
  if (block.type === 'video_hero') return <VideoHeroBlock block={block} locale={locale} />;
  if (['program_directory', 'performances', 'latest_news'].includes(block.type)) return <DynamicSection block={block} locale={locale} />;
  let content: React.ReactNode = null;
  if (block.type === 'media_story') content = <MediaStoryBlock block={block} locale={locale} />;
  else if (block.type === 'video_player') content = <><BlockHeading block={block} locale={locale} />{block.items[0] && <Media item={block.items[0]} locale={locale} className={cn(ratioClass(block.design.media_ratio), 'w-full rounded-md bg-black object-contain')} />}</>;
  else if (block.type === 'image_marquee') content = <><BlockHeading block={block} locale={locale} /><MarqueeBlock block={block} locale={locale} /></>;
  else if (block.type === 'masonry_gallery') content = <GalleryBlock block={block} locale={locale} />;
  else if (block.type === 'awards_showcase') content = <AwardsBlock block={block} locale={locale} />;
  else if (block.type === 'sponsor_wall') content = <SponsorBlock block={block} locale={locale} />;
  else if (block.type === 'campaign') content = <CampaignBlock block={block} locale={locale} />;
  else if (block.type === 'testimonials') content = <TestimonialsBlock block={block} locale={locale} />;
  else if (block.type === 'statistics') content = <StatisticsBlock block={block} locale={locale} />;
  else if (block.type === 'feature_grid') content = <FeatureBlock block={block} locale={locale} />;
  else if (block.type === 'timeline') content = <TimelineBlock block={block} locale={locale} />;
  else if (block.type === 'editorial_quote') content = <QuoteBlock block={block} locale={locale} />;
  else if (block.type === 'cta') content = <CtaBlock block={block} locale={locale} />;
  return <SectionFrame block={block}>{content}</SectionFrame>;
}

export function HomepageRenderer({ document, locale }: { document: HomepageDocumentV2; locale: string; preview?: boolean }) {
  const blocks = useMemo(() => document.blocks.filter((block) => block.is_enabled), [document.blocks]);
  return <>{blocks.map((block) => <RenderBlock key={block.id} block={block} locale={locale} />)}</>;
}
