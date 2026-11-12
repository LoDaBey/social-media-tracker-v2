import type { AdminPermissionPageKey } from "@/types/permissions";

/** Client-safe admin nav config (no DB / Node imports). */
export const ADMIN_NAV_PAGES: {
  pageKey: AdminPermissionPageKey;
  href: string;
  label: string;
  match: "exact" | "prefix";
}[] = [
  { pageKey: "overview", href: "/admin", label: "Overview", match: "exact" },
  {
    pageKey: "employees",
    href: "/admin/employees",
    label: "Employees",
    match: "prefix",
  },
  {
    pageKey: "extract",
    href: "/admin/extract",
    label: "Extract",
    match: "prefix",
  },
  {
    pageKey: "strategy",
    href: "/admin/strategy",
    label: "Strategy",
    match: "prefix",
  },
  {
    pageKey: "checks",
    href: "/admin/checks",
    label: "Daily checks",
    match: "prefix",
  },
  {
    pageKey: "activity",
    href: "/admin/logs",
    label: "Activity",
    match: "prefix",
  },
];

export function adminHrefForPage(pageKey: AdminPermissionPageKey): string {
  return (
    ADMIN_NAV_PAGES.find((item) => item.pageKey === pageKey)?.href ?? "/admin"
  );
}
