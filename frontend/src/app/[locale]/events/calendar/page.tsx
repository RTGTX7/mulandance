import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

const events = [
  { title: 'Spring Showcase Auditions', date: 'May 30, 2026', time: '2:00 PM', type: 'workshop' },
  { title: 'Community Open House', date: 'Jun 6, 2026', time: '10:00 AM', type: 'openHouse' },
  { title: 'Contemporary Masterclass', date: 'Jun 13, 2026', time: '1:00 PM', type: 'workshop' },
  { title: 'Summer Camp Info Session', date: 'Jun 20, 2026', time: '6:00 PM', type: 'community' },
  { title: 'Ballet Technique Workshop', date: 'Jul 4, 2026', time: '10:00 AM', type: 'workshop' },
  { title: 'Annual Gala Planning Meeting', date: 'Jul 11, 2026', time: '7:00 PM', type: 'gala' },
];

export default function CalendarPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.events'), href: 'events' }]} />
        <h1 className="heading-xl mb-4">{t('events.calendar')}</h1>
        <p className="text-lead mb-12">
          Stay up to date with all upcoming events at Grace Dance Academy.
        </p>

        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.title}>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <Calendar className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.date} at {event.time}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
