'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClassroomBooking,
  ClassroomBookingBody,
  ClassroomBookingStatus,
  ClassroomBookingType,
  ClassroomRoom,
  classroomApi,
  isAuthenticated,
} from '@/lib/api';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/components/ui/i18n-client';
import { CalendarClock, CheckCircle2, Clock3, DoorOpen, Trash2 } from 'lucide-react';

const roomKeys: ClassroomRoom[] = ['large', 'small'];
const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const initialForm: ClassroomBookingBody = {
  room: 'large',
  booking_type: 'internal',
  status: 'confirmed',
  title: '',
  teacher_name: '',
  applicant_name: '',
  applicant_contact: '',
  day_of_week: 1,
  start_time: '17:00',
  end_time: '18:00',
  notes: '',
};

export default function AdminClassroomsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [form, setForm] = useState<ClassroomBookingBody>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const weekdays = weekdayKeys.map((key) => t(`admin.classrooms.weekdays.${key}`));
  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) =>
        a.day_of_week - b.day_of_week ||
        a.start_time.localeCompare(b.start_time) ||
        a.room.localeCompare(b.room)
      ),
    [bookings]
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadBookings();
  }, [router, locale]);

  function roomLabel(room: ClassroomRoom) {
    return t(`admin.classrooms.rooms.${room}`);
  }

  function statusLabel(status: ClassroomBookingStatus) {
    return t(`admin.classrooms.status.${status}`);
  }

  function typeLabel(type: ClassroomBookingType) {
    return t(`admin.classrooms.types.${type}`);
  }

  function loadBookings() {
    setLoading(true);
    classroomApi
      .list()
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : t('admin.classrooms.loadFailed')))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: ClassroomBookingBody = {
        ...form,
        status: form.booking_type === 'external' ? 'pending' : 'confirmed',
      };
      await classroomApi.create(body);
      setForm({ ...initialForm, room: form.room });
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.classrooms.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: ClassroomBooking, status: ClassroomBookingStatus) {
    setError('');
    try {
      await classroomApi.update(item.id, { status });
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.classrooms.updateFailed'));
    }
  }

  async function removeBooking(item: ClassroomBooking) {
    if (!window.confirm(t('admin.classrooms.deleteConfirm').replace('{title}', item.title))) return;
    setError('');
    try {
      await classroomApi.remove(item.id);
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.classrooms.deleteFailed'));
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-primary" />
            {t('admin.classrooms.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.classrooms.subtitle')}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              {t('admin.classrooms.addTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.room')}</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.room}
                  onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value as ClassroomRoom }))}
                >
                  {roomKeys.map((room) => (
                    <option key={room} value={room}>{roomLabel(room)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.type')}</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.booking_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, booking_type: e.target.value as ClassroomBookingType }))}
                >
                  <option value="internal">{typeLabel('internal')}</option>
                  <option value="external">{typeLabel('external')}</option>
                </select>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.title')}</span>
                <Input required value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.weekday')}</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.day_of_week}
                  onChange={(e) => setForm((prev) => ({ ...prev, day_of_week: Number(e.target.value) }))}
                >
                  {weekdays.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.start')}</span>
                <Input type="time" required value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.end')}</span>
                <Input type="time" required value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.owner')}</span>
                <Input value={form.teacher_name || ''} onChange={(e) => setForm((prev) => ({ ...prev, teacher_name: e.target.value }))} />
              </label>

              {form.booking_type === 'external' && (
                <>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.applicant')}</span>
                    <Input value={form.applicant_name || ''} onChange={(e) => setForm((prev) => ({ ...prev, applicant_name: e.target.value }))} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.contact')}</span>
                    <Input value={form.applicant_contact || ''} onChange={(e) => setForm((prev) => ({ ...prev, applicant_contact: e.target.value }))} />
                  </label>
                </>
              )}

              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{t('admin.classrooms.fields.notes')}</span>
                <Input value={form.notes || ''} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </label>

              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? t('admin.classrooms.saving') : t('admin.classrooms.addToTable')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {roomKeys.map((room) => {
            const roomBookings = sortedBookings.filter((item) => item.room === room);

            return (
              <Card key={room}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-primary" />
                    {roomLabel(room)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">{t('admin.common.loading')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.weekday')}</th>
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.time')}</th>
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.title')}</th>
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.type')}</th>
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.status')}</th>
                            <th className="py-2 pr-3 font-medium">{t('admin.classrooms.fields.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomBookings.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 align-top">
                              <td className="py-3 pr-3 font-medium">{weekdays[item.day_of_week]}</td>
                              <td className="py-3 pr-3 whitespace-nowrap">{item.start_time} - {item.end_time}</td>
                              <td className="py-3 pr-3">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.teacher_name || item.applicant_name || t('admin.classrooms.noOwner')}
                                  {item.applicant_contact ? ` / ${item.applicant_contact}` : ''}
                                </div>
                                {item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
                              </td>
                              <td className="py-3 pr-3">{typeLabel(item.booking_type)}</td>
                              <td className="py-3 pr-3">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  item.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : item.status === 'pending'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {statusLabel(item.status)}
                                </span>
                              </td>
                              <td className="py-3 pr-3">
                                <div className="flex gap-2">
                                  {item.status !== 'confirmed' && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(item, 'confirmed')} title={t('admin.classrooms.approve')}>
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => removeBooking(item)} title={t('admin.common.delete')}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {roomBookings.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                {t('admin.classrooms.empty')}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
