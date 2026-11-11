"use client";

import { usePathname } from "next/navigation";
import { LayoutGroup } from "framer-motion";
import { AdminHeaderNavItem } from "@/components/layout/AdminHeaderNavItem";
import { AdminHeaderSpareButton } from "@/components/layout/AdminHeaderSpareButton";
import { ADMIN_NAV_PAGES } from "@/lib/admin-nav-pages";
import type { AdminHeaderNavLink, AdminHeaderNavProps } from "@/types/layout";

function isActive(pathname: string, link: AdminHeaderNavLink) {
  if (link.match === "exact") return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AdminHeaderNav({
  spareCount,
  spareAccounts,
  spareHolders,
  allowedPages,
}: AdminHeaderNavProps) {
  const pathname = usePathname();
  const allowed = new Set(allowedPages);
  const links = ADMIN_NAV_PAGES.filter((link) => allowed.has(link.pageKey)).map(
    (link) => ({
      href: link.href,
      label: link.label,
      match: link.match,
    })
  );
  const showSpare = allowed.has("spare");
  const beforeSpare = links.filter(
    (link) =>
      link.href === "/admin" ||
      link.href === "/admin/employees" ||
      link.href === "/admin/extract"
  );
  // Everything after Spare, in ADMIN_NAV_PAGES order (Strategy, Weekly checks, Activity…).
  const afterSpare = links.filter((link) => !beforeSpare.includes(link));

  return (
    <LayoutGroup id="admin-header-nav">
      <nav
        className="flex h-full min-w-0 items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Admin sections"
      >
        {beforeSpare.map((link) => (
          <AdminHeaderNavItem
            key={link.href}
            link={link}
            active={isActive(pathname, link)}
          />
        ))}
        {showSpare ? (
          <AdminHeaderSpareButton
            count={spareCount}
            accounts={spareAccounts}
            holders={spareHolders}
          />
        ) : null}
        {afterSpare.map((link) => (
          <AdminHeaderNavItem
            key={link.href}
            link={link}
            active={isActive(pathname, link)}
          />
        ))}
      </nav>
    </LayoutGroup>
  );
}
