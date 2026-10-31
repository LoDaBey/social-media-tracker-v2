"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { StrategyAddSubProjectButtonProps } from "@/types/strategy";

export function StrategyAddSubProjectButton({
  onClick,
}: StrategyAddSubProjectButtonProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label="Add a sub-project"
      className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-[var(--color-emerald)] outline-none hover:bg-[var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
    >
      <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
      Add
    </motion.button>
  );
}
