"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { StrategyNewProjectButtonProps } from "@/types/strategy";

export function StrategyNewProjectButton({ onClick }: StrategyNewProjectButtonProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label="Create a new strategy project"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      New project
    </motion.button>
  );
}
