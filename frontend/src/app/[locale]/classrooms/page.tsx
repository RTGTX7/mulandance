'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ClassroomBooking,
  ClassroomBookingBody,
  ClassroomRoom,
  classroomApi,
} from '@/lib/api';
import { CalendarDays, CheckCircle2, Clock3, DoorOpen, Send } from 'lucide-react';

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const rooms: Array<{ key: ClassroomRoom; label: string; description: string }> = [
  { key: 'large', label: '大教室', description: '适合排练、集体课、工作坊和小型活动。' },
  { key: 'small', label: '小教室', description: '适合私教、小组排练、面试和安静练习。' },
];

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

function roomLabel(room: ClassroomRoom) {
  return rooms.find((item) => item.key === room)?.label || room;
}

export default function ClassroomsPage() {
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [form, setForm] = useState<ClassroomBookingBody>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    classroomApi
      .list({ status: 'confirmed' })
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : '教室时间表加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const bookingsByRoom = useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      bookings: bookings
        .filter((item) => item.room === room.key)
        .sort((a, b) =>
          a.day_of_week - b.day_of_week ||
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time)
        ),
    }));
  }, [bookings]);

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
      setMessage('申请已提交。管理员确认后会显示在教室时间表中。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="section-padding bg-slate-50">
      <div className="container space-y-8">
        <div className="max-w-3xl">
          <Breadcrumbs items={[{ label: '教室使用', href: '/classrooms' }]} />
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-sm font-medium text-purple-700 shadow-sm">
            <DoorOpen className="h-4 w-4" />
            教室 Time Table
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            教室使用与对外租借
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            查看大教室、小教室已确认的使用时间。外部租借可以在页面下方提交申请，管理员审核后再确认。
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {bookingsByRoom.map((room) => (
            <Card key={room.key} className="overflow-hidden rounded-lg">
              <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-purple-600" />
                    {room.label}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {room.bookings.length} 个已确认时段
                  </span>
                </CardTitle>
                <p className="text-sm text-slate-500">{room.description}</p>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 text-sm text-slate-500">加载中...</div>
                ) : room.bookings.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">暂无已确认使用记录。</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3 font-medium">星期</th>
                          <th className="px-4 py-3 font-medium">时间</th>
                          <th className="px-4 py-3 font-medium">用途</th>
                          <th className="px-4 py-3 font-medium">负责人</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.bookings.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {weekdays[item.day_of_week]}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                              {item.start_time} - {item.end_time}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{item.title}</td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.teacher_name || item.applicant_name || '管理员'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <CalendarDays className="h-8 w-8 text-purple-600" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">对外租借申请</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              填写申请后会进入后台“教室使用”页面，管理员可以审核、确认或删除。确认后该时段会自动出现在公开时间表。
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                可选择大教室或小教室
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                申请默认进入待审核状态
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                请在备注中写明活动人数、用途和特殊设备需求
              </div>
            </div>
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>提交租借申请</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">教室</span>
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
                  <span className="text-sm font-medium text-slate-700">星期</span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.day_of_week}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))
                    }
                  >
                    {weekdays.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">开始时间</span>
                  <Input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">结束时间</span>
                  <Input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">用途 / 活动名称</span>
                  <Input
                    required
                    value={form.title}
                    placeholder={`${roomLabel(form.room)}租借、排练、工作坊等`}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">申请人</span>
                  <Input
                    required
                    value={form.applicant_name || ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicant_name: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">联系方式</span>
                  <Input
                    required
                    value={form.applicant_contact || ''}
                    placeholder="电话或邮箱"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, applicant_contact: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">备注</span>
                  <Input
                    value={form.notes || ''}
                    placeholder="人数、用途、设备需求等"
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
                    {saving ? '提交中...' : '提交申请'}
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
