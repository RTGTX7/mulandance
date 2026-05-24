'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
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

export default function RegisterPage() {
  const t = useTranslations();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="section-padding">
      <div className="container max-w-2xl">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('programs.register.title')}</h1>
        <p className="text-lead mb-12">{t('programs.register.subtitle')}</p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t('programs.register.form.studentName')}
                  </label>
                  <Input required placeholder="Full name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t('programs.register.form.dateOfBirth')}
                  </label>
                  <Input type="date" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('programs.register.form.program')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ballet">Ballet</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="chinese">Chinese Dance</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="hiphop">Hip-Hop</SelectItem>
                    <SelectItem value="summer">Summer Camp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('programs.register.form.parentEmail')}
                </label>
                <Input type="email" required placeholder="parent@email.com" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('programs.register.form.phone')}
                </label>
                <Input placeholder="+1 (555) 000-0000" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('programs.register.form.experience')}
                </label>
                <Textarea placeholder="Tell us about any previous dance experience..." rows={3} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('programs.register.form.schedule')}
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Preferred schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday/Wednesday</SelectItem>
                    <SelectItem value="tuesday">Tuesday/Thursday</SelectItem>
                    <SelectItem value="saturday">Saturday Morning</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" size="lg" className="w-full">
                {t('programs.register.form.submit')}
              </Button>

              {submitted && (
                <p className="text-sm text-green-600 text-center">
                  Registration submitted successfully! We will contact you within 2 business days.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
