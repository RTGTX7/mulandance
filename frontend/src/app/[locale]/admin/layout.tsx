import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { AdminPermissionGate } from '@/components/layout/AdminPermissionGate';
import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { getLogtoConfig, isDevelopmentAuthEnabled } from '@/lib/logto';
import { AdminShell } from '@/components/layout/AdminSectionTabs';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isDevelopmentAuthEnabled()) {
    const context = await getLogtoContext(getLogtoConfig());
    if (!context.isAuthenticated) {
      redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/${params.locale}/admin`)}`);
    }
  }
  return <AdminPermissionGate><AdminShell>{children}</AdminShell></AdminPermissionGate>;
}
