'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/components/ui/i18n-client';
import Link from 'next/link';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { performanceApi, type PerformanceItem } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  href: string;
  coverImage?: string;
}

const fallbackEvents: Event[] = [
  {
    id: '1',
    title: '年度学员专场秀 / Annual Student Showcase',
    description: '每年年中/年底举办，每位学员都有机会在专属舞台上展示自己。通过相互学习，激发孩子们的学习兴趣，评选出"小舞王"。',
    date: '2026-06-15',
    time: '19:00',
    location: '渥太华美仑华顿酒店 / Grand Hotel Ottawa',
    type: 'performance',
    href: '/performances/current-season',
  },
  {
    id: '2',
    title: '暑期舞蹈夏令营 / Summer Dance Camp',
    description: '适合5-17岁学员的舞蹈夏令营，一周沉浸式舞蹈体验，涵盖芭蕾、中国舞、现代舞、爵士舞等多种舞种。',
    date: '2026-07-20',
    time: '09:00',
    location: '2527 Baseline Rd, Ottawa',
    type: 'workshop',
    href: '/programs/summer-camps',
  },
  {
    id: '3',
    title: '小荷风采少儿舞蹈大赛 / Xiaohe Fengchi Competition',
    description: '国内最高级别的少儿舞蹈赛事，为学员提供高水平的竞技和展示平台。',
    date: '2026-09-01',
    time: '全天',
    location: '全国各地 / Various Locations',
    type: 'performance',
    href: '/performances/current-season',
  },
];

export function EventCards() {
  const t = useTranslations();
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    performanceApi.list({ current: true })
      .then((items) => {
        if (items.length > 0) {
          setEvents(items.slice(0, 3).map(performanceToEvent));
        }
      })
      .catch(() => setEvents(fallbackEvents));
  }, []);

  return (
    <section className="section-padding">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h2 className="heading-lg mb-2">{t('home.events.title')}</h2>
            <p className="text-lead">{t('home.events.subtitle')}</p>
          </div>
          <Link href="/performances/current-season">
            <span className="text-sm font-medium text-secondary hover:underline">
              {t('home.events.viewAll')} &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEvent(event)}
              className="block h-full text-left"
            >
              <Card className="card-hover h-full group cursor-pointer flex flex-col">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-purple-400/10 rounded-t-lg overflow-hidden relative">
                  {event.coverImage && (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-primary">
                      {event.type === 'performance' ? '演出 / Performance' : '工作坊 / Workshop'}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="heading-sm group-hover:text-secondary transition-colors text-base line-clamp-2 min-h-[48px]">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {selectedEvent && (
            <>
              <div className="relative h-56 bg-gradient-to-br from-primary/20 to-purple-400/10">
                {selectedEvent.coverImage && (
                  <img
                    src={selectedEvent.coverImage}
                    alt={selectedEvent.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge variant="secondary" className="absolute bottom-4 left-5 bg-white/90 text-primary">
                  {selectedEvent.type === 'performance' ? '演出 / Performance' : '工作坊 / Workshop'}
                </Badge>
              </div>
              <div className="space-y-5 p-6">
                <DialogHeader>
                  <DialogTitle className="heading-md leading-snug">{selectedEvent.title}</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed">
                    {selectedEvent.description || 'More details coming soon.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.time}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function performanceToEvent(item: PerformanceItem): Event {
  const start = new Date(item.start_date);
  const end = new Date(item.end_date);
  const allDay = start.getHours() === 0 && start.getMinutes() === 0
    && end.getHours() === 0 && end.getMinutes() === 0;

  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    date: start.toISOString().slice(0, 10),
    time: allDay ? 'All day' : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: item.venue || '',
    type: 'performance',
    href: '/performances/current-season',
    coverImage: item.cover_image,
  };
}
