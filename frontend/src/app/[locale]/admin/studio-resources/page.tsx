import { redirect } from "next/navigation";

export default function StudioResourcesPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/admin/settings?panel=studio`);
}
