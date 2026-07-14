import type { AdminAccount } from "@/lib/api";

export type PermissionAction = "view" | "manage";

export function hasPermission(
  user: Pick<AdminAccount, "role" | "permissions"> | null | undefined,
  key: string,
  action: PermissionAction = "view",
) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return Boolean(user.permissions?.[key]?.[action]);
}

export const ADMIN_ROUTE_PERMISSIONS: Array<{
  path: string;
  permission: string;
}> = [
  { path: "/admin/homepage", permission: "content.homepage" },
  { path: "/admin/categories", permission: "content.news.categories" },
  { path: "/admin/tags", permission: "content.news.tags" },
  { path: "/admin/articles", permission: "content.news.articles" },
  { path: "/admin/editor", permission: "content.news.articles" },
  { path: "/admin/dashboard", permission: "content.news.articles" },
  { path: "/admin/performances", permission: "content.performances" },
  { path: "/admin/programs", permission: "teaching.programs" },
  { path: "/admin/schedules", permission: "teaching.schedules" },
  { path: "/admin/pricing", permission: "teaching.pricing" },
  { path: "/admin/faculty", permission: "teaching.faculty" },
  { path: "/admin/registrations", permission: "teaching.registration" },
  { path: "/admin/classrooms", permission: "classrooms.rentals" },
  { path: "/admin/settings", permission: "system" },
  { path: "/admin/studio-resources", permission: "system.studio" },
  { path: "/admin/school-policy", permission: "system.policy" },
  { path: "/admin/accounts", permission: "system.accounts" },
];

export function firstAllowedAdminRoute(
  user: Pick<AdminAccount, "role" | "permissions">,
) {
  return (
    ADMIN_ROUTE_PERMISSIONS.find((item) => hasPermission(user, item.permission))
      ?.path || "/admin/profile"
  );
}
