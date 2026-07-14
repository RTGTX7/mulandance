import { redirect } from 'next/navigation';

export default function PortalRegisterCompatibility({ params }: { params: { locale: string } }) {
  redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/${params.locale}/portal/dashboard`)}`);
}
