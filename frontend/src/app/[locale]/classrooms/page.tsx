'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/components/ui/i18n-client';
import {
  ClassroomCaptcha,
  ExternalRentalRequestBody,
  PublicRentalResource,
  RoomOccupancy,
  classroomApi,
  unifiedScheduleApi,
} from '@/lib/api';

const displayOrder = [1, 2, 3, 4, 5, 6, 0];
const isoFromLocalDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const isoToday = () => isoFromLocalDate(new Date());
const dateFromIso = (value: string) => new Date(`${value}T12:00:00`);
const isoFromDate = (value: Date) => value.toISOString().slice(0, 10);
const addDays = (value: string, amount: number) => {
  const next = dateFromIso(value);
  next.setDate(next.getDate() + amount);
  return isoFromDate(next);
};
const addMonths = (value: string, amount: number) => {
  const next = dateFromIso(value);
  next.setMonth(next.getMonth() + amount);
  return isoFromDate(next);
};
const startOfWeek = (value: string) => {
  const day = dateFromIso(value).getDay();
  return addDays(value, -((day + 6) % 7));
};
const startOfMonthGrid = (value: string) => {
  const first = `${value.slice(0, 8)}01`;
  return startOfWeek(first);
};
const startOfMonth = (value: string) => `${value.slice(0, 8)}01`;
const sixMonthsFromToday = () => {
  const value = new Date();
  value.setMonth(value.getMonth() + 6);
  return isoFromLocalDate(value);
};
const laterOf = (first: string, second: string) => first > second ? first : second;
const earlierOf = (first: string, second: string) => first < second ? first : second;

