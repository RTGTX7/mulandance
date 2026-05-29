import { redirect } from 'next/navigation';

export default function ArchiveRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/performances#archive`);
}
