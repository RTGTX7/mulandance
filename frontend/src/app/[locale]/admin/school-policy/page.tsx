import { redirect } from "next/navigation";

export default function AdminSchoolPolicyPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/admin/settings?panel=policy`);
}
