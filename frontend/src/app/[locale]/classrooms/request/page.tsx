'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/components/ui/i18n-client';
import {
  ClassroomBooking,
  ClassroomBookingBody,
  ClassroomCaptcha,
  ClassroomRoom,
  classroomApi,
} from '@/lib/api';
import { ArrowLeft, CheckCircle2, ClipboardList, RefreshCw, Send } from 'lucide-react';

type DetailForm = {
  attendees: string;
  activity_description: string;
  equipment_needs: string;
  special_requests: string;
  notes: string;
};

const initialDetails: DetailForm = {
  attendees: '',
  activity_description: '',
  equipment_needs: '',
  special_requests: '',
  notes: '',
};

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

function receiptMessage(t: ReturnType<typeof useTranslations>, status: string, email?: string) {
  if (status === 'sent' && email) {
    return interpolate(t('classroomsPage.receiptSent'), { email });
  }
  if (status === 'not_requested') return t('classroomsPage.receiptNotRequested');
  if (status === 'not_configured') return t('classroomsPage.receiptNotConfigured');
  if (status === 'failed') return t('classroomsPage.receiptFailed');
  return t('classroomsPage.submitSuccess');
}

function findTimeConflict(bookings: ClassroomBooking[], basic: ClassroomBookingBody) {
  return bookings.find(
    (item) =>
      item.status === 'confirmed' &&
      item.room === basic.room &&
      item.day_of_week === basic.day_of_week &&
      item.start_time < basic.end_time &&
      item.end_time > basic.start_time
  );
}

