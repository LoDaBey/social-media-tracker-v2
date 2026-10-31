"use client";

import { useEffect, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { StrategyDeleteSubProjectModalProps } from "@/types/strategy";

function StrategyDeleteSubProjectModalFrame({
  name,
  onClose,
  onConfirm,
}: Omit<StrategyDeleteSubProjectModalProps, "open">) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close delete sub-project dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={onClose}
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-strategy-subproject-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="relative z-10 my-4 w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="delete-strategy-subproject-title"
              className="text-[20px] font-extrabold text-[var(--color-ink)]"
            >
              Delete {name}?
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              This removes the nested project from this book. Save the parent
              to keep the change.
            </p>
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Close delete sub-project dialog"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Cancel delete sub-project"
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Confirm delete ${name} sub-project`}
            className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[var(--color-coral)] px-4 text-[13px] font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
          >
            Delete sub-project
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

export function StrategyDeleteSubProjectModal({
  open,
  name,
  onClose,
  onConfirm,
}: StrategyDeleteSubProjectModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <StrategyDeleteSubProjectModalFrame
          name={name}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </AnimatePresence>
  );
}
