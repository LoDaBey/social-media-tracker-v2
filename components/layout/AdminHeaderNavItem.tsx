"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { AdminHeaderNavItemProps } from "@/types/layout";

export function AdminHeaderNavItem({ link, active }: AdminHeaderNavItemProps) {
  return (
    <Link
      href={link.href}
      aria-label={`Open ${link.label}`}
      aria-current={active ? "page" : undefined}
      className={[
        "relative inline-flex h-16 shrink-0 cursor-pointer items-center rounded-lg px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        active
          ? "font-semibold text-[var(--color-ink)]"
          : "font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {link.label}
      {active ? (
        <motion.span
          layoutId="admin-header-underline"
          className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--color-emerald)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
    </Link>
  );
}
