"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SpareAccountsModal } from "@/components/admin/SpareAccountsModal";
import { COMMAND_PALETTE_SPARE_EVENT } from "@/lib/admin-command-palette";
import type { AdminHeaderSpareButtonProps } from "@/types/layout";

export function AdminHeaderSpareButton({
  count,
  accounts,
  holders,
}: AdminHeaderSpareButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(COMMAND_PALETTE_SPARE_EVENT, onOpen);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_SPARE_EVENT, onOpen);
    };
  }, []);

  return (
    <>
      <motion.button
        type="button"
        aria-label={
          count > 0 ? `View ${count} spare accounts` : "View spare accounts"
        }
        aria-current={open ? "true" : undefined}
        onClick={() => setOpen(true)}
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative inline-flex h-16 cursor-pointer items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-[var(--color-muted)] outline-none hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        Spare
        {count > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-gold)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--color-ink)] tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </motion.button>
      <SpareAccountsModal
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        holders={holders}
      />
    </>
  );
}
