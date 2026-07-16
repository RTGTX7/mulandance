import SitePageRenderer from '@/components/pages/SitePageRenderer';

export default function AboutPage({ params }: { params: { locale: string } }) {
  return <SitePageRenderer slug="about" locale={params.locale} />;
}
