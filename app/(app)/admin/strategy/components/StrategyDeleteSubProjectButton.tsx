"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { StrategyDeleteSubProjectButtonProps } from "@/types/strategy";

export function StrategyDeleteSubProjectButton({
  name,
  onClick,
}: StrategyDeleteSubProjectButtonProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={`Delete ${name} sub-project`}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-coral)] outline-none hover:bg-[var(--color-coral-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
    </motion.button>
  );
}
