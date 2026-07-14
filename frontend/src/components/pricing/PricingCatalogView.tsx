'use client';

import Link from 'next/link';
import { ArrowRight, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricingCatalog, PricingPlan } from '@/lib/api';
import { cn } from '@/lib/utils';

const copy = {
  zh: { general: '通用课程方案', empty: '价格信息正在更新中', emptyHelp: '请联系工作室了解当前价格。', contact: '联系工作室', book: '查看时间并申请', featured: '推荐' },
  en: { general: 'General class plans', empty: 'Pricing is being updated', emptyHelp: 'Contact the studio for current pricing.', contact: 'Contact the studio', book: 'View times and apply', featured: 'Featured' },
  fr: { general: 'Forfaits généraux', empty: 'Les tarifs sont en cours de mise à jour', emptyHelp: 'Contactez le studio pour connaître les tarifs actuels.', contact: 'Contacter le studio', book: 'Voir les horaires et faire une demande', featured: 'Recommandé' },
} as const;

function localeKey(locale: string): keyof typeof copy {
  return locale.startsWith('fr') ? 'fr' : locale.startsWith('zh') ? 'zh' : 'en';
}

function money(amount: string, currency: string, locale: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  try {
    return new Intl.NumberFormat(locale.startsWith('zh') ? 'zh-CN' : locale.startsWith('fr') ? 'fr-CA' : 'en-CA', {
      style: 'currency', currency: currency || 'CAD', minimumFractionDigits: value % 1 ? 2 : 0,
    }).format(value);
  } catch {
    return `${currency || 'CAD'} ${amount}`;
  }
}

function PlanCard({ plan, locale, rental }: { plan: PricingPlan; locale: string; rental: boolean }) {
  const t = copy[localeKey(locale)];
  return (
    <article className={cn(
      'relative overflow-hidden border bg-white shadow-sm',
      plan.is_featured ? 'border-fuchsia-300 shadow-fuchsia-950/10' : 'border-slate-200',
      rental && plan.image_url ? 'grid md:grid-cols-[0.82fr_1.18fr]' : 'flex h-full flex-col',
    )}>
      {rental && plan.image_url ? (
        <div className="aspect-[4/3] min-h-full bg-slate-100 md:aspect-auto">
          <img src={plan.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {(plan.badge || plan.is_featured) && (
              <p className="mb-2 text-xs font-semibold uppercase text-fuchsia-700">{plan.badge || t.featured}</p>
            )}
            <h3 className="text-2xl font-semibold text-slate-950">{plan.title || plan.room_name}</h3>
            {rental && (plan.studio_name || plan.room_name) ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{[plan.studio_name, plan.room_name].filter(Boolean).join(' · ')}</p>
            ) : null}
          </div>
        </div>
        {plan.description && <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>}
        <div className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
          {plan.options.map((option, index) => (
            <div key={option.id || `${option.label}-${index}`} className="flex items-start justify-between gap-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{option.label}</p>
                {option.note && <p className="mt-1 text-xs leading-5 text-slate-500">{option.note}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className={cn('text-2xl font-semibold', plan.is_featured ? 'text-fuchsia-700' : 'text-slate-950')}>{money(option.amount, option.currency, locale)}</p>
                {option.unit && <p className="mt-1 text-xs text-slate-500">{option.unit}</p>}
              </div>
            </div>
          ))}
        </div>
        {plan.details.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            {plan.details.map((detail, index) => <li key={`${detail}-${index}`} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" /><span>{detail}</span></li>)}
          </ul>
        )}
      </div>
    </article>
  );
}

export function PricingCatalogView({ catalog, locale, preview = false }: { catalog: PricingCatalog; locale: string; preview?: boolean }) {
  const t = copy[localeKey(locale)];
  const plans = catalog.plans.filter((plan) => plan.is_active);
  const blocks = catalog.blocks.filter((block) => block.is_active);
  const rental = catalog.kind === 'rental';
  const rentalHasMedia = rental && plans.some((plan) => Boolean(plan.image_url));
  const groups = rental ? [{ key: 'rental', title: '', plans }] : Array.from(new Set(plans.map((plan) => plan.program_name || t.general))).map((title) => ({ key: title, title, plans: plans.filter((plan) => (plan.program_name || t.general) === title) }));

  return (
    <div className={cn('bg-[#f7f5f8]', !preview && 'min-h-[70vh]')}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <div className="mb-5 h-1 w-14 bg-fuchsia-600" />
          <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">{catalog.title}</h1>
          {catalog.subtitle && <p className="mt-4 text-lg leading-8 text-slate-600">{catalog.subtitle}</p>}
        </header>

        {plans.length === 0 ? (
          <div className="mt-12 border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">{t.empty}</h2>
            <p className="mt-2 text-slate-600">{t.emptyHelp}</p>
            {!preview && <Button asChild className="mt-6"><Link href={`/${locale}/about/contact`}>{t.contact}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.key}>
                {group.title && groups.length > 1 && <h2 className="mb-5 text-xl font-semibold text-slate-900">{group.title}</h2>}
                <div className={cn('grid gap-5', rental ? (rentalHasMedia ? 'grid-cols-1' : 'md:grid-cols-2') : 'md:grid-cols-2 xl:grid-cols-3')}>
                  {group.plans.map((plan, index) => <PlanCard key={plan.id || `${plan.title}-${index}`} plan={plan} locale={locale} rental={rental} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {blocks.length > 0 && (
          <div className="mt-14 grid gap-px bg-slate-200 sm:grid-cols-2">
            {blocks.map((block, index) => (
              <section key={block.id || `${block.title}-${index}`} className={cn('bg-white p-6 sm:p-8', block.block_type === 'notice' && 'sm:col-span-2')}>
                <h2 className="text-xl font-semibold text-slate-950">{block.title}</h2>
                {block.body && <p className="mt-3 text-sm leading-7 text-slate-600">{block.body}</p>}
                {block.items.length > 0 && <ul className="mt-4 space-y-2 text-sm text-slate-600">{block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />{item}</li>)}</ul>}
              </section>
            ))}
          </div>
        )}

        {rental && !preview && plans.length > 0 && (
          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-slate-300 pt-8 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">{t.emptyHelp}</p>
            <Button asChild><Link href={`/${locale}/classrooms#schedule`}>{t.book}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
