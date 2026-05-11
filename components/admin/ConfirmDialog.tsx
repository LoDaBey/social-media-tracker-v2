"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pending = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Dismiss dialog backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 w-full max-w-md rounded-[16px] bg-[var(--color-surface)] p-6 shadow-xl"
          >
            <h2
              id="confirm-dialog-title"
              className="text-[18px] font-bold text-[var(--color-ink)]"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]"
            >
              {description}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <motion.button
                type="button"
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={pending}
                onClick={onCancel}
                aria-label={cancelLabel}
                className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                type="button"
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={pending}
                onClick={onConfirm}
                aria-label={confirmLabel}
                className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
              >
                {pending ? "Working…" : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
