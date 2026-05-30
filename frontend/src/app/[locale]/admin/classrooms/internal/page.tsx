'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClassroomBooking,
  ClassroomBookingBody,
  ClassroomRoom,
  classroomApi,
  isAuthenticated,
} from '@/lib/api';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, Clock3, Eye } from 'lucide-react';

const roomKeys: ClassroomRoom[] = ['large', 'small'];
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const initialForm: ClassroomBookingBody = {
  room: 'large',
  booking_type: 'internal',
  status: 'confirmed',
  title: '',
  teacher_name: '',
  applicant_name: '',
  applicant_contact: '',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  notes: '',
};

function roomLabel(room: ClassroomRoom) {
  return room === 'large' ? '大教室' : '小教室';
}

function typeLabel(item: ClassroomBooking) {
  return item.booking_type === 'internal' ? '内部申请' : '已通过申请';
}

function ownerName(item: ClassroomBooking) {
  return item.teacher_name || item.applicant_name || '未填写负责人';
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

function findConflict(bookings: ClassroomBooking[], form: ClassroomBookingBody) {
  return bookings.find(
    (item) =>
      item.status === 'confirmed' &&
      item.room === form.room &&
      item.day_of_week === form.day_of_week &&
      overlaps(form.start_time, form.end_time, item.start_time, item.end_time)
  );
}

function detailRows(item: ClassroomBooking) {
  return [
    { label: '教室', value: roomLabel(item.room) },
    { label: '星期', value: weekdayLabels[item.day_of_week] },
    { label: '时间', value: `${item.start_time} - ${item.end_time}` },
    { label: '类型', value: typeLabel(item) },
    { label: '状态', value: '已通过' },
    { label: '课程 / 用途', value: item.title },
    { label: '负责人', value: ownerName(item) },
    { label: '联系方式', value: item.applicant_contact || '-' },
  ];
}

export default function InternalClassroomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [form, setForm] = useState<ClassroomBookingBody>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ClassroomBooking | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadBookings();
  }, [router, locale]);

  useEffect(() => {
    if (!selectedBooking) {
      const params = new URLSearchParams(window.location.search);
      const selectedId = params.get('id');
      const selected = bookings.find((item) => item.id === selectedId);
      if (selected) setSelectedBooking(selected);
    }
  }, [bookings, selectedBooking]);

  const confirmedBookings = useMemo(
    () =>
      bookings
        .filter((item) => item.status === 'confirmed')
        .sort((a, b) =>
          a.day_of_week - b.day_of_week ||
          a.start_time.localeCompare(b.start_time) ||
          a.room.localeCompare(b.room)
        ),
    [bookings]
  );

  const conflict = useMemo(() => findConflict(bookings, form), [bookings, form]);
  const invalidTime = form.start_time >= form.end_time;

  function loadBookings() {
    setLoading(true);
    classroomApi
      .list({ status: 'confirmed' })
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : '加载内部申请失败'))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (invalidTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }
    if (conflict) {
      setError(`${roomLabel(conflict.room)} ${weekdayLabels[conflict.day_of_week]} ${conflict.start_time}-${conflict.end_time} 已有安排`);
      return;
    }

    setSaving(true);
    try {
      await classroomApi.create({
        ...form,
        booking_type: 'internal',
        status: 'confirmed',
        applicant_name: form.teacher_name || form.applicant_name,
      });
      setForm(initialForm);
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存内部申请失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <CalendarClock className="h-6 w-6 text-primary" />
              内部申请
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">新增内部教室使用，并参考所有已通过的教室占用。</p>
          </div>
          <BackButton fallbackRoute={`/${locale}/admin/classrooms`} className="shrink-0" />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                新增内部教室使用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    教室
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.room}
                      onChange={(event) => setForm({ ...form, room: event.target.value as ClassroomRoom })}
                    >
                      {roomKeys.map((room) => (
                        <option key={room} value={room}>{roomLabel(room)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    星期
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.day_of_week}
                      onChange={(event) => setForm({ ...form, day_of_week: Number(event.target.value) })}
                    >
                      {weekdayLabels.map((label, index) => (
                        <option key={label} value={index}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    开始时间
                    <Input
                      type="time"
                      value={form.start_time}
                      onChange={(event) => setForm({ ...form, start_time: event.target.value })}
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    结束时间
                    <Input
                      type="time"
                      value={form.end_time}
                      onChange={(event) => setForm({ ...form, end_time: event.target.value })}
                      required
                    />
                  </label>
                </div>

                {(invalidTime || conflict) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {invalidTime
                      ? '结束时间必须晚于开始时间'
                      : `${roomLabel(conflict!.room)} ${weekdayLabels[conflict!.day_of_week]} ${conflict!.start_time}-${conflict!.end_time} 已有安排`}
                  </div>
                )}

                <label className="space-y-1 text-sm font-medium">
                  课程 / 用途
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  负责人
                  <Input
                    value={form.teacher_name || ''}
                    onChange={(event) => setForm({ ...form, teacher_name: event.target.value })}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  联系方式
                  <Input
                    value={form.applicant_contact || ''}
                    onChange={(event) => setForm({ ...form, applicant_contact: event.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  备注
                  <Textarea
                    rows={4}
                    value={form.notes || ''}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  />
                </label>

                <Button type="submit" className="w-full" disabled={saving || invalidTime || Boolean(conflict)}>
                  {saving ? '保存中...' : '保存内部申请'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>已通过教室占用</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">加载中...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">教室</th>
                        <th className="py-2 pr-3 font-medium">星期</th>
                        <th className="py-2 pr-3 font-medium">时间</th>
                        <th className="py-2 pr-3 font-medium">类型</th>
                        <th className="py-2 pr-3 font-medium">课程 / 用途</th>
                        <th className="py-2 pr-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedBookings.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer border-b align-top transition-colors last:border-0 hover:bg-slate-50"
                          onClick={() => setSelectedBooking(item)}
                        >
                          <td className="py-3 pr-3 font-medium">{roomLabel(item.room)}</td>
                          <td className="py-3 pr-3">{weekdayLabels[item.day_of_week]}</td>
                          <td className="whitespace-nowrap py-3 pr-3">{item.start_time} - {item.end_time}</td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.booking_type === 'internal'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {typeLabel(item)}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{ownerName(item)}</div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedBooking(item);
                                }}
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {confirmedBookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">暂无已通过教室占用</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBooking?.booking_type === 'internal' ? '内部申请详情' : '已通过申请详情'}</DialogTitle>
              <DialogDescription>查看完整教室使用信息。</DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {detailRows(selectedBooking).map((row) => (
                    <div key={row.label} className="rounded-md border bg-slate-50 p-3">
                      <div className="text-xs font-medium text-slate-500">{row.label}</div>
                      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-950">{row.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border bg-white p-3">
                  <div className="text-xs font-medium text-slate-500">备注 / 详细信息</div>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-800">
                    {selectedBooking.notes || '-'}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
