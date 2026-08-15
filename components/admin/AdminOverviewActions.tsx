"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Banknote,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminOverviewAction } from "@/types/admin";

const ICONS: Record<AdminOverviewAction["icon"], LucideIcon> = {
  userPlus: UserPlus,
  users: Users,
  banknote: Banknote,
};

const ACTIONS: AdminOverviewAction[] = [
  {
    href: "/admin/employees/new",
    ariaLabel: "Create a new employee account",
    icon: "userPlus",
    variant: "primary",
  },
  {
    href: "/admin/employees",
    ariaLabel: "Open employees list",
    icon: "users",
    variant: "secondary",
  },
  {
    href: "/admin/payouts",
    ariaLabel: "Open payouts to run a payout cycle",
    icon: "banknote",
    variant: "secondary",
  },
];

export function AdminOverviewActions() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                "inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                isPrimary
                  ? "bg-[var(--color-emerald)] text-white hover:bg-[var(--color-emerald-hover)]"
                  : "border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-cream-tint)]",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
