'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, DollarSign, DoorOpen, Loader2, Pencil, XCircle } from 'lucide-react';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  type ExternalRentalRequest,
  type ExternalRentalRequestBody,
  type ExternalRentalRequestStatus,
  type StudioRoom,
  isAuthenticated,
  unifiedScheduleApi,
} from '@/lib/api';

type Locale = 'zh' | 'en' | 'fr';

const copy = {
  zh: {
    title: '教室使用',
    subtitle: '审核前台提交的外部教室租用申请，并管理已确认租用。',
    requests: '租用申请',
    pending: '待审核',
    confirmed: '已确认',
    rejected: '已拒绝',
    cancelled: '已取消',
    empty: '当前没有申请。',
    room: '教室',
    edit: '修改',
    save: '保存修改',
    close: '取消',
    approve: '确认申请',
    reject: '拒绝',
    cancelRental: '取消租用',
    updated: '申请状态已更新。',
    loadFailed: '加载租用申请失败。',
  },
  en: {
    title: 'Room Use',
    subtitle: 'Review public rental requests and manage confirmed rentals.',
    requests: 'Rental Requests',
    pending: 'Pending',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    empty: 'No requests in this status.',
    room: 'Room',
    edit: 'Edit',
    save: 'Save changes',
    close: 'Cancel',
    approve: 'Approve',
    reject: 'Reject',
    cancelRental: 'Cancel rental',
    updated: 'Request status updated.',
    loadFailed: 'Unable to load rental requests.',
  },
  fr: {
    title: 'Utilisation des salles',
    subtitle: 'Examinez les demandes publiques et gérez les locations confirmées.',
    requests: 'Demandes de location',
    pending: 'En attente',
    confirmed: 'Confirmées',
    rejected: 'Refusées',
    cancelled: 'Annulées',
    empty: 'Aucune demande avec ce statut.',
    room: 'Salle',
    edit: 'Modifier',
    save: 'Enregistrer',
    close: 'Annuler',
    approve: 'Confirmer',
    reject: 'Refuser',
    cancelRental: 'Annuler la location',
    updated: 'Statut de la demande mis à jour.',
    loadFailed: 'Impossible de charger les demandes.',
  },
};

const weekdayNames = {
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
};

