"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Goal } from "lucide-react";
import { BalanceCoverageModal } from "@/app/(app)/admin/components/BalanceCoverageModal";
import type { BalanceCoverageButtonProps } from "@/types/admin";

export function BalanceCoverageButton({ region }: BalanceCoverageButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <button
          type="button"
          aria-label="Fit live accounts to the coverage plan using spare flags"
          title="Fit accounts to plan"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Goal className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
          <span className="hidden text-[13px] font-semibold sm:inline">
            Fit to plan
          </span>
        </button>
      </motion.div>
      <BalanceCoverageModal
        open={open}
        region={region}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
