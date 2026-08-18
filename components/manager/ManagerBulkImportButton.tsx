"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet } from "lucide-react";
import { ManagerBulkImportModal } from "@/components/manager/ManagerBulkImportModal";
import type { ManagerBulkImportButtonProps } from "@/types/manager";

export function ManagerBulkImportButton({
  holder,
  variant = "icon",
}: ManagerBulkImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        {variant === "button" ? (
          <button
            type="button"
            aria-label={`Bulk import accounts for ${holder.full_name}`}
            onClick={() => setOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Bulk import
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Bulk import accounts for ${holder.full_name}`}
            title="Bulk import accounts"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </motion.div>
      <ManagerBulkImportModal
        open={open}
        holder={holder}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
