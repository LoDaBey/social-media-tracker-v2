"use client";

import { AnimatePresence } from "framer-motion";
import { BalanceCoverageDialog } from "@/app/(app)/admin/components/BalanceCoverageDialog";
import type { BalanceCoverageModalProps } from "@/types/admin";

export function BalanceCoverageModal({
  open,
  onClose,
  region,
}: BalanceCoverageModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <BalanceCoverageDialog onClose={onClose} region={region} />
      ) : null}
    </AnimatePresence>
  );
}
