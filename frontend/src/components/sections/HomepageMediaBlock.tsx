'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HomepageBlock } from '@/lib/api';
import { cn } from '@/lib/utils';

function isVideo(block: HomepageBlock) {
  return block.media_type === 'video' || (block.media_type === 'auto' && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(block.media_url));
}

export function HomepageMediaBlock({ block, locale }: { block: HomepageBlock; locale: string }) {
  const external = /^(https?:|mailto:|tel:)/.test(block.link.href || '');
  const href = external ? block.link.href : `/${locale}${block.link.href?.startsWith('/') ? block.link.href : `/${block.link.href || ''}`}`;
  const media = block.media_url ? isVideo(block) ? <video src={block.media_url} className="h-full w-full object-cover" autoPlay muted loop playsInline /> : <img src={block.media_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full min-h-[280px] bg-[#eee8ef]" />;
  if (block.layout === 'full_bleed') return <section className="relative min-h-[520px] overflow-hidden bg-slate-950 text-white"><div className="absolute inset-0">{media}<div className="absolute inset-0 bg-black/45" /></div><div className="relative mx-auto flex min-h-[520px] max-w-6xl items-end px-4 py-14 sm:px-6"><div className="max-w-2xl"><h2 className="text-4xl font-semibold sm:text-5xl">{block.title}</h2>{block.subtitle && <p className="mt-3 text-xl text-white/85">{block.subtitle}</p>}{block.body && <p className="mt-5 whitespace-pre-line leading-7 text-white/75">{block.body}</p>}{block.link.label && <Button asChild className="mt-6"><Link href={href}>{block.link.label}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</div></div></section>;
  return <section className="bg-white py-14 sm:py-20"><div className={cn('mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:grid-cols-2', block.layout === 'media_right' && 'md:[&>*:first-child]:order-2')}><div className="aspect-[4/3] overflow-hidden bg-[#eee8ef]">{media}</div><div><div className="mb-5 h-1 w-14 bg-fuchsia-600" /><h2 className="text-4xl font-semibold text-slate-950">{block.title}</h2>{block.subtitle && <p className="mt-3 text-xl text-slate-600">{block.subtitle}</p>}{block.body && <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">{block.body}</p>}{block.link.label && <Button asChild className="mt-6"><Link href={href}>{block.link.label}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</div></div></section>;
}
