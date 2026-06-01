import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { AdminPermissionGate } from '@/components/layout/AdminPermissionGate';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <AdminPermissionGate>{children}</AdminPermissionGate>;
}
