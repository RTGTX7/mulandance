'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CourseScheduleItem,
  CourseScheduleItemBody,
  SchoolPolicy,
  isAuthenticated,
  scheduleApi,
} from '@/lib/api';
import { CalendarDays, Eye, Plus, Save, Trash2 } from 'lucide-react';

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const displayOrder = [1, 2, 3, 4, 5, 6, 0];

const initialForm: CourseScheduleItemBody = {
  day_of_week: 1,
  title: '',
  start_time: '17:00',
  end_time: '18:00',
  description: '',
  location: '2527 Baseline Road 二楼',
  is_active: true,
  order_index: 10,
};

function scheduleStatusLabels(locale: string, active: boolean) {
  if (locale === 'fr') {
    return {
      label: active ? 'Publié' : 'Masqué',
      title: active ? 'Cliquer pour masquer ce cours' : 'Cliquer pour publier ce cours',
    };
  }
  if (locale === 'en') {
    return {
      label: active ? 'Published' : 'Hidden',
      title: active ? 'Click to hide this class' : 'Click to publish this class',
    };
  }
  return {
    label: active ? '已发布' : '已隐藏',
    title: active ? '点击隐藏此排课' : '点击发布此排课',
  };
}

function SchedulePublishSwitch({
  item,
  locale,
  loading,
  onChange,
}: {
  item: CourseScheduleItem;
  locale: string;
  loading: boolean;
  onChange: (item: CourseScheduleItem, nextValue: boolean) => void;
}) {
  const active = item.is_active;
  const labels = scheduleStatusLabels(locale, active);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onChange(item, !active)}
      className={`
        inline-flex h-8 min-w-[104px] items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition-all duration-200
        ${active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
        ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      aria-pressed={active}
      title={labels.title}
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span className="leading-none">{labels.label}</span>
    </button>
  );
}

export default function AdminSchedulesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'zh';
  const [items, setItems] = useState<CourseScheduleItem[]>([]);
  const [form, setForm] = useState<CourseScheduleItemBody>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<SchoolPolicy>({
    title: '学校规章制度及退费规则',
    body_markdown: '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadData();
  }, [router, locale]);

  const grouped = useMemo(() => {
    return displayOrder.map((day) => ({
      day,
      label: weekdays[day],
      items: items
        .filter((item) => item.day_of_week === day)
        .sort((a, b) =>
          a.order_index - b.order_index ||
          a.start_time.localeCompare(b.start_time) ||
          a.end_time.localeCompare(b.end_time)
        ),
    }));
  }, [items]);

  const policyHtml = useMemo(
    () => String(marked.parse(policy.body_markdown || '')),
    [policy.body_markdown]
  );

  function loadData() {
    setLoading(true);
    setError('');
    Promise.all([scheduleApi.list({ includeInactive: true }), scheduleApi.policy()])
      .then(([scheduleItems, policyData]) => {
        setItems(scheduleItems);
        setPolicy(policyData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }

  function editItem(item: CourseScheduleItem) {
    setEditingId(item.id);
    setForm({
      day_of_week: item.day_of_week,
      title: item.title,
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description || '',
      location: item.location,
      is_active: item.is_active,
      order_index: item.order_index,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function saveScheduleItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (editingId) {
        await scheduleApi.update(editingId, form);
      } else {
        await scheduleApi.create(form);
      }
      resetForm();
      setMessage('排课已保存');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: CourseScheduleItem) {
    if (!window.confirm(`删除「${item.title}」吗？`)) return;
    setError('');
    try {
      await scheduleApi.remove(item.id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function toggleScheduleStatus(item: CourseScheduleItem, nextValue: boolean) {
    setSwitchLoading(item.id);
    setError('');
    try {
      const updated = await scheduleApi.update(item.id, { is_active: nextValue });
      setItems((prev) => prev.map((scheduleItem) => scheduleItem.id === item.id ? updated : scheduleItem));
      if (editingId === item.id) {
        setForm((prev) => ({ ...prev, is_active: updated.is_active }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setSwitchLoading(null);
    }
  }

  async function savePolicy() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const next = await scheduleApi.updatePolicy(policy);
      setPolicy(next);
      setMessage('规章制度已保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
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
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CalendarDays className="h-6 w-6 text-primary" />
            排课表
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理前台课程排课表，以及学校规章制度和退费规则 Markdown。
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? '编辑排课' : '新增排课'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveScheduleItem} className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">星期</span>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.day_of_week}
                  onChange={(event) => setForm((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))}
                >
                  {weekdays.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">课程名</span>
                <Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">开始</span>
                <Input type="time" required value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">结束</span>
                <Input type="time" required value={form.end_time} onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">排序</span>
                <Input type="number" value={form.order_index} onChange={(event) => setForm((prev) => ({ ...prev, order_index: Number(event.target.value) }))} />
              </label>
              <label className="space-y-1 md:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">说明</span>
                <Input value={form.description || ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">上课地址</span>
                <Input required value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                前台显示
              </label>
              <div className="md:col-span-6 flex justify-end gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>取消编辑</Button>
                )}
                <Button type="submit" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? '保存中...' : '保存排课'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            <Card className="lg:col-span-2 p-8 text-sm text-muted-foreground">加载中...</Card>
          ) : grouped.map((day) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="text-lg">{day.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无课程</p>
                ) : day.items.map((item) => (
                  <div key={item.id} className={`rounded-md border p-3 ${item.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.start_time} - {item.end_time} / {item.location}
                        </div>
                        {item.description && <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <SchedulePublishSwitch
                          item={item}
                          locale={locale}
                          loading={switchLoading === item.id}
                          onChange={toggleScheduleStatus}
                        />
                        <Button size="sm" variant="outline" onClick={() => editItem(item)}>编辑</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => removeItem(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">学校规章制度及退费规则</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview((prev) => !prev)}>
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? '编辑' : '预览'}
              </Button>
              <Button size="sm" onClick={savePolicy} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                保存规则
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={policy.title}
              onChange={(event) => setPolicy((prev) => ({ ...prev, title: event.target.value }))}
            />
            {showPreview ? (
              <div
                className="prose prose-slate max-w-none rounded-md border bg-white p-4"
                dangerouslySetInnerHTML={{ __html: policyHtml }}
              />
            ) : (
              <Textarea
                value={policy.body_markdown}
                onChange={(event) => setPolicy((prev) => ({ ...prev, body_markdown: event.target.value }))}
                className="min-h-[420px] font-mono text-sm"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
