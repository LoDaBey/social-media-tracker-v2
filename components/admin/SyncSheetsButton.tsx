"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Sheet } from "lucide-react";
import toast from "react-hot-toast";
import { useSyncSheets } from "@/hooks/useSyncSheets";
import type { SyncSheetsButtonProps } from "@/types/admin";

export function SyncSheetsButton({ variant = "icon" }: SyncSheetsButtonProps) {
  const { syncSheets } = useSyncSheets();
  const [pending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncSheets();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.count != null
          ? `${result.message} (${result.count} accounts)`
          : result.message
      );
    });
  }

  const isPending = pending;

  return (
    <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      {variant === "button" ? (
        <button
          type="button"
          aria-label="Sync accounts to Google Sheets"
          disabled={isPending}
          onClick={handleSync}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sheet className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Syncing…" : "Sync to Sheets"}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Sync accounts to Google Sheets"
          title="Sync accounts to Google Sheets"
          disabled={isPending}
          onClick={handleSync}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sheet className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}
