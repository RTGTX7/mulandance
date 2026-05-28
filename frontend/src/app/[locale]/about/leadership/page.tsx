'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from '@/components/ui/i18n-client';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FacultyMember, facultyApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function splitLines(value?: string) {
  return (value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function LeadershipPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const href = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  useEffect(() => {
    facultyApi
      .list()
      .then(setFaculty)
      .catch(() => setFaculty([]))
      .finally(() => setLoading(false));
  }, []);

  const sortedFaculty = useMemo(
    () => [...faculty].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name)),
    [faculty]
  );

  return (
    <div className="pt-16">
      <section className="relative h-[300px] overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 px-4 text-center text-white">
            <Breadcrumbs
              items={[
                { label: t('common.nav.about'), href: '/about' },
                { label: t('about.leadership.title'), href: '/about/leadership' },
              ]}
            />
            <h1 className="heading-xl mb-4 text-white">{t('about.leadership.title')}</h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              {t('about.leadership.founderRole')}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading faculty...
            </div>
          ) : sortedFaculty.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              Faculty profiles are being updated.
            </div>
          ) : (
            <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sortedFaculty.map((member) => {
                const specialties = splitLines(member.specialties);
                const achievements = splitLines(member.achievements);

                return (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="items-center text-center">
                      <div className="mb-4 h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                            {member.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <CardTitle>{member.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      {member.role && (
                        <p className="mb-2 text-sm font-semibold text-primary">{member.role}</p>
                      )}
                      {member.bio && <p className="text-muted-foreground">{member.bio}</p>}

                      {specialties.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {specialties.map((item) => (
                            <span key={item} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {achievements.length > 0 && (
                        <div className="mt-5 text-left">
                          <h4 className="mb-2 font-semibold text-foreground">Achievements</h4>
                          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {achievements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link href={href('about/contact')}>
              <Button size="lg">{t('about.contact.title')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