export default function AdminClassroomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const rawLocale = pathname.split('/')[1] || 'en';
  const locale: Locale = rawLocale === 'fr' ? 'fr' : rawLocale === 'zh' || rawLocale === 'zh-Hant' ? 'zh' : 'en';
  const text = copy[locale];
  const pricingLabel = locale === 'zh' ? '编辑租借价格' : locale === 'fr' ? 'Modifier les tarifs de location' : 'Edit Rental Pricing';
  const [status, setStatus] = useState<ExternalRentalRequestStatus>('pending');
  const [requests, setRequests] = useState<ExternalRentalRequest[]>([]);
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExternalRentalRequestBody | null>(null);

  const load = async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const [nextRequests, nextRooms] = await Promise.all([
        unifiedScheduleApi.externalRentalRequests(nextStatus),
        unifiedScheduleApi.resources(),
      ]);
      setRequests(nextRequests);
      setRooms(nextRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${rawLocale}/admin/login`);
      return;
    }
    void load(status);
  }, [status, rawLocale, router]);

  const scheduleLabel = (item: ExternalRentalRequest) => {
    if (item.request_mode === 'single') return `${item.date || ''} · ${item.start_time}-${item.end_time}`;
    const days = item.days_of_week.map((day) => weekdayNames[locale][day]).join(', ');
    return `${item.start_date || ''} - ${item.end_date || ''} · ${days} · ${item.start_time}-${item.end_time}`;
  };

  const beginEdit = (item: ExternalRentalRequest) => {
    setEditingId(item.id);
    setEditForm({
      room_id: item.room_id,
      request_mode: item.request_mode,
      date: item.date,
      start_date: item.start_date,
      end_date: item.end_date,
      days_of_week: item.days_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      title: item.title,
      applicant_name: item.applicant_name,
      applicant_contact: item.applicant_contact,
      notes: item.notes,
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm || busy) return;
    setBusy(true);
    setError('');
    try {
      await unifiedScheduleApi.updateExternalRentalRequest(editingId, editForm);
      setEditingId(null);
      setEditForm(null);
      setNotice(text.updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.loadFailed);
    } finally {
      setBusy(false);
    }
  };

  const review = async (item: ExternalRentalRequest, action: 'approve' | 'reject' | 'cancel') => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'approve') await unifiedScheduleApi.approveExternalRentalRequest(item.id);
      if (action === 'reject') await unifiedScheduleApi.rejectExternalRentalRequest(item.id);
      if (action === 'cancel') await unifiedScheduleApi.cancelExternalRentalRequest(item.id);
      setNotice(text.updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.loadFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4"><AdminSectionTabs /></div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold"><DoorOpen className="h-6 w-6 text-primary" />{text.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push(`/${rawLocale}/admin/pricing#rental-pricing`)}>
            <DollarSign className="mr-2 h-4 w-4" />
            {pricingLabel}
          </Button>
        </div>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>{text.requests}</CardTitle>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as ExternalRentalRequestStatus)}>
              <option value="pending">{text.pending}</option>
              <option value="confirmed">{text.confirmed}</option>
              <option value="rejected">{text.rejected}</option>
              <option value="cancelled">{text.cancelled}</option>
            </select>
          </CardHeader>
          <CardContent>
            {loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</p> : requests.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{text.empty}</p> : <div className="space-y-3">
              {requests.map((item) => (
                <section key={item.id} className="rounded-md border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1 text-sm">
                      <h2 className="font-semibold text-foreground">{item.title}</h2>
                      <p className="text-muted-foreground">{scheduleLabel(item)}</p>
                      <p className="text-muted-foreground">{text.room}: {rooms.find((room) => room.id === item.room_id)?.name || item.room_id}</p>
                      <p>{item.applicant_name} · {item.applicant_contact}</p>
                      {item.notes && <p className="whitespace-pre-wrap text-muted-foreground">{item.notes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.status === 'pending' && <>
                        <Button type="button" size="sm" variant="outline" onClick={() => beginEdit(item)}><Pencil className="mr-1.5 h-4 w-4" />{text.edit}</Button>
                        <Button type="button" size="sm" disabled={busy} onClick={() => void review(item, 'approve')}><CheckCircle2 className="mr-1.5 h-4 w-4" />{text.approve}</Button>
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void review(item, 'reject')}><XCircle className="mr-1.5 h-4 w-4" />{text.reject}</Button>
                      </>}
                      {item.status === 'confirmed' && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void review(item, 'cancel')}>{text.cancelRental}</Button>}
                    </div>
                  </div>
                  {editingId === item.id && editForm && <div className="mt-4 grid gap-3 rounded-md border bg-slate-50 p-4 md:grid-cols-2">
                    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={editForm.room_id} onChange={(event) => setEditForm((current) => current ? { ...current, room_id: event.target.value } : current)}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select>
                    <Input value={editForm.title} onChange={(event) => setEditForm((current) => current ? { ...current, title: event.target.value } : current)} />
                    {editForm.request_mode === 'single' ? <Input className="md:col-span-2" type="date" value={editForm.date || ''} onChange={(event) => setEditForm((current) => current ? { ...current, date: event.target.value } : current)} /> : <><Input type="date" value={editForm.start_date || ''} onChange={(event) => setEditForm((current) => current ? { ...current, start_date: event.target.value } : current)} /><Input type="date" value={editForm.end_date || ''} onChange={(event) => setEditForm((current) => current ? { ...current, end_date: event.target.value } : current)} /></>}
                    <Input type="time" value={editForm.start_time} onChange={(event) => setEditForm((current) => current ? { ...current, start_time: event.target.value } : current)} />
                    <Input type="time" value={editForm.end_time} onChange={(event) => setEditForm((current) => current ? { ...current, end_time: event.target.value } : current)} />
                    <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" size="sm" disabled={busy} onClick={() => void saveEdit()}>{text.save}</Button><Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(null); setEditForm(null); }}>{text.close}</Button></div>
                  </div>}
                </section>
              ))}
            </div>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
