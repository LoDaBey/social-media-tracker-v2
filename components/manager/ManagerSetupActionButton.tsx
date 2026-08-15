"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ManagerSetupActionButtonProps } from "@/types/manager";

export function ManagerSetupActionButton({
  href,
  setupComplete,
  fullName,
}: ManagerSetupActionButtonProps) {
  if (setupComplete) {
    return (
      <button
        type="button"
        disabled
        aria-label={`Setup already complete for ${fullName}`}
        title={`Setup already complete for ${fullName}`}
        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-[var(--color-muted)] opacity-50 outline-none"
      >
        <Plus className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
      </button>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
    >
      <Link
        href={href}
        aria-label={`Add accounts for ${fullName}`}
        title={`Add accounts for ${fullName}`}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Plus className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
      </Link>
    </motion.div>
  );
}
