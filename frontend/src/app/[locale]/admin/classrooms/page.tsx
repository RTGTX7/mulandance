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
import { CalendarClock, CheckCircle2, Clock3, DoorOpen, Trash2 } from 'lucide-react';

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const rooms: Array<{ key: ClassroomRoom; label: string }> = [
  { key: 'large', label: '大教室' },
  { key: 'small', label: '小教室' },
];

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

function statusLabel(status: ClassroomBookingStatus) {
  if (status === 'confirmed') return '已确认';
  if (status === 'pending') return '待审核';
  return '已拒绝';
}

function typeLabel(type: ClassroomBookingType) {
  return type === 'internal' ? '内部老师分配' : '外部申请';
}

export default function AdminClassroomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [form, setForm] = useState<ClassroomBookingBody>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  function loadBookings() {
    setLoading(true);
    classroomApi
      .list()
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
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
      setError(err instanceof Error ? err.message : '保存失败');
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
      setError(err instanceof Error ? err.message : '更新失败');
    }
  }

  async function removeBooking(item: ClassroomBooking) {
    if (!window.confirm(`删除「${item.title}」吗？`)) return;
    setError('');
    try {
      await classroomApi.remove(item.id);
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
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
            教室使用 Time Table
          </h1>
          <p className="text-sm text-muted-foreground">
            管理大教室、小教室的内部老师分配和外部场地申请。
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
              新增教室使用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">教室</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.room}
                  onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value as ClassroomRoom }))}
                >
                  {rooms.map((room) => (
                    <option key={room.key} value={room.key}>{room.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">类型</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.booking_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, booking_type: e.target.value as ClassroomBookingType }))}
                >
                  <option value="internal">内部老师分配</option>
                  <option value="external">外部申请</option>
                </select>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">课程 / 用途</span>
                <Input required value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">星期</span>
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
                <span className="text-xs font-medium text-muted-foreground">开始</span>
                <Input type="time" required value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">结束</span>
                <Input type="time" required value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">老师 / 负责人</span>
                <Input value={form.teacher_name || ''} onChange={(e) => setForm((prev) => ({ ...prev, teacher_name: e.target.value }))} />
              </label>

              {form.booking_type === 'external' && (
                <>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">申请人</span>
                    <Input value={form.applicant_name || ''} onChange={(e) => setForm((prev) => ({ ...prev, applicant_name: e.target.value }))} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">联系方式</span>
                    <Input value={form.applicant_contact || ''} onChange={(e) => setForm((prev) => ({ ...prev, applicant_contact: e.target.value }))} />
                  </label>
                </>
              )}

              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">备注</span>
                <Input value={form.notes || ''} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </label>

              <div className="md:col-span-4 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? '保存中...' : '添加到 Time Table'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <Card key={room.key}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  {room.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">加载中...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">星期</th>
                          <th className="py-2 pr-3 font-medium">时间</th>
                          <th className="py-2 pr-3 font-medium">用途</th>
                          <th className="py-2 pr-3 font-medium">类型</th>
                          <th className="py-2 pr-3 font-medium">状态</th>
                          <th className="py-2 pr-3 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBookings.filter((item) => item.room === room.key).map((item) => (
                          <tr key={item.id} className="border-b last:border-0 align-top">
                            <td className="py-3 pr-3 font-medium">{weekdays[item.day_of_week]}</td>
                            <td className="py-3 pr-3 whitespace-nowrap">{item.start_time} - {item.end_time}</td>
                            <td className="py-3 pr-3">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.teacher_name || item.applicant_name || '未填写负责人'}
                                {item.applicant_contact ? ` · ${item.applicant_contact}` : ''}
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
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(item, 'confirmed')} title="通过">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => removeBooking(item)} title="删除">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {sortedBookings.filter((item) => item.room === room.key).length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              暂无教室使用记录
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
