"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { processPayout } from "@/actions/admin";

type Props = {
  userId: number;
  daysToPayout: number;
  canForce: boolean;
};

export function ProcessPayoutBar({ userId, daysToPayout, canForce }: Props) {
  const router = useRouter();
  const [force, setForce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enabled = daysToPayout <= 0 || (canForce && force);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        await processPayout(userId, {
          force: daysToPayout > 0 && force,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Payout failed.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {canForce && daysToPayout > 0 ? (
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="cursor-pointer rounded border-[var(--color-hairline)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          />
          Admin override (pay before cycle end)
        </label>
      ) : null}
      {error ? (
        <p className="max-w-sm text-right text-[13px] text-[var(--color-coral)]">{error}</p>
      ) : null}
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={!enabled || pending}
        onClick={run}
        aria-label="Run payout for this employee now"
        className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Processing…" : "Run payout now"}
      </motion.button>
    </div>
  );
}
