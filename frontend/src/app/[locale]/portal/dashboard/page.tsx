'use client';

import { useTranslations } from 'next-intl';
import { Calendar, CreditCard, MessageSquare, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-xl">{t('portal.dashboard')}</h1>
            <p className="text-lead">{t('portal.welcome')}</p>
          </div>
          <Button variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            {t('portal.logout')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-secondary transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">{t('portal.upcomingClasses')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-secondary transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">{t('portal.payments')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-secondary transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">{t('portal.messages')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-secondary transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">{t('portal.announcements')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="heading-sm">{t('portal.upcomingClasses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { day: 'Monday', time: '5:00 PM', program: 'Ballet Grade 3', instructor: 'Ms. Chen' },
                  { day: 'Wednesday', time: '6:00 PM', program: 'Contemporary Intermediate', instructor: 'Mr. Park' },
                  { day: 'Saturday', time: '10:00 AM', program: 'Chinese Dance Advanced', instructor: 'Ms. Li' },
                ].map((cls, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{cls.program}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.day} at {cls.time} • {cls.instructor}
                      </p>
                    </div>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="heading-sm">{t('portal.announcements')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: 'Spring Showcase Registration', date: 'Apr 15, 2026' },
                  { title: 'Summer Camp Early Bird Pricing', date: 'Apr 10, 2026' },
                  { title: 'Holiday Schedule Update', date: 'Apr 5, 2026' },
                ].map((ann, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <p className="font-medium text-sm">{ann.title}</p>
                    <p className="text-xs text-muted-foreground">{ann.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
