"use client";

import { motion } from "framer-motion";
import { DownloadCloud } from "lucide-react";

export function HistoryDownloadButton() {
  return (
    <motion.button
      type="button"
      aria-label="Download cycle statement (coming soon)"
      title="Export as PDF — coming soon"
      className="cursor-pointer rounded-lg p-2 text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        // TODO: export cycle as PDF
      }}
    >
      <DownloadCloud className="h-5 w-5" aria-hidden="true" />
    </motion.button>
  );
}
