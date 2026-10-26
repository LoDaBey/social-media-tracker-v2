"use client";

import { AnimatePresence } from "framer-motion";
import { SpareAccountsDialog } from "@/components/admin/SpareAccountsDialog";
import type { SpareAccountsModalProps } from "@/types/admin";

export function SpareAccountsModal({
  open,
  onClose,
  accounts,
  holders,
}: SpareAccountsModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <SpareAccountsDialog
          onClose={onClose}
          accounts={accounts}
          holders={holders}
        />
      ) : null}
    </AnimatePresence>
  );
}
