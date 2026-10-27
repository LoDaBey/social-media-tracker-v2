"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileSpreadsheet, Map, ScrollText, UserPlus, Users, type LucideIcon } from "lucide-react";
import type { AdminOverviewAction } from "@/types/admin";

const ICONS: Record<AdminOverviewAction["icon"], LucideIcon> = {
  userPlus: UserPlus,
  users: Users,
  extract: FileSpreadsheet,
  strategy: Map,
  logs: ScrollText,
};

const ACTIONS: AdminOverviewAction[] = [
  {
    href: "/admin/employees/new",
    label: "New employee",
    ariaLabel: "Create a new employee account",
    icon: "userPlus",
    variant: "primary",
  },
  {
    href: "/admin/employees",
    label: "Employees",
    ariaLabel: "Open employees list",
    icon: "users",
    variant: "secondary",
  },
  {
    href: "/admin/extract",
    label: "Extract",
    ariaLabel: "Open data extract tool",
    icon: "extract",
    variant: "secondary",
  },
  {
    href: "/admin/strategy",
    label: "Strategy",
    ariaLabel: "Open strategy plans",
    icon: "strategy",
    variant: "secondary",
  },
  {
    href: "/admin/logs",
    label: "Activity log",
    ariaLabel: "Open Orbit activity log",
    icon: "logs",
    variant: "secondary",
  },
];

export function AdminOverviewActions() {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {ACTIONS.map((action) => {
        const Icon = ICONS[action.icon];
        const isPrimary = action.variant === "primary";

        return (
          <motion.div
            key={action.href}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={action.href}
              aria-label={action.ariaLabel}
              title={action.ariaLabel}
              className={[
                "inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] lg:px-3",
                isPrimary
                  ? "bg-[var(--color-emerald)] text-white hover:bg-[var(--color-emerald-hover)]"
                  : "border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-cream-tint)]",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" strokeWidth={2.25} />
              <span className="hidden whitespace-nowrap text-[13px] font-semibold lg:inline">
                {action.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
