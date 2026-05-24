import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const schedule = [
  { day: 'Monday', classes: [
    { time: '9:00 AM', program: 'Young Dancers Ballet', instructor: 'Ms. Chen', level: 'Ages 3-5' },
    { time: '4:00 PM', program: 'Ballet Grade 1-2', instructor: 'Ms. Chen', level: 'Beginner' },
    { time: '5:00 PM', program: 'Contemporary Intermediate', instructor: 'Mr. Park', level: 'Intermediate' },
    { time: '6:30 PM', program: 'Adult Jazz', instructor: 'Ms. Williams', level: 'All Levels' },
  ]},
  { day: 'Tuesday', classes: [
    { time: '9:00 AM', program: 'Chinese Dance Foundations', instructor: 'Ms. Li', level: 'Beginner' },
    { time: '4:30 PM', program: 'Hip-Hop Beginners', instructor: 'Mr. Davis', level: 'Ages 6-12' },
    { time: '6:00 PM', program: 'Ballet Advanced', instructor: 'Ms. Chen', level: 'Advanced' },
  ]},
  { day: 'Wednesday', classes: [
    { time: '9:00 AM', program: 'Contemporary Foundations', instructor: 'Mr. Park', level: 'Beginner' },
    { time: '4:00 PM', program: 'Jazz Intermediate', instructor: 'Ms. Williams', level: 'Intermediate' },
    { time: '5:30 PM', program: 'Chinese Dance Advanced', instructor: 'Ms. Li', level: 'Advanced' },
    { time: '7:00 PM', program: 'Adult Contemporary', instructor: 'Mr. Park', level: 'All Levels' },
  ]},
  { day: 'Thursday', classes: [
    { time: '4:00 PM', program: 'Ballet Grade 3-4', instructor: 'Ms. Chen', level: 'Intermediate' },
    { time: '5:00 PM', program: 'Hip-Hop Advanced', instructor: 'Mr. Davis', level: 'Advanced' },
    { time: '6:30 PM', program: 'Pre-Professional Ballet', instructor: 'Ms. Chen', level: 'Pre-Prof' },
  ]},
  { day: 'Friday', classes: [
    { time: '3:30 PM', program: 'Young Dancers Creative Movement', instructor: 'Ms. Li', level: 'Ages 4-6' },
    { time: '4:30 PM', program: 'Contemporary Advanced', instructor: 'Mr. Park', level: 'Advanced' },
    { time: '6:00 PM', program: 'Adult Ballet', instructor: 'Ms. Chen', level: 'All Levels' },
  ]},
  { day: 'Saturday', classes: [
    { time: '9:00 AM', program: 'Ballet All Levels', instructor: 'Ms. Chen', level: 'Mixed' },
    { time: '10:00 AM', program: 'Chinese Dance Folk', instructor: 'Ms. Li', level: 'Intermediate' },
    { time: '11:00 AM', program: 'Jazz & Hip-Hop Combo', instructor: 'Mr. Davis', level: 'Ages 8-14' },
    { time: '1:00 PM', program: 'Open Studio', instructor: 'Various', level: 'All' },
  ]},
];

export default function SchedulePage() {
  const t = useTranslations();

  return (
    <div className="section-padding">
      <div className="container container-narrow">
        <Breadcrumbs items={[{ label: t('common.nav.classes'), href: 'classes' }]} />
        <h1 className="heading-xl mb-4">{t('classes.schedule')}</h1>
        <p className="text-lead mb-12">
          Find the perfect class time for you or your child.
        </p>

        <div className="space-y-8">
          {schedule.map((day) => (
            <Card key={day.day}>
              <CardContent className="pt-6">
                <h2 className="heading-sm mb-4 text-primary">{day.day}</h2>
                <div className="space-y-3">
                  {day.classes.map((cls) => (
                    <div key={cls.time} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-secondary w-20 shrink-0">{cls.time}</span>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{cls.program}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {cls.instructor}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0">{cls.level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
