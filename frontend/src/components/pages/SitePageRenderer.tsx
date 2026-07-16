'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { pagesApi, type SitePageBlock, type SitePageDocument, type SitePagePublicResponse, type SitePageSlug } from '@/lib/api';
import { toPublicMediaUrl } from '@/lib/media';
import { useTranslations } from '@/components/ui/i18n-client';

type Props = { slug: SitePageSlug; locale: string; document?: SitePageDocument; contactOverride?: SitePagePublicResponse['contact'] };
type Locale = 'zh' | 'en' | 'fr';

const fallback: Record<SitePageSlug, Record<Locale, { eyebrow: string; title: string; subtitle: string; alt_text: string }>> = {
  about: { zh: { eyebrow: '木兰舞蹈工作室', title: '关于我们', subtitle: '在舞动中学习，在舞台上成长。', alt_text: '' }, en: { eyebrow: 'Mulan Dance Studio', title: 'About Us', subtitle: 'Learn through movement and grow with every performance.', alt_text: '' }, fr: { eyebrow: 'Mulan Dance Studio', title: 'À propos de nous', subtitle: 'Apprendre par le mouvement et grandir à chaque spectacle.', alt_text: '' } },
  contact: { zh: { eyebrow: '木兰舞蹈工作室', title: '联系我们', subtitle: '欢迎咨询课程、报名、演出与教室使用。', alt_text: '' }, en: { eyebrow: 'Mulan Dance Studio', title: 'Contact Us', subtitle: 'We are happy to help with classes, registration, performances, and studio use.', alt_text: '' }, fr: { eyebrow: 'Mulan Dance Studio', title: 'Nous contacter', subtitle: "Nous sommes là pour vous aider concernant les cours, l'inscription et l'utilisation du studio.", alt_text: '' } },
};

function copyFor(block: SitePageBlock, locale: Locale) {
  const selected = block.content[locale];
  const zh = block.content.zh;
  return { ...zh, ...selected, title: selected.title || zh.title, subtitle: selected.subtitle || zh.subtitle, body: selected.body || zh.body, label: selected.label || zh.label, primary_label: selected.primary_label || zh.primary_label, placeholder: selected.placeholder || zh.placeholder, success_message: selected.success_message || zh.success_message, alt_text: selected.alt_text || zh.alt_text };
}

