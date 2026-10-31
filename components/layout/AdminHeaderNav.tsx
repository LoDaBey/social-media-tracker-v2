"use client";

import { usePathname } from "next/navigation";
import { LayoutGroup } from "framer-motion";
import { AdminHeaderNavItem } from "@/components/layout/AdminHeaderNavItem";
import { AdminHeaderSpareButton } from "@/components/layout/AdminHeaderSpareButton";
import type { AdminHeaderNavLink, AdminHeaderNavProps } from "@/types/layout";

const LINKS: AdminHeaderNavLink[] = [
  { href: "/admin", label: "Overview", match: "exact" },
  { href: "/admin/employees", label: "Employees", match: "prefix" },
  { href: "/admin/strategy", label: "Strategy", match: "prefix" },
  { href: "/admin/logs", label: "Activity", match: "prefix" },
];

function isActive(pathname: string, link: AdminHeaderNavLink) {
  if (link.match === "exact") return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AdminHeaderNav({
  spareCount,
  spareAccounts,
  spareHolders,
}: AdminHeaderNavProps) {
  const pathname = usePathname();

  return (
    <LayoutGroup id="admin-header-nav">
      <nav
        className="flex h-full min-w-0 items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Admin sections"
      >
        {LINKS.slice(0, 2).map((link) => (
          <AdminHeaderNavItem
            key={link.href}
            link={link}
            active={isActive(pathname, link)}
          />
        ))}
        <AdminHeaderSpareButton
          count={spareCount}
          accounts={spareAccounts}
          holders={spareHolders}
        />
        {LINKS.slice(2).map((link) => (
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
