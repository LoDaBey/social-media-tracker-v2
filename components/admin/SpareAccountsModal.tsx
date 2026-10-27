"use client";

import { AnimatePresence } from "framer-motion";
import { SpareAccountsDialog } from "@/components/admin/SpareAccountsDialog";
import type { SpareAccountsModalProps } from "@/types/admin";

export function SpareAccountsModal({
  open,
  onClose,
  accounts,
  holders,
  setSpare,
  subtitle,
}: SpareAccountsModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <SpareAccountsDialog
          onClose={onClose}
          accounts={accounts}
          holders={holders}
          setSpare={setSpare}
          subtitle={subtitle}
        />
      ) : null}
    </AnimatePresence>
  );
}
