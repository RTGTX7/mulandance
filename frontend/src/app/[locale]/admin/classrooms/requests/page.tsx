'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClassroomBooking,
  ClassroomBookingStatus,
  ClassroomBookingType,
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
import { CheckCircle2, Clock3, Eye, Inbox, Trash2 } from 'lucide-react';

const roomKeys: ClassroomRoom[] = ['large', 'small'];
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function roomLabel(room: ClassroomRoom) {
  return room === 'large' ? '大教室' : '小教室';
}

function statusLabel(status: ClassroomBookingStatus) {
  if (status === 'confirmed') return '已通过';
  if (status === 'rejected') return '已拒绝';
  return '待审核';
}

function typeLabel(type: ClassroomBookingType) {
  return type === 'external' ? '外部申请' : '内部教师分配';
}

function ownerName(item: ClassroomBooking) {
  return item.teacher_name || item.applicant_name || '未填写负责人';
}

function notesSummary(notes?: string) {
  if (!notes) return '';
  const firstUsefulLine = notes
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.endsWith(': -'));
  return firstUsefulLine || notes.trim();
}

function detailRows(item: ClassroomBooking) {
  return [
    { label: '教室', value: roomLabel(item.room) },
    { label: '星期', value: weekdayLabels[item.day_of_week] },
    { label: '时间', value: `${item.start_time} - ${item.end_time}` },
    { label: '类型', value: typeLabel(item.booking_type) },
    { label: '状态', value: statusLabel(item.status) },
    { label: '课程 / 用途', value: item.title },
    { label: '负责人', value: ownerName(item) },
    { label: '申请人', value: item.applicant_name || '-' },
    { label: '联系方式', value: item.applicant_contact || '-' },
  ];
}

export default function ClassroomRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<ClassroomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ClassroomBooking | null>(null);

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
    Promise.all([
      classroomApi.list({ status: 'pending' }),
      classroomApi.list({ status: 'confirmed' }),
    ])
      .then(([pending, confirmed]) => {
        setBookings(pending);
        setConfirmedBookings(confirmed);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载待审核申请失败'))
      .finally(() => setLoading(false));
  }

  function findApprovedConflict(item: ClassroomBooking) {
    return confirmedBookings.find(
      (confirmed) =>
        confirmed.room === item.room &&
        confirmed.day_of_week === item.day_of_week &&
        confirmed.start_time < item.end_time &&
        confirmed.end_time > item.start_time
    );
  }

  function conflictMessage(conflict: ClassroomBooking) {
    return `${roomLabel(conflict.room)} ${weekdayLabels[conflict.day_of_week]} ${conflict.start_time}-${conflict.end_time} 已被“${conflict.title}”占用`;
  }

  async function updateStatus(item: ClassroomBooking, status: ClassroomBookingStatus) {
    setError('');
    const conflict = status === 'confirmed' ? findApprovedConflict(item) : undefined;
    if (conflict) {
      setError(`不能通过：${conflictMessage(conflict)}。先通过的申请优先生效。`);
      return;
    }
    try {
      await classroomApi.update(item.id, { status });
      setSelectedBooking(null);
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败');
    }
  }

  async function removeBooking(item: ClassroomBooking) {
    if (!window.confirm(`删除“${item.title}”吗？`)) return;
    setError('');
    try {
      await classroomApi.remove(item.id);
      setSelectedBooking(null);
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
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
              <Inbox className="h-6 w-6 text-amber-600" />
              待审核租借申请
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">点击申请行查看完整信息，再决定通过或删除。</p>
          </div>
          <BackButton fallbackRoute={`/${locale}/admin/classrooms`} className="shrink-0" />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {roomKeys.map((room) => {
            const roomBookings = sortedBookings.filter((item) => item.room === room);
            return (
              <Card key={room}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock3 className="h-5 w-5 text-primary" />
                    {roomLabel(room)}
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
                            <th className="py-2 pr-3 font-medium">课程 / 用途</th>
                            <th className="py-2 pr-3 font-medium">类型</th>
                            <th className="py-2 pr-3 font-medium">状态</th>
                            <th className="py-2 pr-3 font-medium">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomBookings.map((item) => (
                            (() => {
                              const conflict = findApprovedConflict(item);
                              return (
                            <tr
                              key={item.id}
                              className="cursor-pointer border-b align-top transition-colors last:border-0 hover:bg-slate-50"
                              onClick={() => setSelectedBooking(item)}
                            >
                              <td className="py-3 pr-3 font-medium">{weekdayLabels[item.day_of_week]}</td>
                              <td className="whitespace-nowrap py-3 pr-3">{item.start_time} - {item.end_time}</td>
                              <td className="py-3 pr-3">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {ownerName(item)}
                                  {item.applicant_contact ? ` / ${item.applicant_contact}` : ''}
                                </div>
                                {item.notes && (
                                  <div className="mt-1 max-w-[320px] truncate text-xs text-muted-foreground">
                                    {notesSummary(item.notes)}
                                  </div>
                                )}
                                {conflict && (
                                  <div className="mt-1 max-w-[320px] truncate text-xs text-red-600">
                                    撞期：{conflictMessage(conflict)}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 pr-3">{typeLabel(item.booking_type)}</td>
                              <td className="py-3 pr-3">
                                <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                  {statusLabel(item.status)}
                                </span>
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={Boolean(conflict)}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      updateStatus(item, 'confirmed');
                                    }}
                                    title={conflict ? '已有已通过申请占用该时间' : '通过'}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      removeBooking(item);
                                    }}
                                    title="删除"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                              );
                            })()
                          ))}
                          {roomBookings.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                暂无待审核申请
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

        <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>申请详情</DialogTitle>
              <DialogDescription>查看完整租借申请信息，然后通过或删除。</DialogDescription>
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
                {findApprovedConflict(selectedBooking) && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    不能通过：{conflictMessage(findApprovedConflict(selectedBooking)!)}。先通过的申请优先生效。
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => removeBooking(selectedBooking)}>删除</Button>
                  <Button
                    disabled={Boolean(findApprovedConflict(selectedBooking))}
                    onClick={() => updateStatus(selectedBooking, 'confirmed')}
                  >
                    通过申请
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
