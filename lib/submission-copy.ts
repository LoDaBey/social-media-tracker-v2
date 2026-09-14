/** User-facing copy for daily growth / metrics submissions (not account setup). */

export function submissionPendingButtonLabel(pendingCount: number): string {
  if (pendingCount <= 0) return "View submissions";
  if (pendingCount === 1) return "Submit today's metrics";
  return `Submit today's metrics · ${pendingCount}`;
}

export function submissionPendingButtonAria(
  platformLabel: string,
  pendingCount: number
): string {
  if (pendingCount <= 0) {
    return `View ${platformLabel} submissions for today`;
  }
  if (pendingCount === 1) {
    return `Submit today's metrics for ${platformLabel}`;
  }
  return `Submit today's metrics for ${pendingCount} ${platformLabel} accounts`;
}

export function submissionDrawerSubmitLabel(editableCount: number, isPending: boolean): string {
  if (isPending) return "Submitting…";
  if (editableCount === 0) return "Nothing to submit";
  if (editableCount === 1) return "Submit metrics";
  return `Submit metrics · ${editableCount}`;
}

export function submissionDrawerSubmitAria(editableCount: number): string {
  if (editableCount === 1) {
    return "Submit today's metrics for 1 account";
  }
  return `Submit today's metrics for ${editableCount} accounts`;
}

type PlatformDailyChipInput = {
  totalAccounts: number;
  submittedAccounts: number;
  autoResetAccounts: number;
  lastSubmittedAt?: string | null;
  formatSubmittedTime?: (value: string) => string;
};

export function submissionPlatformStatusChip(
  input: PlatformDailyChipInput
): { label: string; className: string } {
  const {
    totalAccounts,
    submittedAccounts,
    autoResetAccounts,
    lastSubmittedAt,
    formatSubmittedTime,
  } = input;

  if (totalAccounts > 0 && autoResetAccounts === totalAccounts) {
    return {
      label: "All reset — enter new metrics",
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  if (autoResetAccounts > 0) {
    return {
      label: `Some submitted, ${autoResetAccounts} reset`,
      className: "bg-[var(--color-cream-tint)] text-[var(--color-muted)]",
    };
  }

  if (totalAccounts > 0 && submittedAccounts === totalAccounts) {
    const time =
      lastSubmittedAt && formatSubmittedTime
        ? formatSubmittedTime(lastSubmittedAt)
        : "";
    return {
      label: time ? `All submitted · ${time}` : "All submitted today",
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  if (submittedAccounts > 0) {
    return {
      label: `${submittedAccounts} of ${totalAccounts} submitted`,
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  return {
    label: "Not submitted today",
    className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
  };
}

export function submissionDrawerStatusPill(
  accountList: { id: number }[],
  submittedCount: number
): { label: string; className: string } {
  const total = accountList.length;
  if (total === 0) {
    return {
      label: "No accounts",
      className: "bg-[var(--color-cream)] text-[var(--color-muted)]",
    };
  }

  if (submittedCount === 0) {
    return {
      label: "Not submitted today",
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  if (submittedCount >= total) {
    return {
      label: "All submitted today",
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  return {
    label: `${total - submittedCount} left to submit`,
    className: "bg-[var(--color-cream)] text-[var(--color-muted)]",
  };
}
