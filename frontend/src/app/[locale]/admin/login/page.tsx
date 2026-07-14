import { redirect } from 'next/navigation';

export default function AdminLoginCompatibility({ params }: { params: { locale: string } }) {
  redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/${params.locale}/admin`)}`);
}
