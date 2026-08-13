"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_TINTS,
  type Platform,
} from "@/lib/platform-config";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow, SetupRowFieldErrors } from "@/types/setup";
import { isSetupAccountRowComplete } from "@/lib/setup-validation";
import { AddAccountButton } from "@/components/setup/AddAccountButton";
import { SetupAccountRowFields } from "@/components/setup/SetupAccountRowFields";
import { setupCardVariants, setupTransition } from "@/lib/setup-motion";

type Props = {
  platform: Platform;
  targetCount: number;
  existingAccounts: TempSocialMediaAccount[];
  rows: SetupAccountRow[];
  fieldErrors: SetupRowFieldErrors;
  onChangeRow: (idx: number, patch: Partial<SetupAccountRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (idx: number) => void;
};

function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function ProgressDial({ value }: { value: number }) {
  const size = 28;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp01(value);
  const dash = c * pct;
  const gap = c - dash;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Progress"
      role="img"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-hairline)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-emerald)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function PlatformAccountsCard({
  platform,
  targetCount,
  existingAccounts,
  rows,
  fieldErrors,
  onChangeRow,
  onAddRow,
  onRemoveRow,
}: Props) {
  const Icon = PLATFORM_ICONS[platform];
  const validAdded = rows.filter((r) => isSetupAccountRowComplete(r, platform)).length;

  const added = rows.length;
  const progress = targetCount === 0 ? 1 : validAdded / targetCount;
  const atTarget = targetCount > 0 && validAdded === targetCount;
  const over = targetCount > 0 ? Math.max(0, added - targetCount) : 0;

  const canAddMore = added < targetCount;
  const canRemove = useMemo(() => {
    if (rows.length > 1) return true;
    return existingAccounts.length > 0;
  }, [existingAccounts.length, rows.length]);

  return (
    <motion.section
      className="min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-hairline)] p-4 sm:p-6 md:p-7"
      style={{
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
        maxHeight: 720,
      }}
      data-setup-needs-accounts={canAddMore ? "true" : undefined}
      aria-label={`${PLATFORM_LABELS[platform]} accounts card`}
      variants={setupCardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <motion.div
        className="sticky top-0 bg-[var(--color-surface)]"
        style={{ paddingBlockEnd: 12, zIndex: 10 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={setupTransition}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: PLATFORM_TINTS[platform],
              }}
              aria-hidden="true"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <Icon className="text-[var(--color-ink)]" size={22} />
            </motion.div>

            <div className="flex flex-col">
              <p
                className="text-[18px] font-bold text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-cairo)", fontWeight: 700 }}
              >
                {PLATFORM_LABELS[platform]}
              </p>
              <p
                className="text-[13px] text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
              >
                {validAdded} of {targetCount} added
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {atTarget ? (
                <motion.span
                  key="met"
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-emerald)] bg-[var(--color-emerald-tint)] px-2 py-1 text-[11px] font-semibold text-[var(--color-emerald)]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={setupTransition}
                >
                  Target met <Check className="h-3 w-3" aria-hidden="true" />
                </motion.span>
              ) : null}
            </AnimatePresence>
            <ProgressDial value={progress} />
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--color-cream-tint)]">
          <motion.div
            className="h-full rounded-full bg-[var(--color-emerald)]"
            initial={false}
            animate={{
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            }}
            transition={setupTransition}
            aria-hidden="true"
          />
        </div>
      </motion.div>

      <div className="mt-4 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {rows.map((row, idx) => (
            <SetupAccountRowFields
              key={row.id}
              platform={platform}
              platformLabel={PLATFORM_LABELS[platform]}
              row={row}
              index={idx}
              fieldErrors={fieldErrors[row.id]}
              canRemove={canRemove}
              onChange={(patch) => onChangeRow(idx, patch)}
              onRemove={() => onRemoveRow(idx)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 min-w-0">
        <AddAccountButton
          ariaLabel={`Add ${PLATFORM_LABELS[platform]} account`}
          disabled={!canAddMore}
          onClick={onAddRow}
        />

        {over > 0 ? (
          <p
            className="mt-3 text-[13px] font-medium text-[var(--color-coral)]"
            style={{ fontFamily: "var(--font-cairo)" }}
          >
            You&apos;ve added more than your target ({over}). Remove {over} to
            continue.
          </p>
        ) : null}
      </div>
    </motion.section>
  );
}

