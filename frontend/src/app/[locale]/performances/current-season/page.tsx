import { redirect } from 'next/navigation';

export default function CurrentSeasonPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/performances`);
}
