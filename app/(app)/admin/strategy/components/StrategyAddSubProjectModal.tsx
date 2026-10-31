"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { StrategyLanguageSelect } from "./StrategyLanguageSelect";
import type { StrategyAddSubProjectModalProps } from "@/types/strategy";

const fieldClass =
  "h-10 w-full cursor-text rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

function StrategyAddSubProjectModalFrame({
  error,
  onClose,
  onCreate,
}: Omit<StrategyAddSubProjectModalProps, "open">) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    nameRef.current?.focus();
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
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, language });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close add sub-project dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={onClose}
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-strategy-subproject-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="relative z-10 my-4 w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="add-strategy-subproject-title"
              className="text-[20px] font-extrabold text-[var(--color-ink)]"
            >
              New sub-project
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              Nested books sit inside this project — Turkey under ALPHAA, or a
              country under Africa or Europe.
            </p>
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Close add sub-project dialog"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        <label className="mt-5 flex flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
          Sub-project name
          <input
            ref={nameRef}
            type="text"
            required
            maxLength={60}
            value={name}
            aria-label="Sub-project name"
            placeholder="Turkey, Iran, Kenya…"
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </label>

        <div className="mt-4">
          <StrategyLanguageSelect
            id="add-strategy-subproject-language"
            label="Language"
            value={language}
            allowEmpty
            emptyLabel="None"
            onChange={setLanguage}
          />
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
            aria-label="Cancel add sub-project"
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={name.trim().length === 0}
            aria-label="Create sub-project"
            className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Add sub-project
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

export function StrategyAddSubProjectModal({
  open,
  error,
  onClose,
  onCreate,
}: StrategyAddSubProjectModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <StrategyAddSubProjectModalFrame
          error={error}
          onClose={onClose}
          onCreate={onCreate}
        />
      ) : null}
    </AnimatePresence>
  );
}
