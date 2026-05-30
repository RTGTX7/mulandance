'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SystemSettings, isAuthenticated, settingsApi, uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2, Mail, Save, Settings } from 'lucide-react';

const defaultSettings: SystemSettings = {
  site_name: 'Mulan Dance Studio',
  logo_url: '/logo.png',
  header_cta_label: 'Register',
  header_cta_href: '/classes/register',
  show_admin_login: true,
  announcement_enabled: false,
  announcement_text: '',
  announcement_href: '',
  footer_description: '',
  footer_newsletter_title: 'Join Us',
  footer_newsletter_text: '',
  copyright_text: 'All rights reserved.',
  privacy_href: '/privacy',
  contact_email: 'info@mulandance.com',
  contact_phone: '3437771766',
  contact_address: '',
  outbound_email: '',
  classroom_request_limit_per_contact: 0,
  program_pricing_json: '',
  classroom_pricing_json: '',
  youtube_url: 'https://www.youtube.com/@mulandancestudio21',
  xiaohongshu_url: 'https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-sm font-medium transition-colors',
        checked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      <span className={cn('relative inline-flex h-4 w-7 rounded-full', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[14px]' : 'translate-x-0.5')} />
      </span>
      {label}
    </button>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [form, setForm] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    settingsApi
      .site()
      .then((settings) => setForm({ ...defaultSettings, ...settings }))
      .catch((err) => setError(err instanceof Error ? err.message : '加载系统设置失败'))
      .finally(() => setLoading(false));
  }, [router, locale]);

  function setField<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadApi.image(file);
      setField('logo_url', uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传 Logo 失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const saved = await settingsApi.updateSite(form);
      setForm({ ...defaultSettings, ...saved });
      setMessage('系统设置已保存');
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

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={saveSettings} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Settings className="h-6 w-6 text-primary" />
                系统设置
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                管理全站品牌、页眉、页脚、联系方式、邮件发信人、社媒和版权信息。
              </p>
            </div>
            <Button type="submit" disabled={loading || saving || uploading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存设置
            </Button>
          </div>

          {(error || message) && (
            <div className={cn('rounded-md border px-3 py-2 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
              {error || message}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载系统设置...
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>品牌与页眉</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">网站名称</span>
                    <Input value={form.site_name} onChange={(e) => setField('site_name', e.target.value)} />
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Logo</span>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-full border bg-slate-100">
                        {form.logo_url ? (
                          <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Logo</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Button asChild type="button" variant="outline" disabled={uploading}>
                          <label className="cursor-pointer">
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                            上传 Logo
                            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                          </label>
                        </Button>
                        <Input value={form.logo_url} onChange={(e) => setField('logo_url', e.target.value)} placeholder="/logo.png 或 https://..." />
                      </div>
                    </div>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">页眉按钮文字</span>
                    <Input value={form.header_cta_label} onChange={(e) => setField('header_cta_label', e.target.value)} placeholder="Register" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">页眉按钮链接</span>
                    <Input value={form.header_cta_href} onChange={(e) => setField('header_cta_href', e.target.value)} placeholder="/classes/register 或 https://..." />
                  </label>

                  <div className="lg:col-span-2">
                    <Toggle checked={form.show_admin_login} onCheckedChange={(checked) => setField('show_admin_login', checked)} label={form.show_admin_login ? '显示后台登录入口' : '隐藏后台登录入口'} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    邮件发送设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">对外发信人邮箱</span>
                    <Input
                      type="email"
                      value={form.outbound_email}
                      onChange={(e) => setField('outbound_email', e.target.value)}
                      placeholder="noreply@mulandance.com"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">同一联系方式最多申请次数</span>
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={form.classroom_request_limit_per_contact}
                      onChange={(e) =>
                        setField('classroom_request_limit_per_contact', Math.max(0, Number(e.target.value) || 0))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      0 表示不限制。这里限制前台租借申请表里的联系方式。
                    </span>
                  </label>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                    这里控制网站邮件显示的 From 发信人。真正发送还需要后端配置 SMTP_HOST、SMTP_USERNAME、SMTP_PASSWORD。
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>顶部公告栏</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <Toggle checked={form.announcement_enabled} onCheckedChange={(checked) => setField('announcement_enabled', checked)} label={form.announcement_enabled ? '公告已启用' : '公告关闭'} />
                  </div>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">公告文字</span>
                    <Input value={form.announcement_text} onChange={(e) => setField('announcement_text', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">公告链接</span>
                    <Input value={form.announcement_href} onChange={(e) => setField('announcement_href', e.target.value)} placeholder="可留空" />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>页脚内容</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">页脚简介</span>
                    <Textarea rows={4} value={form.footer_description} onChange={(e) => setField('footer_description', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">页脚右侧标题</span>
                    <Input value={form.footer_newsletter_title} onChange={(e) => setField('footer_newsletter_title', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">隐私政策链接</span>
                    <Input value={form.privacy_href} onChange={(e) => setField('privacy_href', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">页脚右侧文字</span>
                    <Textarea rows={3} value={form.footer_newsletter_text} onChange={(e) => setField('footer_newsletter_text', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">Copyright 文字</span>
                    <Input value={form.copyright_text} onChange={(e) => setField('copyright_text', e.target.value)} />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>联系方式与社媒</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">联系邮箱</span>
                    <Input value={form.contact_email} onChange={(e) => setField('contact_email', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">电话</span>
                    <Input value={form.contact_phone} onChange={(e) => setField('contact_phone', e.target.value)} />
                  </label>
                  <label className="block space-y-1 lg:col-span-2">
                    <span className="text-sm font-medium">地址</span>
                    <Textarea rows={3} value={form.contact_address} onChange={(e) => setField('contact_address', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">YouTube</span>
                    <Input value={form.youtube_url} onChange={(e) => setField('youtube_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">小红书 / RedNote</span>
                    <Input value={form.xiaohongshu_url} onChange={(e) => setField('xiaohongshu_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Instagram</span>
                    <Input value={form.instagram_url} onChange={(e) => setField('instagram_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Facebook</span>
                    <Input value={form.facebook_url} onChange={(e) => setField('facebook_url', e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">TikTok</span>
                    <Input value={form.tiktok_url} onChange={(e) => setField('tiktok_url', e.target.value)} />
                  </label>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
