'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations();

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[300px] bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
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
                <CardTitle className="text-center text-sm">{t('common.footer.address')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.address')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center text-sm">{t('common.footer.phone')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.phone')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-center text-sm">{t('common.footer.email')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{t('common.footer.email')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-xl mx-auto mb-12">
            <h2 className="heading-lg text-center mb-8">{t('about.contact.form.submit')}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.name')}</label>
                <Input placeholder={t('about.contact.form.namePlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.email')}</label>
                <Input type="email" placeholder={t('about.contact.form.emailPlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.subject')}</label>
                <Input placeholder={t('about.contact.form.subject')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('about.contact.form.message')}</label>
                <Textarea placeholder={t('about.contact.form.messagePlaceholder')} rows={5} />
              </div>
              <Button size="lg" className="w-full">{t('about.contact.form.submit')}</Button>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-accent/30 rounded-2xl p-12 text-center">
            <h2 className="heading-lg mb-4">Coming Soon</h2>
            <p className="text-lead text-muted-foreground mb-6">
              More contact features are under development.
            </p>
            <p className="text-body text-muted-foreground">
              We are adding online booking and live chat support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}