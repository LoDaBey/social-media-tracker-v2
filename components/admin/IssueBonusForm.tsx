"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { issueBonus } from "@/actions/admin";

type Props = {
  userId: number;
};

export function IssueBonusForm({ userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!reason.trim()) {
      setError("Enter a reason.");
      return;
    }
    startTransition(async () => {
      try {
        await issueBonus(userId, n, reason.trim());
        setOpen(false);
        setAmount("");
        setReason("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not issue bonus.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close manual bonus form" : "Open manual bonus form"}
        className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        Issue manual bonus
      </motion.button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full overflow-hidden rounded-[14px] bg-[var(--color-cream-tint)] p-4"
            style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
          >
            <p className="text-[14px] font-semibold text-[var(--color-ink)]">Manual bonus</p>
            {error ? (
              <p className="mt-2 text-[13px] text-[var(--color-coral)]">{error}</p>
            ) : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--color-muted)]">
                Amount (EGP)
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--color-muted)]">
                Reason
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                />
              </label>
            </div>
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={pending}
              onClick={confirm}
              aria-label="Confirm manual bonus"
              className="mt-4 cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-40"
            >
              {pending ? "Saving…" : "Confirm bonus"}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
