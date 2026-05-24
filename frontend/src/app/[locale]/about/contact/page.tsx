'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

export default function ContactPage() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="section-padding">
      <div className="container max-w-5xl">
        <Breadcrumbs items={[{ label: t('common.nav.about'), href: 'about' }]} />
        <h1 className="heading-xl mb-4">{t('about.contact.title')}</h1>
        <p className="text-lead mb-12">
          {t('home.hero.subtitle')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {t('about.contact.form.name')}
                      </label>
                      <Input required placeholder="Your name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {t('about.contact.form.email')}
                      </label>
                      <Input type="email" required placeholder="your@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('about.contact.form.subject')}
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="programs">Programs & Classes</SelectItem>
                        <SelectItem value="enrollment">Enrollment</SelectItem>
                        <SelectItem value="performances">Performances & Tickets</SelectItem>
                        <SelectItem value="venue">Venue Rental</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t('about.contact.form.message')}
                    </label>
                    <Textarea
                      required
                      rows={5}
                      placeholder="How can we help you?"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    {t('about.contact.form.submit')}
                  </Button>
                  {submitted && (
                    <p className="text-sm text-green-600">
                      {t('about.contact.form.success')}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('common.appName')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('common.footer.address')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-secondary shrink-0" />
                  <a href="tel:+15551234567" className="text-sm text-muted-foreground hover:text-foreground">
                    {t('common.footer.phone')}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-secondary shrink-0" />
                  <a href="mailto:info@gracedanceacademy.org" className="text-sm text-muted-foreground hover:text-foreground">
                    {t('common.footer.email')}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="heading-sm mb-4">Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
