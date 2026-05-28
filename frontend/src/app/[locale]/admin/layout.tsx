import { SUPPORTED_LOCALES } from '@/lib/i18n';

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
  // Auth check is done client-side only, because this layout runs on the server
  // where localStorage is not available. The client-side pages handle their own auth.
  return <>{children}</>;
}
