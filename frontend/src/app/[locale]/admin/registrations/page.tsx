'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isAuthenticated, settingsApi, type RegistrationLinks } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ClipboardList, ExternalLink, Loader2, Save } from 'lucide-react';

function LinkSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-sm font-medium transition-colors',
        checked
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      <span className={cn('relative inline-flex h-4 w-7 rounded-full', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[14px]' : 'translate-x-0.5'
          )}
        />
      </span>
      {checked ? '已启用' : '暂待'}
    </button>
  );
}

const emptyLinks: RegistrationLinks = {
  registration_url: '',
  summer_camp_registration_url: '',
  summer_camp_enabled: false,
};

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [links, setLinks] = useState<RegistrationLinks>(emptyLinks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    settingsApi
      .registrationLinks()
      .then(setLinks)
      .catch((err) => setError(err instanceof Error ? err.message : '加载报名链接失败'))
      .finally(() => setLoading(false));
  }, [router, locale]);

  const saveLinks = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await settingsApi.updateRegistrationLinks(links);
      setLinks(updated);
      setMessage('报名链接已保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                报名链接
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                管理员填写后，前台“报名”按钮会打开这里配置的链接。
              </p>
            </div>
            <Button onClick={saveLinks} disabled={loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载报名链接...
              </div>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">报名链接</label>
                    <div className="flex gap-2">
                      <Input
                        value={links.registration_url}
                        onChange={(event) => setLinks((current) => ({ ...current, registration_url: event.target.value }))}
                        placeholder="https://..."
                      />
                      {links.registration_url && (
                        <Button asChild variant="outline" size="icon" title="打开链接">
                          <a href={links.registration_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">普通课程和通用报名入口会使用这个链接。</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium">夏令营报名链接</label>
                      <LinkSwitch
                        checked={links.summer_camp_enabled}
                        onCheckedChange={(checked) => setLinks((current) => ({ ...current, summer_camp_enabled: checked }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={links.summer_camp_registration_url}
                        onChange={(event) =>
                          setLinks((current) => ({ ...current, summer_camp_registration_url: event.target.value }))
                        }
                        placeholder="https://..."
                      />
                      {links.summer_camp_registration_url && (
                        <Button asChild variant="outline" size="icon" title="打开链接">
                          <a href={links.summer_camp_registration_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      先保持“暂待”。启用后，夏令营页面的报名入口会优先使用这个链接。
                    </p>
                  </div>
                </div>

                {(message || error) && (
                  <div
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm',
                      error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    )}
                  >
                    {error || message}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
