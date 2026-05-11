"use client";

import { Eye } from "lucide-react";
import {
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_TINTS,
} from "@/lib/platform-config";
import type { PlatformDailyStatus, PlatformRowProps } from "@/types/dashboard";
import type { TempSocialMediaAccount } from "@/types/db";

function formatHandlePreview(accounts: TempSocialMediaAccount[]) {
  const handles = accounts.map((account) => account.account_handle ?? `@${account.account_name}`);
  const preview = handles.slice(0, 2).join(", ");
  const rest = handles.length - 2;

  if (rest > 0) return `${preview} +${rest} more`;
  return preview || "No accounts yet";
}

function formatSubmittedTime(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function statusChip(status: PlatformDailyStatus) {
  const { totalAccounts, submittedAccounts, autoResetAccounts, lastSubmittedAt } = status;

  if (totalAccounts > 0 && autoResetAccounts === totalAccounts) {
    return {
      label: "Auto-reset · 0 logged",
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  if (autoResetAccounts > 0) {
    return {
      label: `Mixed · ${submittedAccounts} done, ${autoResetAccounts} reset`,
      className: "bg-[var(--color-cream-tint)] text-[var(--color-muted)]",
    };
  }

  if (totalAccounts > 0 && submittedAccounts === totalAccounts) {
    return {
      label: `Submitted ✓ ${formatSubmittedTime(lastSubmittedAt)}`,
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  if (submittedAccounts > 0) {
    return {
      label: `${submittedAccounts} of ${totalAccounts} done`,
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  return {
    label: "Pending today",
    className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
  };
}

export function PlatformRow({
  platform,
  accounts,
  status,
  onSubmitPlatform,
  justSubmitted,
}: PlatformRowProps) {
  const Icon = PLATFORM_ICONS[platform];
  const chip = statusChip(status);
  const pendingAccounts =
    status.totalAccounts - status.submittedAccounts - status.autoResetAccounts;
  const progress =
    status.totalAccounts === 0 ? 0 : (status.submittedAccounts / status.totalAccounts) * 100;

  return (
    <article
      className="relative flex flex-col gap-4 overflow-hidden border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 sm:px-6 md:flex-row md:items-center"
      style={{
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(20,20,20,.035), 0 10px 24px rgba(20,20,20,.04)",
      }}
      aria-label={`${PLATFORM_LABELS[platform]} dashboard row`}
    >
      {justSubmitted ? (
        <div className="pointer-events-none absolute right-14 top-6 h-8 w-8" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className="submission-confetti-dot absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]"
              style={{ ["--dot-index" as string]: index }}
            />
          ))}
        </div>
      ) : null}

      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
        style={{ background: PLATFORM_TINTS[platform] }}
        aria-hidden="true"
      >
        <Icon className="text-[var(--color-ink)]" size={24} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold text-[var(--color-ink)]">
          {PLATFORM_LABELS[platform]} · {accounts.length}{" "}
          {accounts.length === 1 ? "account" : "accounts"}
        </p>
        <p className="mt-1 truncate text-[13px] font-medium text-[var(--color-muted)]">
          {formatHandlePreview(accounts)}
        </p>

        {status.submittedAccounts > 0 ? (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--color-cream-tint)]">
            <div
              className="h-full rounded-full bg-[var(--color-emerald)]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 md:w-[190px] md:flex-col md:items-end">
        <span
          className={[
            "inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold",
            chip.className,
          ].join(" ")}
        >
          {chip.label}
        </span>

        {pendingAccounts > 0 ? (
          <button
            type="button"
            onClick={() => onSubmitPlatform?.(platform)}
            aria-label={`Submit ${PLATFORM_LABELS[platform]} accounts`}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[var(--color-emerald)] px-5 text-[14px] font-bold text-white outline-none transition-colors hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            {pendingAccounts === 1 ? "Submit account" : `Submit ${pendingAccounts} accounts`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmitPlatform?.(platform)}
            aria-label={`View ${PLATFORM_LABELS[platform]} submissions`}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-[14px] font-semibold text-[var(--color-emerald)] outline-none transition-colors hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            View
          </button>
        )}
      </div>
    </article>
  );
}
