'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSectionTabs } from '@/components/layout/AdminSectionTabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isAuthenticated, usersApi, type AdminAccount } from '@/lib/api';
import { Check, Pencil, Plus, RefreshCw, Save, Search } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function AdminAccountsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const loadData = (nextOffset = offset) => {
    setLoading(true);
    setError('');
    Promise.all([
      usersApi.me(),
      usersApi.adminAccounts({ search, status: statusFilter, limit, offset: nextOffset }),
    ])
      .then(([me, accountPage]) => {
        setCurrentUser(me);
        if (me.role !== 'super_admin') {
          router.push(`/${locale}/admin/dashboard`);
          return;
        }
        setAccounts(accountPage.items);
        setTotal(accountPage.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    loadData();
    // Filters are applied explicitly with the Filter button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, locale, offset, limit]);

  const runSearch = () => {
    setOffset(0);
    loadData(0);
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving('new-account');
    setError('');
    setSuccess('');
    try {
      await usersApi.createAdminAccount(newAccount);
      setNewAccount({ email: '', password: '', first_name: '', last_name: '' });
      setSuccess('老师账号已创建');
      setOffset(0);
      loadData(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建老师账号失败');
    } finally {
      setSaving('');
    }
  };

  const updateAccount = (id: string, updater: (account: AdminAccount) => AdminAccount) => {
    setAccounts((items) => items.map((item) => (item.id === id ? updater(item) : item)));
  };

  const saveAccount = async (account: AdminAccount, password: string) => {
    setSaving(account.id);
    setError('');
    setSuccess('');
    try {
      await usersApi.updateAdminAccount(account.id, {
        first_name: account.first_name,
        last_name: account.last_name,
        is_active: account.is_active,
        password: password || undefined,
      });
      setSuccess('老师账号已保存');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存老师账号失败');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">老师账号管理</h1>
            <p className="text-sm text-muted-foreground">只有超级管理员可以创建、停用和重置老师账号。老师账号不能管理其他账号。</p>
          </div>
          <Button variant="outline" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-700" />
              创建老师账号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAccount} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input placeholder="邮箱" type="email" value={newAccount.email} onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })} required />
                <Input placeholder="初始密码" type="password" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} required />
                <Input placeholder="名字" value={newAccount.first_name} onChange={(e) => setNewAccount({ ...newAccount, first_name: e.target.value })} required />
                <Input placeholder="姓氏" value={newAccount.last_name} onChange={(e) => setNewAccount({ ...newAccount, last_name: e.target.value })} required />
              </div>
              <Button type="submit" disabled={saving === 'new-account'}>
                <Check className="mr-2 h-4 w-4" />
                {saving === 'new-account' ? '创建中...' : '创建老师账号'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>老师账号列表</CardTitle>
            <p className="text-sm text-muted-foreground">这里不会显示学生账号，也不会显示超级管理员账号。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_120px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="搜索邮箱" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }} />
              </div>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}>
                <option value="all">全部状态</option>
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}/页</option>)}
              </select>
              <Button type="button" onClick={runSearch}>筛选</Button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">加载中...</div>
            ) : accounts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">没有符合条件的老师账号。</div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <TeacherAccountRow
                    key={account.id}
                    account={account}
                    saving={saving === account.id}
                    onChange={(next) => updateAccount(account.id, () => next)}
                    onSave={(password) => saveAccount(account, password)}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">共 {total} 个老师账号，第 {page} / {pageCount} 页</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>上一页</Button>
                <Button variant="outline" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>下一页</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TeacherAccountRow({
  account,
  saving,
  onChange,
  onSave,
}: {
  account: AdminAccount;
  saving: boolean;
  onChange: (account: AdminAccount) => void;
  onSave: (password: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState('');

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-950">{account.first_name} {account.last_name}</p>
            <Badge variant={account.is_active ? 'default' : 'secondary'}>{account.is_active ? '启用' : '停用'}</Badge>
            <Badge variant="outline">老师账号</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setExpanded(!expanded)}>
            <Pencil className="mr-2 h-4 w-4" />
            {expanded ? '收起' : '编辑'}
          </Button>
          <Button type="button" disabled={saving} onClick={() => { onSave(password); setPassword(''); }}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-4">
          <Input value={account.first_name} onChange={(e) => onChange({ ...account, first_name: e.target.value })} placeholder="名字" />
          <Input value={account.last_name} onChange={(e) => onChange({ ...account, last_name: e.target.value })} placeholder="姓氏" />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={account.is_active ? 'active' : 'disabled'} onChange={(e) => onChange({ ...account, is_active: e.target.value === 'active' })}>
            <option value="active">启用</option>
            <option value="disabled">停用</option>
          </select>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="新密码，留空不改" />
        </div>
      )}
    </div>
  );
}
