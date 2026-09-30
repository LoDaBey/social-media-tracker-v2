"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { SpareAccountsModal } from "@/components/admin/SpareAccountsModal";
import type { SpareAccountsButtonProps } from "@/types/admin";

export function SpareAccountsButton({ accounts }: SpareAccountsButtonProps) {
  const [open, setOpen] = useState(false);
  const count = accounts.length;

  return (
    <>
      <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <button
          type="button"
          aria-label={
            count > 0
              ? `View ${count} spare accounts`
              : "View spare accounts"
          }
          title={
            count > 0 ? `Spare accounts (${count})` : "Spare accounts"
          }
          onClick={() => setOpen(true)}
          className="relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Bookmark className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-gold)] px-1 text-[10px] font-bold text-[var(--color-ink)]">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </button>
      </motion.div>
      <SpareAccountsModal
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
      />
    </>
  );
}
