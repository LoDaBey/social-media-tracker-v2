"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { balanceAdminCoverageSpare } from "@/actions/admin-balance-spare";
import { BalanceCoverageResult } from "@/app/(app)/admin/components/BalanceCoverageResult";
import type {
  BalanceCoverageDialogProps,
  BalanceCoverageSpareResult,
} from "@/types/admin";

export function BalanceCoverageDialog({
  onClose,
  region,
}: BalanceCoverageDialogProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<BalanceCoverageSpareResult | null>(
    null
  );
  const [pending, startTransition] = useTransition();

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

  useEffect(() => {
    let cancelled = false;
    void balanceAdminCoverageSpare(region, false).then((result) => {
      if (cancelled) return;
      setPreview(result);
      if (result.error) toast.error(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [region]);

  function loadPreview() {
    startTransition(async () => {
      const result = await balanceAdminCoverageSpare(region, false);
      setPreview(result);
      if (result.error) toast.error(result.error);
    });
  }

  function apply() {
    startTransition(async () => {
      const result = await balanceAdminCoverageSpare(region, true);
      setPreview(result);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const marked = result.marked.length;
      const unmarked = result.unmarked.length;
      if (marked === 0 && unmarked === 0) {
        toast.success("No spare changes were needed.");
      } else {
        toast.success(`Marked ${marked} spare, unmarked ${unmarked}.`);
      }
      router.refresh();
    });
  }

  const applied = Boolean(preview?.applied);
  const canApply =
    !applied &&
    preview &&
    !preview.error &&
    (preview.marked.length > 0 || preview.unmarked.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close fit to plan dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="balance-coverage-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-3xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="balance-coverage-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Fit accounts to plan
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              Extra live accounts are marked spare until each platform matches
              the {region} plan. Spare accounts are unmarked where a platform is
              short. If a country still cannot reach its goal, the missing slots
              are listed and no spare is left to use.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close fit to plan"
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-5">
          {preview ? (
            <BalanceCoverageResult result={preview} />
          ) : (
            <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
              Checking extras and gaps against the plan…
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Refresh spare preview"
            disabled={pending}
            onClick={loadPreview}
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && !applied ? "Working…" : "Refresh preview"}
          </motion.button>
          {canApply ? (
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Apply spare changes to match the plan"
              disabled={pending}
              onClick={apply}
              className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Applying…" : "Apply to plan"}
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
