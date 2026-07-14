import { redirect } from "next/navigation";

export default function AdminAccountsPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/admin/settings?panel=accounts`);
}
