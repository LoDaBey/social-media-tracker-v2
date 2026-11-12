"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { formatCairoDateTime } from "@/lib/cairo-date";
import { adminEmployeeHref } from "@/lib/admin-view";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type {
  WeeklyCheckAccountRow,
  WeeklyChecksProblemsCardProps,
} from "@/types/weekly-checks";

function ProblemsDialog({
  problems,
  onClose,
}: {
  problems: WeeklyCheckAccountRow[];
  onClose: () => void;
}) {
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

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close problems"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-problems-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 flex max-h-[min(85vh,860px)] w-full max-w-3xl flex-col gap-4 rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2
            id="weekly-problems-title"
            className="text-[20px] font-extrabold text-[var(--color-ink)]"
          >
            Problems reported
            <span className="ml-2 tabular-nums text-[var(--color-coral)]">
              {problems.length}
            </span>
          </h2>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Close problems"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {problems.length === 0 ? (
            <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[14px] text-[var(--color-muted)]">
              No problems.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {problems.map((row) => {
                const name = row.username || row.accountName || "Account";
                return (
                  <li
                    key={row.accountId}
                    className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-hairline)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 text-[13px]">
                        {row.country ? (
                          <CountryFlag
                            country={row.country}
                            className="h-4 w-6"
                          />
                        ) : null}
                        <Link
                          href={adminEmployeeHref(row.holderId)}
                          className="truncate font-bold text-[var(--color-ink)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                        >
                          {row.holderName}
                        </Link>
                        <span className="text-[var(--color-muted)]">
                          {PLATFORM_LABELS[row.platform] ?? row.platform} ·{" "}
                          {name}
                        </span>
                      </div>
                      <span className="text-[11px] tabular-nums text-[var(--color-muted)]">
                        {row.check?.checkedByName ?? "—"}
                        {row.check
                          ? ` · ${formatCairoDateTime(row.check.checkedAt)}`
                          : ""}
                      </span>
                    </div>
                    <p className="rounded-lg bg-[var(--color-coral-tint)] px-3 py-2 text-[14px] font-medium text-[var(--color-coral)]">
                      {row.check?.note || "—"}
                    </p>
                    {row.accountUrl ? (
                      <div className="text-[12px]">
                        <AccountUrlCell url={row.accountUrl} label={name} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/** "Problems reported" KPI card: click to read every note the CMs entered. */
export function WeeklyChecksProblemsCard({
  count,
  problems,
}: WeeklyChecksProblemsCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        aria-label={`Problems reported: ${count}. Show the notes`}
        className="flex cursor-pointer flex-col gap-1 rounded-[16px] bg-[var(--color-surface)] px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      >
        <span className="text-[12px] font-semibold text-[var(--color-muted)]">
          Problems reported
        </span>
        <span className="text-[26px] font-extrabold tabular-nums leading-none text-[var(--color-coral)]">
          {count}
        </span>
      </motion.button>
      <AnimatePresence>
        {open ? (
          <ProblemsDialog problems={problems} onClose={() => setOpen(false)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
