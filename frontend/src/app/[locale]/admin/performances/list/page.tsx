'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, performanceApi, type PerformanceItem } from '@/lib/api';
import { useTranslations } from '@/components/ui/i18n-client';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock, Eye, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { dateLocaleFor } from '@/lib/i18n';

type FilterMode = 'all' | 'homepage' | 'upcoming' | 'past';

function PublishSwitch({
  item,
  loading,
  onChange,
  t,
}: {
  item: PerformanceItem;
  loading: boolean;
  onChange: (item: PerformanceItem, nextValue: boolean) => void;
  t: (key: string) => string;
}) {
  const isActive = item.is_current;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onChange(item, !isActive)}
      className={`
        inline-flex h-8 min-w-[120px] items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition-all duration-200
        ${isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-pressed={isActive}
      title={isActive ? t('admin.performances.switchHide') : t('admin.performances.switchPublish')}
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span className="leading-none">
        {isActive ? t('admin.performances.published') : t('admin.performances.hidden')}
      </span>
    </button>
  );
}

export default function AdminPerformanceListPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [error, setError] = useState('');
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);

  const loadPerformances = () => {
    setLoading(true);
    performanceApi.list()
      .then(setPerformances)
      .catch((err) => setError(err instanceof Error ? err.message : t('admin.performances.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    const status = new URLSearchParams(window.location.search).get('filter');
    if (status === 'homepage' || status === 'upcoming' || status === 'past' || status === 'all') {
      setFilter(status);
    }
    loadPerformances();
  }, [locale, router]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return performances.filter((item) => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'homepage' && !item.is_current) return false;
      if (filter === 'upcoming' && new Date(item.start_date).getTime() < now) return false;
      if (filter === 'past' && new Date(item.end_date).getTime() >= now) return false;
      return true;
    });
  }, [filter, performances, search]);

  const handleDelete = async (item: PerformanceItem) => {
    if (!window.confirm(t('admin.performances.deleteConfirm').replace('{title}', item.title))) return;
    try {
      await performanceApi.remove(item.id);
      setPerformances((prev) => prev.filter((performance) => performance.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.deleteFailed'));
    }
  };

  const handleVisibilityToggle = async (item: PerformanceItem, nextValue: boolean) => {
    setSwitchLoading(item.id);
    setError('');
    try {
      const updated = await performanceApi.update(item.id, { is_current: nextValue });
      setPerformances((prev) => prev.map((performance) => performance.id === item.id ? updated : performance));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.performances.statusFailed'));
    } finally {
      setSwitchLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.performances.listTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.performances.totalCount').replace('{count}', String(filtered.length))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BackButton fallbackRoute={`/${locale}/admin/performances`} className="shrink-0 px-2" />
            <Button onClick={() => router.push(`/${locale}/admin/performances/editor`)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('admin.performances.newPerformance')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="p-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('admin.performances.searchPlaceholder')}
                className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterMode)}
              className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm min-w-[150px]"
            >
              <option value="all">{t('admin.performances.all')}</option>
              <option value="homepage">{t('admin.performances.homepage')}</option>
              <option value="upcoming">{t('admin.performances.upcoming')}</option>
              <option value="past">{t('admin.performances.past')}</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <p className="text-muted-foreground">{t('admin.common.loading')}</p>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">{t('admin.performances.emptyAll')}</Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${item.is_current ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <h3 className="font-semibold truncate">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(item.start_date).toLocaleDateString(dateLocaleFor(locale))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PublishSwitch
                      item={item}
                      loading={switchLoading === item.id}
                      onChange={handleVisibilityToggle}
                      t={t}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      title={t('admin.performances.view')}
                      onClick={() => window.open(`/${locale}/performances/${item.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/admin/performances/editor/${item.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
