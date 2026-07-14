'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [openedMail, setOpenedMail] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = [
      `${t('about.contact.form.name')}: ${form.name}`,
      `${t('about.contact.form.email')}: ${form.email}`,
      '',
      form.message,
    ].join('\n');
    window.location.href = `mailto:info@mulandance.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
    setOpenedMail(true);
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[210px] overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 py-8 md:h-[300px] md:py-0">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white relative z-10 px-4">
            <Breadcrumbs
              items={[
                { label: t('common.nav.about'), href: '/about' },
                { label: t('about.contact.title'), href: '/about/contact' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('about.contact.title')}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {t('about.joinUs.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center text-sm">{t('about.contact.address')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.address')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center text-sm">{t('about.contact.phone')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.phone')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center text-sm">{t('about.contact.email')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.email')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-xl mx-auto mb-12">
            <h2 className="heading-lg text-center mb-8">{t('about.contact.form.submit')}</h2>
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.name')}</label>
                <Input required value={form.name} placeholder={t('about.contact.form.namePlaceholder')} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.email')}</label>
                <Input required type="email" value={form.email} placeholder={t('about.contact.form.emailPlaceholder')} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.subject')}</label>
                <Input required value={form.subject} placeholder={t('about.contact.form.subject')} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.message')}</label>
                <Textarea required value={form.message} placeholder={t('about.contact.form.messagePlaceholder')} rows={5} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
              </div>
              <Button type="submit" size="lg" className="w-full">{t('about.contact.form.submit')}</Button>
              {openedMail && <p className="text-center text-sm text-muted-foreground">{t('about.contact.form.success')}</p>}
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