export default function ClassroomRequestPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const rawWeekdays = t.raw('common.weekdays.short') as string[] | undefined;
  const weekdays = useMemo(
    () => rawWeekdays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    [rawWeekdays]
  );
  const roomLabels: Record<ClassroomRoom, string> = {
    large: t('classroomsPage.rooms.large.label'),
    small: t('classroomsPage.rooms.small.label'),
  };

  const [basic, setBasic] = useState<ClassroomBookingBody | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<ClassroomBooking[]>([]);
  const [details, setDetails] = useState<DetailForm>(initialDetails);
  const [captcha, setCaptcha] = useState<ClassroomCaptcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('classroom_request_basic');
      if (!saved) return;
      setBasic(JSON.parse(saved) as ClassroomBookingBody);
    } catch {
      setBasic(null);
    }
  }, []);

  useEffect(() => {
    classroomApi
      .list({ status: 'confirmed' })
      .then(setConfirmedBookings)
      .catch(() => setConfirmedBookings([]));
  }, []);

  const selectedConflict = useMemo(
    () => (basic ? findTimeConflict(confirmedBookings, basic) : undefined),
    [basic, confirmedBookings]
  );

  function refreshCaptcha() {
    classroomApi
      .captcha()
      .then((nextCaptcha) => {
        setCaptcha(nextCaptcha);
        setCaptchaAnswer('');
      })
      .catch(() => setCaptcha(null));
  }

  useEffect(() => {
    refreshCaptcha();
  }, []);

  function setDetail<K extends keyof DetailForm>(key: K, value: DetailForm[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function buildNotes() {
    return [
      `基础备注: ${basic?.notes || '-'}`,
      `人数: ${details.attendees || '-'}`,
      `活动说明: ${details.activity_description || '-'}`,
      `设备需求: ${details.equipment_needs || '-'}`,
      `特殊要求: ${details.special_requests || '-'}`,
      `备注: ${details.notes || '-'}`,
    ].join('\n');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!basic) {
      setError('请先返回租教室页面填写基础信息。');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (!details.attendees.trim() || !details.activity_description.trim()) {
        setError('请填写人数和活动说明。');
        return;
      }
      const conflict = findTimeConflict(confirmedBookings, basic);
      if (conflict) {
        setError(
          `${roomLabels[basic.room as ClassroomRoom]} ${weekdays[basic.day_of_week]} ${conflict.start_time}-${conflict.end_time} 已被占用，请返回选择其他时间。`
        );
        return;
      }
      if (!captcha?.token || !captchaAnswer.trim()) {
        setError(t('classroomsPage.captchaRequired'));
        return;
      }

      const response = await classroomApi.create({
        ...basic,
        booking_type: 'external',
        status: 'pending',
        notes: buildNotes(),
        captcha_token: captcha.token,
        captcha_answer: captchaAnswer.trim(),
      });

      sessionStorage.removeItem('classroom_request_basic');
      setMessage(receiptMessage(t, response.receipt_status, response.receipt_email));
    } catch (err) {
      const nextMessage = err instanceof Error ? err.message : t('classroomsPage.submitFailed');
      if (nextMessage.includes('Captcha') || nextMessage.includes('captcha')) {
        refreshCaptcha();
        setError(t('classroomsPage.captchaFailed'));
      } else {
        setError(
          nextMessage.includes('rental request limit')
            ? t('classroomsPage.contactLimitExceeded')
            : nextMessage
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pt-16">
      <main className="container py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">租借详细信息</h1>
            <p className="mt-1 text-sm text-slate-500">
              补充活动人数、用途和设备需求。提交此页后才会发送到后台。
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${locale}/classrooms#book`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回修改
            </Link>
          </Button>
        </div>

        {!basic ? (
          <Card>
            <CardContent className="py-8 text-sm text-slate-600">
              请先从租教室页面填写基础信息后再进入详细申请。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  已填写基础信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border bg-slate-50 p-3">
                  <div className="text-slate-500">教室</div>
                  <div className="font-medium text-slate-950">{roomLabels[basic.room as ClassroomRoom]}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border bg-slate-50 p-3">
                    <div className="text-slate-500">星期</div>
                    <div className="font-medium text-slate-950">{weekdays[basic.day_of_week]}</div>
                  </div>
                  <div className="rounded-md border bg-slate-50 p-3">
                    <div className="text-slate-500">时间</div>
                    <div className="font-medium text-slate-950">
                      {basic.start_time} - {basic.end_time}
                    </div>
                  </div>
                </div>
                <div className="rounded-md border bg-slate-50 p-3">
                  <div className="text-slate-500">用途 / 活动名称</div>
                  <div className="font-medium text-slate-950">{basic.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border bg-slate-50 p-3">
                    <div className="text-slate-500">申请人</div>
                    <div className="font-medium text-slate-950">{basic.applicant_name}</div>
                  </div>
                  <div className="rounded-md border bg-slate-50 p-3">
                    <div className="text-slate-500">联系方式</div>
                    <div className="font-medium text-slate-950">{basic.applicant_contact}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>详细申请表</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  {selectedConflict && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      当前选择的时间已经被占用：
                      {selectedConflict.start_time}-{selectedConflict.end_time}，{selectedConflict.title}。
                      请返回修改时间。
                    </div>
                  )}
                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <span>{message}</span>
                    </div>
                  )}

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      预计人数 <span className="text-red-500">*</span>
                    </span>
                    <Input
                      required
                      value={details.attendees}
                      placeholder="例如：12人，其中8名学生、4名家长"
                      onChange={(event) => setDetail('attendees', event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      活动说明 <span className="text-red-500">*</span>
                    </span>
                    <Textarea
                      required
                      rows={4}
                      value={details.activity_description}
                      placeholder="说明活动内容、是否有音乐/排练/拍摄/公开活动等"
                      onChange={(event) => setDetail('activity_description', event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">设备需求</span>
                    <Textarea
                      rows={3}
                      value={details.equipment_needs}
                      placeholder="音响、镜子、把杆、桌椅、投影等"
                      onChange={(event) => setDetail('equipment_needs', event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">特殊要求</span>
                    <Textarea
                      rows={3}
                      value={details.special_requests}
                      placeholder="入场时间、清洁、保险、付款方式或其他需求"
                      onChange={(event) => setDetail('special_requests', event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">补充备注</span>
                    <Textarea
                      rows={3}
                      value={details.notes}
                      placeholder="其他想让管理员知道的信息"
                      onChange={(event) => setDetail('notes', event.target.value)}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">
                      {t('classroomsPage.captcha')} <span className="text-red-500">*</span>
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex h-10 min-w-[140px] items-center justify-center rounded-md border bg-slate-50 px-3 text-sm font-semibold text-slate-900">
                        {captcha?.question || t('common.ui.loading')}
                      </div>
                      <Input
                        required
                        inputMode="numeric"
                        value={captchaAnswer}
                        placeholder={t('classroomsPage.captchaPlaceholder')}
                        onChange={(event) => setCaptchaAnswer(event.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={refreshCaptcha} className="shrink-0">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('classroomsPage.refreshCaptcha')}
                      </Button>
                    </div>
                  </label>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || Boolean(message) || Boolean(selectedConflict)}>
                      <Send className="mr-2 h-4 w-4" />
                      {saving ? t('classroomsPage.submitting') : '提交详细申请'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
