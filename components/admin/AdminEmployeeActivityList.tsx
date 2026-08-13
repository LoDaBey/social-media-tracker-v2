import { Check, FileText, Gift, MinusCircle, Wallet } from "lucide-react";
import { formatShortDate } from "@/lib/cairo-date";
import type { AdminEmployeeActivityListProps } from "@/types/admin";

function ActivityKindIcon({ kind }: { kind: string }) {
  const className = "h-[18px] w-[18px]";
  if (kind === "submission") return <FileText className={className} aria-hidden="true" />;
  if (kind === "qc") return <Check className={className} aria-hidden="true" />;
  if (kind === "bonus") return <Gift className={className} aria-hidden="true" />;
  if (kind === "payout") return <Wallet className={className} aria-hidden="true" />;
  if (kind === "deduction") return <MinusCircle className={className} aria-hidden="true" />;
  return <Wallet className={className} aria-hidden="true" />;
}

export function AdminEmployeeActivityList({
  items,
}: AdminEmployeeActivityListProps) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-[14px] text-[var(--color-muted)]">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((row, i) => (
        <article
          key={`${row.created_at}-${i}`}
          className="flex gap-4 rounded-2xl bg-[var(--color-surface)] px-5 py-4"
          style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream-tint)] text-[var(--color-emerald)]"
            aria-hidden="true"
          >
            <ActivityKindIcon kind={row.kind} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[var(--color-ink)]">
              {row.description}
            </p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              {formatShortDate(row.created_at)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
