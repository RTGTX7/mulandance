import { PerformanceEditor } from '../../PerformanceEditor';

export default async function EditPerformancePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <PerformanceEditor editId={id} />;
}
