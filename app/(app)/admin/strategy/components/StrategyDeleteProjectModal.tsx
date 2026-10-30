"use client";

import { useEffect, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { StrategyDeleteProjectModalProps } from "@/types/strategy";

function StrategyDeleteProjectModalFrame({
  pending,
  error,
  name,
  onClose,
  onConfirm,
}: Omit<StrategyDeleteProjectModalProps, "open">) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, pending]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close delete project dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-strategy-project-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="relative z-10 my-4 w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="delete-strategy-project-title"
              className="text-[20px] font-extrabold text-[var(--color-ink)]"
            >
              Delete {name}?
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              This removes the project tab and its holdings. You can create it again later.
            </p>
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            disabled={pending}
            aria-label="Close delete project dialog"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-[13px] font-medium text-[var(--color-coral)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            disabled={pending}
            aria-label="Cancel delete project"
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            aria-label={`Confirm delete ${name} strategy project`}
            className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[var(--color-coral)] px-4 text-[13px] font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Deleting…" : "Delete project"}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

export function StrategyDeleteProjectModal({
  open,
  pending,
  error,
  name,
  onClose,
  onConfirm,
}: StrategyDeleteProjectModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <StrategyDeleteProjectModalFrame
          pending={pending}
          error={error}
          name={name}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </AnimatePresence>
  );
}
