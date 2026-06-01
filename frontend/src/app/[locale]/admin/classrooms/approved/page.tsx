'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClassroomBooking,
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
import { CheckCircle2, Eye, Trash2 } from 'lucide-react';

const roomKeys: ClassroomRoom[] = ['large', 'small'];
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function roomLabel(room: ClassroomRoom) {
  return room === 'large' ? '大教室' : '小教室';
}

function typeLabel(item: ClassroomBooking) {
  return item.booking_type === 'internal' ? '内部申请' : '外部申请';
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
    { label: '类型', value: typeLabel(item) },
    { label: '状态', value: '已通过' },
    { label: '课程 / 用途', value: item.title },
    { label: '负责人', value: ownerName(item) },
    { label: '申请人', value: item.applicant_name || '-' },
    { label: '联系方式', value: item.applicant_contact || '-' },
  ];
}

export default function ApprovedClassroomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [bookings, setBookings] = useState<ClassroomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ClassroomBooking | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | ClassroomRoom>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room === 'large' || room === 'small') setRoomFilter(room);
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

  const sortedBookings = useMemo(
    () =>
      [...bookings]
        .filter((item) => roomFilter === 'all' || item.room === roomFilter)
        .sort((a, b) =>
          a.day_of_week - b.day_of_week ||
          a.start_time.localeCompare(b.start_time) ||
          a.room.localeCompare(b.room)
        ),
    [bookings, roomFilter]
  );

  function loadBookings() {
    setLoading(true);
    classroomApi
      .list({ status: 'confirmed', locale })
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : '加载已通过申请失败'))
      .finally(() => setLoading(false));
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
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              已通过教室使用
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">查看已经通过的教室使用，并在这里管理删除。</p>
          </div>
          <BackButton fallbackRoute={`/${locale}/admin/classrooms`} className="shrink-0" />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>已通过列表</CardTitle>
            <div className="inline-flex rounded-md border bg-white p-1">
              <Button size="sm" variant={roomFilter === 'all' ? 'default' : 'ghost'} onClick={() => setRoomFilter('all')}>全部</Button>
              <Button size="sm" variant={roomFilter === 'large' ? 'default' : 'ghost'} onClick={() => setRoomFilter('large')}>大教室</Button>
              <Button size="sm" variant={roomFilter === 'small' ? 'default' : 'ghost'} onClick={() => setRoomFilter('small')}>小教室</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-sm">
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
                    {sortedBookings.map((item) => (
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
                          {item.notes && <div className="mt-1 max-w-[360px] truncate text-xs text-muted-foreground">{notesSummary(item.notes)}</div>}
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
                    ))}
                    {sortedBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">暂无已通过记录</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>已通过详情</DialogTitle>
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
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => removeBooking(selectedBooking)}>
                    删除
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
