import SitePageRenderer from '@/components/pages/SitePageRenderer';

export default function ContactPage({ params }: { params: { locale: string } }) {
  return <SitePageRenderer slug="contact" locale={params.locale} />;
}
