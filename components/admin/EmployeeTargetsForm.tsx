"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { updateEmployeeTargets } from "@/actions/admin";
import {
  PLATFORM_LABELS,
  PLATFORM_TARGET_COLUMNS,
  PLATFORMS,
  type Platform,
} from "@/lib/platform-config";
import type { UpdateEmployeeTargetsPayload } from "@/types/admin";

type Props = {
  userId: number;
  initial: UpdateEmployeeTargetsPayload;
  activeCounts: Record<string, number>;
};

function fieldForPlatform(p: Platform): keyof UpdateEmployeeTargetsPayload {
  return PLATFORM_TARGET_COLUMNS[p] as keyof UpdateEmployeeTargetsPayload;
}

export function EmployeeTargetsForm({ userId, initial, activeCounts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  const warnReduce = useMemo(() => {
    const issues: string[] = [];
    for (const p of PLATFORMS) {
      const key = fieldForPlatform(p);
      const target = form[key];
      const have = activeCounts[p] ?? 0;
      if (target < have) {
        issues.push(PLATFORM_LABELS[p]);
      }
    }
    return issues;
  }, [form, activeCounts]);

  function setField(key: keyof UpdateEmployeeTargetsPayload, next: number) {
    setForm((f) => ({ ...f, [key]: Math.max(0, next) }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateEmployeeTargets(userId, form);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {warnReduce.length > 0 ? (
        <div
          className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950"
          role="alert"
        >
          Reducing the {warnReduce.join(", ")} target below current account count won&apos;t
          remove existing accounts. You&apos;ll need to archive accounts manually.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-2 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => {
          const key = fieldForPlatform(p);
          const val = form[key];
          const have = activeCounts[p] ?? 0;
          return (
            <div
              key={p}
              className="rounded-[14px] bg-[var(--color-cream-tint)] px-4 py-4"
              style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
            >
              <p className="text-[13px] font-semibold text-[var(--color-ink)]">
                {PLATFORM_LABELS[p]}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${PLATFORM_LABELS[p]} target`}
                  className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[16px] font-bold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  onClick={() => setField(key, val - 1)}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => setField(key, Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-center text-[16px] font-bold tabular-nums text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                />
                <button
                  type="button"
                  aria-label={`Increase ${PLATFORM_LABELS[p]} target`}
                  className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[16px] font-bold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  onClick={() => setField(key, val + 1)}
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                Currently has {have} account{have === 1 ? "" : "s"} on this platform
              </p>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap gap-3 border-t border-[var(--color-hairline)] bg-[var(--color-cream)] px-4 py-4 sm:-mx-8">
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={pending}
          onClick={submit}
          aria-label="Save target changes"
          className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-5 py-2.5 text-[14px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save targets"}
        </motion.button>
      </div>
    </div>
  );
}
