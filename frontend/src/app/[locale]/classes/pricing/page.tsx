import { redirect } from 'next/navigation';

export default function PricingRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/programs/pricing`);
}
