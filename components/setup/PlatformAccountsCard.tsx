"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import {
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_TINTS,
  type Platform,
} from "@/lib/platform-config";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow } from "@/types/setup";
import { AddAccountButton } from "@/components/setup/AddAccountButton";
import {
  setupButtonMotion,
  setupCardVariants,
  setupRowVariants,
  setupTransition,
} from "@/lib/setup-motion";

type Props = {
  platform: Platform;
  targetCount: number;
  existingAccounts: TempSocialMediaAccount[];
  rows: SetupAccountRow[];
  onChangeRow: (idx: number, patch: Partial<SetupAccountRow>) => void;
  onBlurHandle: (idx: number) => void;
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
  onChangeRow,
  onBlurHandle,
  onAddRow,
  onRemoveRow,
}: Props) {
  const Icon = PLATFORM_ICONS[platform];
  const validAdded = rows.filter((r) => {
    const handle = r.handle.trim();
    const url = r.url.trim();
    const followers = r.followers.trim();
    if (!handle) return false;
    if (!url) return false;
    if (!followers) return false;
    if (!/^\d+$/.test(followers)) return false;
    return true;
  }).length;

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
      className="bg-[var(--color-surface)] border border-[var(--color-hairline)] p-6 sm:p-7"
      style={{
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
        maxHeight: 480,
        overflow: "auto",
      }}
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
            <motion.div
              key={row.id}
              layout
              className="grid grid-cols-1 gap-3 bg-[#FAF8F2] sm:grid-cols-[1.2fr_2fr_0.8fr_auto]"
              style={{
                borderRadius: 14,
                padding: "14px 16px",
              }}
              variants={setupRowVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-cairo)" }}
              >
                Handle
              </label>
              <input
                value={row.handle}
                placeholder="@username"
                onChange={(e) => onChangeRow(idx, { handle: e.target.value })}
                onBlur={() => onBlurHandle(idx)}
                aria-label={`${PLATFORM_LABELS[platform]} handle ${idx + 1}`}
                className="rounded outline-none border border-[var(--color-hairline)] bg-white px-3 py-2 text-[14px] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-cairo)" }}
              >
                URL
              </label>
              <input
                value={row.url}
                placeholder="https://..."
                onChange={(e) => onChangeRow(idx, { url: e.target.value })}
                aria-label={`${PLATFORM_LABELS[platform]} URL ${idx + 1}`}
                className="rounded outline-none border border-[var(--color-hairline)] bg-white px-3 py-2 text-[14px] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
                style={{ fontFamily: "var(--font-cairo)" }}
              >
                Followers
              </label>
              <input
                inputMode="numeric"
                value={row.followers}
                placeholder="0"
                onChange={(e) =>
                  onChangeRow(idx, {
                    followers: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                aria-label={`${PLATFORM_LABELS[platform]} followers ${idx + 1}`}
                className="rounded outline-none border border-[var(--color-hairline)] bg-white px-3 py-2 text-[14px] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
              />
            </div>

            <div className="flex items-end justify-end">
              <motion.button
                type="button"
                aria-label={`Remove ${PLATFORM_LABELS[platform]} row ${idx + 1}`}
                disabled={!canRemove}
                onClick={() => onRemoveRow(idx)}
                className={[
                  "cursor-pointer rounded-lg",
                  "h-10 w-10",
                  "flex items-center justify-center",
                  "border border-[var(--color-hairline)] bg-white",
                  "text-[var(--color-muted)]",
                  "hover:bg-[var(--color-cream-tint)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                ].join(" ")}
                {...setupButtonMotion(!canRemove)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4">
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

