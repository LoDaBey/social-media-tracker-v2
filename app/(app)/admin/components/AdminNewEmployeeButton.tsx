"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

export function AdminNewEmployeeButton() {
  return (
    <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href="/admin/employees/new"
        aria-label="Create a new employee account"
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" strokeWidth={2.25} />
        New employee
      </Link>
    </motion.div>
  );
}
