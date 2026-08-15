import type { AccountTotalsCellProps } from "@/types/admin";

export function AccountTotalsCell({ added, assigned }: AccountTotalsCellProps) {
  return (
    <span
      className="text-[14px] tabular-nums text-[var(--color-ink)]"
      aria-label={`${added} of ${assigned} assigned accounts added`}
    >
      {added}
      <span className="text-[var(--color-muted)]"> / {assigned}</span>
    </span>
  );
}
