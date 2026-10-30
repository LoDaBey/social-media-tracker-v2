"use client";

import { motion } from "framer-motion";
import type { StrategyEmptyStateProps } from "@/types/strategy";

export function StrategyEmptyState({ onCreate }: StrategyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-12 text-center">
      <p className="text-[14px] text-[var(--color-muted)]">
        No strategy projects yet. Create one to plan holdings and the handler template.
      </p>
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreate}
        aria-label="Create the first strategy project"
        className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        New project
      </motion.button>
    </div>
  );
}
