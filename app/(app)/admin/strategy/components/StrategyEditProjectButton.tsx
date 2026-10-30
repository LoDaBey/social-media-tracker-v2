"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import type { StrategyEditProjectButtonProps } from "@/types/strategy";

export function StrategyEditProjectButton({
  name,
  onClick,
}: StrategyEditProjectButtonProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={`Edit ${name} strategy project`}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
    >
      <Pencil className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
    </motion.button>
  );
}
