"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { updateManagerEmployeeCode } from "@/actions/manager-employees";
import type { ManagerEmployeeCodeModalProps } from "@/types/manager";

const fieldClass =
  "rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function ManagerEmployeeCodeModal({
  open,
  employeeId,
  fullName,
  employeeCode,
  onClose,
}: ManagerEmployeeCodeModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <ManagerEmployeeCodeDialog
          employeeId={employeeId}
          fullName={fullName}
          employeeCode={employeeCode}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function ManagerEmployeeCodeDialog({
  employeeId,
  fullName,
  employeeCode,
  onClose,
}: Omit<ManagerEmployeeCodeModalProps, "open">) {
  const router = useRouter();
  const [code, setCode] = useState(employeeCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCode(employeeCode ?? "");
    setError(null);
  }, [employeeId, employeeCode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const dirty = code.trim() !== (employeeCode ?? "").trim();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await updateManagerEmployeeCode(
        employeeId,
        code.trim() === "" ? null : code.trim()
      );
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(`Employee code saved for ${fullName}.`);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close employee code editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-employee-code-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-lg rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="manager-employee-code-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Employee code
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">{fullName}</p>
          </div>
          <motion.button
            type="button"
            aria-label="Close employee code editor"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Employee code
            <input
              value={code}
              aria-label="Employee code"
              onChange={(event) => setCode(event.target.value)}
              className={`cursor-text ${fieldClass}`}
              maxLength={50}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={onClose}
            aria-label="Cancel employee code changes"
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending || !dirty}
            onClick={submit}
            aria-label="Save employee code"
            className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save code"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
