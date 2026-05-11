import Link from "next/link";
import { PLATFORM_ICONS, PLATFORM_LABELS, PLATFORM_TINTS } from "@/lib/platform-config";
import type { QcQueueRow } from "@/types/qc";

type Props = {
  row: QcQueueRow;
  isSelected: boolean;
  hrefSearch: string;
};

function initialOf(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function relativeAgo(iso: string | null) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";

  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatEgp(amount: number) {
  return Math.round(Math.abs(amount)).toLocaleString("en-US");
}

function statusChip(row: QcQueueRow) {
  const submittedRef = row.submitted_at ?? row.created_at;
  const ago = relativeAgo(submittedRef);

  if (row.qc_status === "pending") {
    return {
      text: ago ? `Pending · ${ago}` : "Pending",
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  if (row.qc_status === "approved") {
    return {
      text: "Approved",
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  if (row.qc_status === "rejected_with_deduction") {
    return {
      text: `Rejected · −${formatEgp(Number(row.qc_decision_amount))} EGP`,
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  return {
    text: "Rejected · no deduction",
    className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
  };
}

export function QcQueueItem({ row, isSelected, hrefSearch }: Props) {
  const Icon = PLATFORM_ICONS[row.account_platform];
  const handle = row.account_handle ?? `@${row.account_name}`;
  const chip = statusChip(row);

  return (
    <Link
      href={`/qc?${hrefSearch}`}
      scroll={false}
      aria-label={`Open submission for ${row.employee_full_name} on ${PLATFORM_LABELS[row.account_platform]}`}
      aria-current={isSelected ? "true" : undefined}
      className={[
        "block rounded-[14px] outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        isSelected
          ? "border-l-[2px] border-[var(--color-emerald)] bg-[var(--color-emerald-tint)]"
          : "border border-[var(--color-hairline)] bg-[var(--color-surface)] hover:bg-[var(--color-cream-tint)]",
      ].join(" ")}
      style={{ padding: "14px 16px" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[13px] font-bold text-[var(--color-ink)]"
          aria-hidden="true"
        >
          {initialOf(row.employee_full_name)}
        </div>
        <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--color-ink)]">
          {row.employee_full_name}
        </p>
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]"
          style={{ background: PLATFORM_TINTS[row.account_platform] }}
          aria-hidden="true"
        >
          <Icon className="text-[var(--color-ink)]" size={14} />
        </div>
      </div>

      <p
        className="mt-1.5 truncate text-[13px] font-medium text-[var(--color-muted)]"
      >
        {handle}
      </p>

      <div className="mt-1.5">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
            chip.className,
          ].join(" ")}
        >
          {chip.text}
        </span>
      </div>
    </Link>
  );
}
