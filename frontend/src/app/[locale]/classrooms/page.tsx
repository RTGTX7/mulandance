'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/components/ui/i18n-client';
import {
  ClassroomBooking,
  ClassroomBookingBody,
  ClassroomRoom,
  classroomApi,
} from '@/lib/api';
import { CalendarDays, CheckCircle2, Clock3, DoorOpen, Send } from 'lucide-react';

const displayOrder = [1, 2, 3, 4, 5, 6, 0];

const initialForm: ClassroomBookingBody = {
  room: 'large',
  booking_type: 'external',
  status: 'pending',
  title: '',
  teacher_name: '',
  applicant_name: '',
  applicant_contact: '',
  day_of_week: 1,
  start_time: '18:00',
  end_time: '19:00',
  notes: '',
};

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

export default function ClassroomsPage() {
  const t = useTranslations();
  const rawWeekdays = t.raw('common.weekdays.short') as string[] | undefined;
  const weekdays = useMemo(
    () => rawWeekdays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    [rawWeekdays]
  );
  const rooms: Array<{ key: ClassroomRoom; label: string; description: string; tone: string }> = useMemo(
    () => [
      {
        key: 'large',
        label: t('classroomsPage.rooms.large.label'),
        description: t('classroomsPage.rooms.large.description'),
        tone: 'border-purple-200 bg-purple-50 text-purple-800',
      },
      {
        key: 'small',
        label: t('classroomsPage.rooms.small.label'),
        description: t('classroomsPage.rooms.small.description'),
        tone: 'border-amber-200 bg-amber-50 text-amber-800',
      },
    ],
    [t]
  );

  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [form, setForm] = useState<ClassroomBookingBody>(initialForm);
  const [roomFilter, setRoomFilter] = useState<'all' | ClassroomRoom>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const loadFailedMessage = t('classroomsPage.loadFailed');
  const submitFailedMessage = t('classroomsPage.submitFailed');
  const submitSuccessMessage = t('classroomsPage.submitSuccess');

  function roomLabel(room: ClassroomRoom) {
    return rooms.find((item) => item.key === room)?.label || room;
  }

  function bookingOwner(item: ClassroomBooking) {
    return item.teacher_name || item.applicant_name || t('classroomsPage.ownerFallback');
  }

  useEffect(() => {
    classroomApi
      .list({ status: 'confirmed' })
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : loadFailedMessage))
      .finally(() => setLoading(false));
  }, [loadFailedMessage]);

  const visibleRooms = useMemo(() => {
    return roomFilter === 'all' ? rooms : rooms.filter((room) => room.key === roomFilter);
  }, [roomFilter, rooms]);

  const calendarDays = useMemo(() => {
    return displayOrder.map((day) => ({
      day,
      label: weekdays[day],
      bookings: bookings
        .filter((item) => item.day_of_week === day)
        .filter((item) => roomFilter === 'all' || item.room === roomFilter)
        .sort((a, b) =>
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time) ||
          a.room.localeCompare(b.room)
        ),
    }));
  }, [bookings, roomFilter, weekdays]);

  const groupedByRoom = useMemo(() => {
    return visibleRooms.map((room) => ({
      ...room,
      bookings: bookings
        .filter((item) => item.room === room.key)
        .sort((a, b) =>
          a.day_of_week - b.day_of_week ||
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time)
        ),
    }));
  }, [bookings, visibleRooms]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await classroomApi.create({
        ...form,
        booking_type: 'external',
        status: 'pending',
      });
      setForm({ ...initialForm, room: form.room });
      setMessage(submitSuccessMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : submitFailedMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="section-padding bg-slate-50">
      <div className="container space-y-8">
        <div className="max-w-3xl">
          <Breadcrumbs items={[{ label: t('classroomsPage.title'), href: '/classrooms' }]} />
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm">
            <DoorOpen className="h-4 w-4" />
            {t('classroomsPage.badge')}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {t('classroomsPage.title')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {t('classroomsPage.description')}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                {t('classroomsPage.calendarTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('classroomsPage.calendarHint')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={roomFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoomFilter('all')}
              >
                {t('common.ui.all')}
              </Button>
              {rooms.map((room) => (
                <Button
                  key={room.key}
                  type="button"
                  variant={roomFilter === room.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoomFilter(room.key)}
                >
                  {room.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-md border border-dashed border-slate-200 p-8 text-sm text-slate-500">
              {t('common.ui.loading')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-lg border border-slate-200">
                {calendarDays.map((day) => (
                  <div key={day.day} className="min-h-[260px] border-r border-slate-200 last:border-r-0">
                    <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                      {day.label}
                    </div>
                    <div className="space-y-2 p-3">
                      {day.bookings.length === 0 ? (
                        <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                          {t('classroomsPage.available')}
                        </div>
                      ) : (
                        day.bookings.map((item) => {
                          const room = rooms.find((entry) => entry.key === item.room) || rooms[0];
                          return (
                            <div
                              key={item.id}
                              className={`rounded-md border px-3 py-2 text-xs leading-5 ${room.tone}`}
                            >
                              <div className="flex items-center justify-between gap-2 font-semibold">
                                <span>{room.label}</span>
                                <span className="whitespace-nowrap">
                                  {item.start_time}-{item.end_time}
                                </span>
                              </div>
                              <div className="mt-1 font-medium text-slate-900">{item.title}</div>
                              <div className="text-slate-600">{bookingOwner(item)}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {groupedByRoom.map((room) => (
            <Card key={room.key} className="rounded-lg">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-purple-600" />
                    {room.label}
                  </span>
                  <Badge variant="outline">
                    {interpolate(t('classroomsPage.confirmedCount'), { count: room.bookings.length })}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-500">{room.description}</p>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-5 text-sm text-slate-500">{t('common.ui.loading')}</div>
                ) : room.bookings.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">{t('classroomsPage.emptyRoom')}</div>
                ) : (
                  <div className="divide-y">
                    {room.bookings.map((item) => (
                      <div key={item.id} className="grid gap-2 p-4 text-sm md:grid-cols-[120px_150px_1fr]">
                        <div className="font-semibold text-slate-900">{weekdays[item.day_of_week]}</div>
                        <div className="text-slate-600">
                          {item.start_time} - {item.end_time}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{item.title}</div>
                          <div className="text-slate-500">{bookingOwner(item)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarDays className="h-8 w-8 text-purple-600" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">{t('classroomsPage.introTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {t('classroomsPage.introText')}
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              {[t('classroomsPage.tipRoom'), t('classroomsPage.tipPending'), t('classroomsPage.tipNotes')].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{t('classroomsPage.formTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.room')}</span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.room}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, room: event.target.value as ClassroomRoom }))
                    }
                  >
                    {rooms.map((room) => (
                      <option key={room.key} value={room.key}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.weekday')}</span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.day_of_week}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))
                    }
                  >
                    {displayOrder.map((day) => (
                      <option key={day} value={day}>
                        {weekdays[day]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.startTime')}</span>
                  <Input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.endTime')}</span>
                  <Input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.purpose')}</span>
                  <Input
                    required
                    value={form.title}
                    placeholder={interpolate(t('classroomsPage.purposePlaceholder'), { room: roomLabel(form.room) })}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.applicant')}</span>
                  <Input
                    required
                    value={form.applicant_name || ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicant_name: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.contact')}</span>
                  <Input
                    required
                    value={form.applicant_contact || ''}
                    placeholder={t('classroomsPage.contactPlaceholder')}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicant_contact: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">{t('classroomsPage.notes')}</span>
                  <Textarea
                    rows={4}
                    value={form.notes || ''}
                    placeholder={t('classroomsPage.notesPlaceholder')}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </label>

                {message && (
                  <div className="md:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Send className="mr-2 h-4 w-4" />
                    {saving ? t('classroomsPage.submitting') : t('classroomsPage.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
