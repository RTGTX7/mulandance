import { redirect } from 'next/navigation';

export default function ForgotPasswordCompatibility({ params }: { params: { locale: string } }) {
  redirect(`/auth/account?section=password&locale=${encodeURIComponent(params.locale)}`);
}
