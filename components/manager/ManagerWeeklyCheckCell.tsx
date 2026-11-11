"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, TriangleAlert, Undo2 } from "lucide-react";
import { setManagerWeeklyCheck } from "@/actions/weekly-checks";
import type { WeeklyCheckResult } from "@/types/weekly-checks";
import type { ManagerWeeklyCheckCellProps } from "@/types/weekly-checks";

const smallButton =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50";

/**
 * One account's weekly check: OK = still active, working, no issues; Problem needs
 * a short note. Once per account per week (Monday to Sunday); Undo clears it.
 */
export function ManagerWeeklyCheckCell({
  accountId,
  accountName,
  check,
  canUpdate,
}: ManagerWeeklyCheckCellProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");

  function save(result: WeeklyCheckResult | null, problem?: string) {
    startTransition(async () => {
      const response = await setManagerWeeklyCheck(accountId, result, problem);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setReporting(false);
      setNote("");
      toast.success(
        result === null
          ? `Check undone for ${accountName}.`
          : result === "ok"
            ? `${accountName} checked OK.`
            : `Problem reported for ${accountName}.`,
      );
      router.refresh();
    });
  }

  if (check) {
    return (
      <div className="flex min-w-[150px] flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {check.result === "ok" ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-emerald-tint)] px-2 py-1 text-[12px] font-bold text-[var(--color-emerald)]">
              <Check
                className="h-3.5 w-3.5"
                aria-hidden="true"
                strokeWidth={2.5}
              />
              Checked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-coral-tint)] px-2 py-1 text-[12px] font-bold text-[var(--color-coral)]">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Problem
            </span>
          )}
          {canUpdate ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => save(null)}
              aria-label={`Undo this week's check for ${accountName}`}
              className={`${smallButton} text-[var(--color-muted)] hover:bg-[var(--color-cream-tint)]`}
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              Undo
            </button>
          ) : null}
        </div>
        {check.result === "issue" && check.note ? (
          <p className="max-w-[220px] text-[12px] text-[var(--color-coral)]">
            {check.note}
          </p>
        ) : null}
      </div>
    );
  }

  if (!canUpdate) {
    return (
      <span className="text-[12px] font-semibold text-[var(--color-amber)]">
        Not checked
      </span>
    );
  }

  if (reporting) {
    return (
      <form
        className="flex min-w-[220px] flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          save("issue", note);
        }}
      >
        <input
          autoFocus
          value={note}
          maxLength={300}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What is wrong? e.g. locked, banned"
          aria-label={`Problem with ${accountName}`}
          className="rounded-lg border border-[var(--color-coral)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
        />
        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={pending || !note.trim()}
            className={`${smallButton} bg-[var(--color-coral)] text-white`}
          >
            Report
          </button>
          <button
            type="button"
            onClick={() => setReporting(false)}
            className={`${smallButton} text-[var(--color-muted)] hover:bg-[var(--color-cream-tint)]`}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex min-w-[150px] items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => save("ok")}
        aria-label={`Mark ${accountName} as checked OK this week`}
        className={`${smallButton} border border-[var(--color-emerald)] text-[var(--color-emerald)] hover:bg-[var(--color-emerald-tint)]`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
        OK
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setReporting(true)}
        aria-label={`Report a problem with ${accountName}`}
        className={`${smallButton} border border-[var(--color-coral)] text-[var(--color-coral)] hover:bg-[var(--color-coral-tint)]`}
      >
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Problem
      </button>
    </div>
  );
}