export default function ClassroomsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const weekdays = (t.raw('common.weekdays.short') as string[] | undefined) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [resources, setResources] = useState<PublicRentalResource[]>([]);
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(isoToday);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState<ClassroomCaptcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<ExternalRentalRequestBody>({
    room_id: '',
    request_mode: 'single',
    date: isoToday(),
    start_date: null,
    end_date: null,
    days_of_week: [],
    start_time: '18:00',
    end_time: '19:00',
    title: '',
    applicant_name: '',
    applicant_contact: '',
    notes: '',
  });

  const today = isoToday();
  const maximumDate = sixMonthsFromToday();
  const calendarGridStart = calendarMode === 'week' ? startOfWeek(calendarDate) : startOfMonthGrid(calendarDate);
  const calendarGridEnd = addDays(calendarGridStart, calendarMode === 'week' ? 6 : 41);
  const calendarQueryStart = laterOf(calendarGridStart, today);
  const calendarQueryEnd = earlierOf(calendarGridEnd, maximumDate);
  const calendarDays = useMemo(
    () => Array.from({ length: calendarMode === 'week' ? 7 : 42 }, (_, index) => addDays(calendarGridStart, index)),
    [calendarGridStart, calendarMode],
  );
  const canGoPrevious = calendarGridStart > startOfWeek(today);
  const nextAnchor = calendarMode === 'week' ? addDays(calendarDate, 7) : addMonths(calendarDate, 1);
  const canGoNext = nextAnchor <= maximumDate;

  const loadPublicSchedule = async () => {
    if (calendarQueryStart > calendarQueryEnd) return;
    setLoading(true);
    setError('');
    try {
      const [nextResources, nextOccupancy] = await Promise.all([
        unifiedScheduleApi.rentalResources(),
        unifiedScheduleApi.roomOccupancy(calendarQueryStart, calendarQueryEnd),
      ]);
      setResources(nextResources);
      setOccupancy(nextOccupancy);
      setForm((current) => ({ ...current, room_id: current.room_id || nextResources[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('classroomsPage.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const refreshCaptcha = () => {
    classroomApi.captcha().then((value) => {
      setCaptcha(value);
      setCaptchaAnswer('');
    }).catch(() => setCaptcha(null));
  };

  useEffect(() => { void loadPublicSchedule(); }, [calendarGridStart, calendarMode]);
  useEffect(() => { refreshCaptcha(); }, []);

  const occupancyByDate = useMemo(() => {
    const grouped = new Map<string, RoomOccupancy[]>();
    occupancy.forEach((item) => grouped.set(item.date, [...(grouped.get(item.date) || []), item]));
    grouped.forEach((items) => items.sort((first, second) => first.start_time.localeCompare(second.start_time) || first.room_name.localeCompare(second.room_name)));
    return grouped;
  }, [occupancy]);

  const setField = <K extends keyof ExternalRentalRequestBody>(key: K, value: ExternalRentalRequestBody[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
    setError('');
  };

  const toggleWeekday = (day: number) => {
    const days = form.days_of_week.includes(day)
      ? form.days_of_week.filter((value) => value !== day)
      : [...form.days_of_week, day].sort((a, b) => a - b);
    setField('days_of_week', days);
  };

  const friendlySubmitError = (err: unknown) => {
    const detail = err instanceof Error ? err.message : '';
    const normalized = detail.toLowerCase();
    if (normalized.includes('captcha')) return t('classroomsPage.captchaFailed');
    if (normalized.includes('occupied') || normalized.includes('conflict') || normalized.includes('unavailable')) {
      return t('classroomsPage.timeUnavailable');
    }
    if (normalized.includes('rental request limit')) return t('classroomsPage.contactLimitExceeded');
    return t('classroomsPage.submitFailed');
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!form.room_id || !form.title.trim() || !form.applicant_name.trim() || !form.applicant_contact.trim()) {
        throw new Error(t('classroomsPage.requiredFields'));
      }
      if (!captcha?.token || !captchaAnswer.trim()) {
        throw new Error(t('classroomsPage.captchaRequired'));
      }
      if (form.request_mode === 'weekly' && (!form.start_date || !form.end_date || form.days_of_week.length === 0)) {
        throw new Error(t('classroomsPage.weeklyFieldsRequired'));
      }
      await unifiedScheduleApi.createExternalRentalRequest({
        ...form,
        title: form.title.trim(),
        applicant_name: form.applicant_name.trim(),
        applicant_contact: form.applicant_contact.trim(),
        notes: form.notes.trim(),
        captcha_token: captcha.token,
        captcha_answer: captchaAnswer.trim(),
      });
      setMessage(t('classroomsPage.submitSuccess'));
      setForm((current) => ({ ...current, title: '', applicant_name: '', applicant_contact: '', notes: '' }));
      refreshCaptcha();
      await loadPublicSchedule();
    } catch (err) {
      setError(friendlySubmitError(err));
      refreshCaptcha();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-16">
      <PageHero
        breadcrumbLabel={t('classroomsPage.title')}
        breadcrumbHref="/classrooms"
        title={t('classroomsPage.title')}
        subtitle={t('classroomsPage.description')}
      />

      <main className="section-padding bg-slate-100">
        <div className="container space-y-8">
          <section id="schedule" className="content-glass-section scroll-mt-24 p-4 md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                  {t('classroomsPage.calendarTitle')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t('classroomsPage.calendarHint')}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="w-[150px] text-xs font-medium text-slate-600">
                  {t('classroomsPage.date')}
                  <Input className="mt-1" type="date" min={today} max={maximumDate} value={calendarDate} onChange={(event) => setCalendarDate(earlierOf(maximumDate, laterOf(today, event.target.value || today)))} />
                </label>
                <Button title={t('classroomsPage.previous')} aria-label={t('classroomsPage.previous')} type="button" size="icon" variant="outline" disabled={!canGoPrevious} onClick={() => setCalendarDate((current) => calendarMode === 'week' ? addDays(current, -7) : addMonths(current, -1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button title={t('classroomsPage.next')} aria-label={t('classroomsPage.next')} type="button" size="icon" variant="outline" disabled={!canGoNext} onClick={() => setCalendarDate(nextAnchor)}><ChevronRight className="h-4 w-4" /></Button>
                <div className="flex rounded-md border p-1">
                  <Button type="button" size="sm" variant={calendarMode === 'week' ? 'default' : 'ghost'} onClick={() => setCalendarMode('week')}>{t('classroomsPage.week')}</Button>
                  <Button type="button" size="sm" variant={calendarMode === 'month' ? 'default' : 'ghost'} onClick={() => setCalendarMode('month')}>{t('classroomsPage.month')}</Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-md border border-dashed border-slate-200 p-8 text-sm text-slate-500">{t('common.ui.loading')}</div>
            ) : resources.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{t('classroomsPage.noRentableRooms')}</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-md border bg-slate-200">
                  {displayOrder.map((day) => <div key={day} className="bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-600">{weekdays[day]}</div>)}
                  {calendarDays.map((day) => {
                    const isPast = day < today;
                    const isBeyondLimit = day > maximumDate;
                    const outsideMonth = calendarMode === 'month' && day.slice(0, 7) !== calendarDate.slice(0, 7);
                    const items = occupancyByDate.get(day) || [];
                    return <div key={day} className={`min-h-[150px] bg-white p-2 ${isPast || isBeyondLimit || outsideMonth ? 'bg-slate-50 text-slate-400' : ''}`}>
                      <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold">{day.slice(5)}</span>{items.length > 0 && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{items.length}</Badge>}</div>
                      <div className="space-y-1">
                        {items.map((item) => <div key={`${item.room_id}-${item.start_time}-${item.end_time}`} className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] leading-4 text-purple-900"><span className="block font-semibold">{item.start_time} - {item.end_time}</span><span className="block truncate">{item.room_name}</span></div>)}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
            )}
          </section>

          <section id="book" className="scroll-mt-24 grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="content-glass-section p-5 md:p-6">
              <CalendarDays className="h-8 w-8 text-purple-600" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{t('classroomsPage.introTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t('classroomsPage.introText')}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                {[t('classroomsPage.tipReview'), t('classroomsPage.tipContact'), t('classroomsPage.tipApproval'), t('classroomsPage.tipInternal')].map((tip) => (
                  <div key={tip} className="flex items-start gap-2 leading-6"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{tip}</span></div>
                ))}
              </div>
            </div>

            <Card className="rounded-lg">
              <CardHeader><CardTitle>{t('classroomsPage.formTitle')}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {error && <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                  {message && <div className="md:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.room')}</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.room_id} onChange={(event) => setField('room_id', event.target.value)}>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.studio_name} / {resource.name}</option>)}</select></label>
                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.requestMode')}</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.request_mode} onChange={(event) => setField('request_mode', event.target.value as ExternalRentalRequestBody['request_mode'])}><option value="single">{t('classroomsPage.singleDate')}</option><option value="weekly">{t('classroomsPage.weekly')}</option></select></label>

                  {form.request_mode === 'single' ? (
                    <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.date')}</span><Input type="date" min={today} max={maximumDate} required value={form.date || ''} onChange={(event) => setField('date', event.target.value)} /></label>
                  ) : (
                    <>
                      <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.rangeStart')}</span><Input type="date" min={today} max={maximumDate} required value={form.start_date || ''} onChange={(event) => setField('start_date', event.target.value)} /></label>
                      <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.rangeEnd')}</span><Input type="date" min={form.start_date || today} max={maximumDate} required value={form.end_date || ''} onChange={(event) => setField('end_date', event.target.value)} /></label>
                      <div className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.weekdays')}</span><div className="flex flex-wrap gap-2">{displayOrder.map((day) => <label key={day} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={form.days_of_week.includes(day)} onChange={() => toggleWeekday(day)} />{weekdays[day]}</label>)}</div></div>
                    </>
                  )}

                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.startTime')}</span><Input type="time" required value={form.start_time} onChange={(event) => setField('start_time', event.target.value)} /></label>
                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.endTime')}</span><Input type="time" required value={form.end_time} onChange={(event) => setField('end_time', event.target.value)} /></label>
                  <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.purpose')}</span><Input required value={form.title} placeholder={t('classroomsPage.purposePlaceholder')} onChange={(event) => setField('title', event.target.value)} /></label>
                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.applicant')}</span><Input required value={form.applicant_name} onChange={(event) => setField('applicant_name', event.target.value)} /></label>
                  <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.contact')}</span><Input required value={form.applicant_contact} placeholder={t('classroomsPage.contactPlaceholder')} onChange={(event) => setField('applicant_contact', event.target.value)} /></label>
                  <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.notes')}</span><Textarea value={form.notes} placeholder={t('classroomsPage.notesPlaceholder')} onChange={(event) => setField('notes', event.target.value)} /></label>
                  <div className="md:col-span-2 rounded-md border bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-700">{t('classroomsPage.captcha')}</span><Button type="button" variant="ghost" size="sm" onClick={refreshCaptcha}>{t('classroomsPage.refreshCaptcha')}</Button></div><div className="flex items-center gap-3"><span className="font-mono text-sm">{captcha?.question || '...'}</span><Input className="max-w-[140px]" value={captchaAnswer} placeholder={t('classroomsPage.captchaPlaceholder')} onChange={(event) => setCaptchaAnswer(event.target.value)} /></div></div>
                  <div className="flex justify-end md:col-span-2"><Button type="submit" disabled={saving || resources.length === 0}><Send className="mr-2 h-4 w-4" />{saving ? t('classroomsPage.submitting') : t('classroomsPage.submit')}</Button></div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
