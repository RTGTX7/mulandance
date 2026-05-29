import { redirect } from 'next/navigation';

export default function CalendarRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/performances`);
}
