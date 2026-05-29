import { redirect } from 'next/navigation';

export default function WorkshopsRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/performances`);
}
