"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet } from "lucide-react";
import { BulkImportModal } from "@/components/admin/BulkImportModal";
import type { EmployeesBulkImportButtonProps } from "@/types/admin";

export function EmployeesBulkImportButton({
  holders,
  initialHolderId,
  variant = "icon",
}: EmployeesBulkImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        {variant === "button" ? (
          <button
            type="button"
            aria-label="Bulk import accounts from Excel"
            disabled={holders.length === 0}
            onClick={() => setOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Bulk import
          </button>
        ) : (
          <button
            type="button"
            aria-label="Bulk import accounts from Excel"
            title="Bulk import accounts"
            disabled={holders.length === 0}
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </motion.div>
      <BulkImportModal
        open={open}
        holders={holders}
        initialHolderId={initialHolderId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
