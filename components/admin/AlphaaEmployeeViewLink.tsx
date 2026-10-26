"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { adminEmployeeHref } from "@/lib/admin-view";
import type { AlphaaEmployeeViewLinkProps } from "@/types/admin";

export function AlphaaEmployeeViewLink({
  employeeId,
  fullName,
}: AlphaaEmployeeViewLinkProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Link
        href={adminEmployeeHref(employeeId, "alphaa")}
        aria-label={`View and edit ${fullName} ALPHAA profile`}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <Eye className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
      </Link>
    </motion.div>
  );
}