function Block({ block, locale, contact, onSubmitted }: { block: SitePageBlock; locale: Locale; contact: SitePagePublicResponse['contact']; onSubmitted: () => void }) {
  const content = copyFor(block, locale);
  if (!block.is_enabled) return null;
  if (block.type === 'contact_details') {
    return <section aria-label={content.title}>{content.title && <h2 className="heading-lg mb-6">{content.title}</h2>}<div className="grid gap-4 sm:grid-cols-3"><div className="border-l-2 border-primary/60 pl-4"><MapPin className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{contact.address || '2527 Baseline Rd, Ottawa, ON'}</p></div><div className="border-l-2 border-primary/60 pl-4"><Phone className="mb-3 h-5 w-5 text-primary" /><a className="text-sm text-muted-foreground hover:text-primary" href={`tel:${contact.phone}`}>{contact.phone}</a></div><div className="border-l-2 border-primary/60 pl-4"><Mail className="mb-3 h-5 w-5 text-primary" /><a className="break-all text-sm text-muted-foreground hover:text-primary" href={`mailto:${contact.email}`}>{contact.email}</a></div></div></section>;
  }
  if (block.type === 'contact_form') return <ContactForm block={block} locale={locale} recipient={contact.email} onSubmitted={onSubmitted} />;
  if (block.type === 'bullet_list') return <section className="space-y-5"><h2 className="heading-lg">{content.title}</h2><ul className="grid gap-3 text-body text-muted-foreground md:grid-cols-2">{block.items.map((item, index) => <li key={index} className="border-l-2 border-primary/40 pl-4">{String(item[locale] || item.zh || '')}</li>)}</ul></section>;
  if (block.type === 'values_grid') return <section className="border-y border-border py-10"><h2 className="heading-lg mb-4">{content.title}</h2>{content.body && <p className="text-lead max-w-3xl text-muted-foreground">{content.body}</p>}{block.items.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{block.items.map((item, index) => <div key={index} className="border-l-2 border-primary/40 pl-4 text-sm leading-6 text-muted-foreground">{String(item[locale] || item.zh || '')}</div>)}</div>}</section>;
  if (block.type === 'office_hours') return <section><h2 className="heading-lg mb-4">{content.title}</h2><p className="whitespace-pre-line text-lead text-muted-foreground">{content.body || content.subtitle}</p></section>;
  if (block.type === 'map_link') return <section className="flex flex-col items-start justify-between gap-5 border-y border-border py-8 sm:flex-row sm:items-center"><div><h2 className="heading-lg">{content.title}</h2>{content.body && <p className="mt-2 text-muted-foreground">{content.body}</p>}</div>{block.href && <Button asChild variant="outline"><Link href={block.href} target="_blank" rel="noopener noreferrer">{content.primary_label || content.label || 'View map'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</section>;
  if (block.type === 'cta') return <section className="flex flex-col items-start justify-between gap-5 border-t border-border pt-10 sm:flex-row sm:items-center"><div><h2 className="heading-lg">{content.title}</h2>{content.body && <p className="mt-2 text-muted-foreground">{content.body}</p>}</div>{block.href && <Button asChild><Link href={block.href}>{content.primary_label || content.label || 'Learn more'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</section>;
  return <section className={`grid gap-8 ${block.image_url ? 'items-center md:grid-cols-2' : ''}`}><div className={block.image_url && block.design?.media_side === 'left' ? 'md:order-2' : ''}><h2 className="heading-lg mb-4">{content.title}</h2><p className="whitespace-pre-line text-lead text-muted-foreground">{content.body || content.subtitle}</p></div>{block.image_url && <picture><source media="(max-width: 640px)" srcSet={toPublicMediaUrl(block.mobile_image_url || block.image_url)} /><img src={toPublicMediaUrl(block.image_url)} alt={block.decorative_image ? '' : content.alt_text || content.title} className="aspect-[4/3] w-full rounded-sm object-cover" style={{ objectPosition: block.focal_point }} loading="lazy" /></picture>}</section>;
}

function ContactForm({ block, locale, recipient, onSubmitted }: { block: SitePageBlock; locale: Locale; recipient: string; onSubmitted: () => void }) {
  const c = copyFor(block, locale);
  const defaults = locale === 'fr' ? { name: 'Nom', email: 'Courriel', subject: 'Objet', message: 'Message', send: 'Envoyer' } : locale === 'en' ? { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message', send: 'Send' } : { name: '姓名', email: '邮箱', subject: '主题', message: '留言', send: '发送' };
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const body = `${form.name}\n${form.email}\n\n${form.message}`; window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`; onSubmitted(); };
  return <section className="mx-auto w-full max-w-2xl"><h2 className="heading-lg mb-6">{c.title}</h2><form className="space-y-4" onSubmit={submit}><Input required aria-label={c.name_label || defaults.name} placeholder={c.name_label || defaults.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input required type="email" aria-label={c.email_label || defaults.email} placeholder={c.email_label || defaults.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input required aria-label={c.subject_label || defaults.subject} placeholder={c.subject_label || defaults.subject} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><Textarea required aria-label={c.message_label || defaults.message} placeholder={c.placeholder || c.message_label || defaults.message} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><Button type="submit" className="w-full">{c.primary_label || c.label || defaults.send}</Button></form></section>;
}

export default function SitePageRenderer({ slug, locale: rawLocale, document, contactOverride }: Props) {
  const t = useTranslations();
  const locale: Locale = rawLocale === 'fr' ? 'fr' : rawLocale.startsWith('zh') ? 'zh' : 'en';
  const [data, setData] = useState<SitePagePublicResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (document) {
      setData({ page: document, locale, contact: contactOverride || { email: '', phone: '', address: '', social: {} } });
      return;
    }
    pagesApi.public(slug, locale).then(setData).catch(() => setData(null));
  }, [slug, locale, document, contactOverride]);
  const page: SitePageDocument | null = data?.page || null;
  const hero = page ? copyFor(page.hero, locale) : fallback[slug][locale];
  const blocks = useMemo(() => page ? [page.hero, ...page.blocks].filter((block) => block.id !== page.hero.id) : [], [page]);
  const legacyFallback = !page && slug === 'about' ? <><section className="space-y-5"><h2 className="heading-lg">{t('about.philosophy.heading')}</h2><p className="text-lead text-muted-foreground">{t('about.philosophy.desc')}</p></section><section className="space-y-5"><h2 className="heading-lg">{t('about.goals.title')}</h2><ul className="grid gap-3 text-body text-muted-foreground md:grid-cols-2">{[0, 1, 2, 3, 4].map((index) => <li key={index} className="border-l-2 border-primary/40 pl-4">{t(`about.goals.items.${index}`)}</li>)}</ul></section><section className="space-y-5"><h2 className="heading-lg">{t('about.vision.title')}</h2><p className="text-lead text-muted-foreground">{[0, 1, 2, 3, 4].map((index) => t(`about.vision.items.${index}`)).join(' ')}</p></section></> : null;
  const legacyContact = !page && slug === 'contact' ? <section className="grid gap-5 sm:grid-cols-3"><div className="border-l-2 border-primary/60 pl-4"><MapPin className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{t('common.footer.address')}</p></div><div className="border-l-2 border-primary/60 pl-4"><Phone className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{t('common.footer.phone')}</p></div><div className="border-l-2 border-primary/60 pl-4"><Mail className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{t('common.footer.email')}</p></div></section> : null;
  return <main className="pt-16"><section className="relative overflow-hidden border-b border-border bg-primary/5 py-16 md:py-24"><div className="container relative z-10"><Breadcrumbs items={[{ label: t('common.nav.about'), href: '/about' }, ...(slug === 'contact' ? [{ label: hero.title, href: '/about/contact' }] : [])]} /><p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{hero.eyebrow}</p><h1 className="heading-xl mt-3 max-w-3xl">{hero.title}</h1><p className="mt-5 max-w-2xl text-lg text-muted-foreground">{hero.subtitle}</p></div>{page?.hero.image_url && <picture><source media="(max-width: 640px)" srcSet={toPublicMediaUrl(page.hero.mobile_image_url || page.hero.image_url)} /><img src={toPublicMediaUrl(page.hero.image_url)} alt={page.hero.decorative_image ? '' : hero.alt_text || ''} className="absolute inset-0 h-full w-full object-cover opacity-20" style={{ objectPosition: page.hero.focal_point }} /></picture>}</section><div className="container section-padding space-y-14">{blocks.length ? blocks.map((block) => <Block key={block.id} block={block} locale={locale} contact={data?.contact || { email: '', phone: '', address: '', social: {} }} onSubmitted={() => setSubmitted(true)} />) : legacyFallback || legacyContact || <p className="text-muted-foreground">{hero.subtitle}</p>}{submitted && <p className="text-center text-sm text-muted-foreground">{(page?.blocks.find((block) => block.type === 'contact_form') && copyFor(page.blocks.find((block) => block.type === 'contact_form')!, locale).success_message) || 'Thank you.'}</p>}</div></main>;
}
