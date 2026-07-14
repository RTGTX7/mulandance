import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { getLogtoConfig, isDevelopmentAuthEnabled } from '@/lib/logto';

export const dynamic = 'force-dynamic';

export default async function PortalDashboardLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isDevelopmentAuthEnabled()) {
    const context = await getLogtoContext(getLogtoConfig());
    if (!context.isAuthenticated) {
      redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/${params.locale}/portal/dashboard`)}`);
    }
  }
  return <>{children}</>;
}
