'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClassroomBooking,
  ClassroomRoom,
  classroomApi,
  isAuthenticated,
} from '@/lib/api';
import { CalendarDays, CheckCircle2, Clock3, DoorOpen, Inbox } from 'lucide-react';

const roomKeys: ClassroomRoom[] = ['large', 'small'];
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const displayOrder = [1, 2, 3, 4, 5, 6, 0];

function roomLabel(room: ClassroomRoom) {
  return room === 'large' ? '大教室' : '小教室';
}

export default function AdminClassroomsDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    classroomApi
      .list()
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : '加载教室使用记录失败'))
      .finally(() => setLoading(false));
  }, [locale, router]);

  const pending = bookings.filter((item) => item.status === 'pending');
  const confirmed = bookings.filter((item) => item.status === 'confirmed');
  const externalConfirmed = confirmed.filter((item) => item.booking_type === 'external');
  const internalConfirmed = confirmed.filter((item) => item.booking_type === 'internal');

  const calendarDays = useMemo(() => {
    return displayOrder.map((day) => ({
      day,
      label: weekdayLabels[day],
      bookings: confirmed
        .filter((item) => item.day_of_week === day)
        .sort((a, b) =>
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time) ||
          a.room.localeCompare(b.room)
        ),
    }));
  }, [confirmed]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <DoorOpen className="h-6 w-6 text-primary" />
            教室使用时间表
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            审核外部租借申请，并用日历查看已经通过的教室使用安排。
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-amber-300" onClick={() => router.push(`/${locale}/admin/classrooms/requests`)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Inbox className="h-4 w-4" />
                待审核申请
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{loading ? '...' : pending.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-emerald-300" onClick={() => router.push(`/${locale}/admin/classrooms/approved`)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                已通过申请
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{loading ? '...' : confirmed.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-purple-300" onClick={() => router.push(`/${locale}/admin/classrooms/internal`)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                内部申请
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {loading ? '...' : internalConfirmed.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              已通过申请周历
            </CardTitle>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>外部申请 {externalConfirmed.length}</span>
              <span>内部排期 {internalConfirmed.length}</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-lg border">
                  {calendarDays.map((day) => (
                    <div key={day.day} className="min-h-[300px] border-r last:border-r-0">
                      <div className="border-b bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                        {day.label}
                      </div>
                      <div className="space-y-2 p-3">
                        {day.bookings.length === 0 ? (
                          <div className="rounded-md border border-dashed px-3 py-8 text-center text-xs text-slate-400">
                            暂无通过申请
                          </div>
                        ) : (
                          day.bookings.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                router.push(`/${locale}/admin/classrooms/approved?id=${item.id}`)
                              }
                              className={`w-full rounded-md border px-3 py-2 text-left text-xs leading-5 transition-colors hover:border-primary/40 ${
                                item.room === 'large'
                                  ? 'border-purple-200 bg-purple-50 text-purple-900'
                                  : 'border-amber-200 bg-amber-50 text-amber-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 font-semibold">
                                <span>{roomLabel(item.room)}</span>
                                <span>{item.start_time}-{item.end_time}</span>
                              </div>
                              <div className="mt-1 truncate font-medium text-slate-950">{item.title}</div>
                              <div className="truncate text-slate-600">
                                {item.teacher_name || item.applicant_name || '未填写负责人'}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
