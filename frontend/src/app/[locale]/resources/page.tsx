'use client';

import { useTranslations } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Users, FileText } from 'lucide-react';

const resources = [
  {
    icon: BookOpen,
    titleKey: 'resources.educators',
    items: [
      'Curriculum Guides',
      'Teaching Resources',
      'Professional Development',
      'Workshop Calendar',
    ],
  },
  {
    icon: Users,
    titleKey: 'resources.students',
    items: [
      'Class Schedules',
      'Exam Preparation Materials',
      'Performance Calendar',
      'Training Tips',
    ],
  },
  {
    icon: FileText,
    titleKey: 'resources.families',
    items: [
      'Parent Handbook',
      'Registration Forms',
      'Payment Information',
      'FAQs',
    ],
  },
  {
    icon: Download,
    titleKey: 'resources.research',
    items: [
      'Dance Science Publications',
      'Annual Reports',
      'Impact Studies',
      'Press Kit',
    ],
  },
];

export default function ResourcesPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.resources'), href: 'resources' }]} />
        <h1 className="heading-xl mb-4">{t('resources.title')}</h1>
        <p className="text-lead mb-12">
          Comprehensive resources for educators, students, families, and the dance community.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {resources.map((section) => (
            <Card key={section.titleKey}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-6 w-6 text-secondary" />
                  <h2 className="heading-sm">{t(section.titleKey)}</h2>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-4">
                  {t('common.buttons.viewAll')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="heading-lg mb-4">Quick Downloads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                '2026 Class Schedule',
                'Registration Forms',
                'Parent Handbook',
                'Exam Calendar',
                'Summer Camp Guide',
                'Performance Tickets',
              ].map((doc) => (
                <Button key={doc} variant="outline" size="sm" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  {doc}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
