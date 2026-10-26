import type { AdminCoverageCountCellProps } from "@/types/admin";

export function AdminCoverageCountCell({
  count,
  label,
}: AdminCoverageCountCellProps) {
  const met = count.target > 0 && count.actual >= count.target;
  const short = count.actual < count.target;
  const extra = count.target === 0 && count.actual > 0;
  const tone = met
    ? "text-[var(--color-emerald)]"
    : extra
      ? "text-[#E08A2C]"
      : short
        ? "text-[var(--color-coral)]"
        : "text-[var(--color-ink)]";

  return (
    <span
      className={`inline-flex whitespace-nowrap text-[13px] font-semibold tabular-nums ${tone}`}
      aria-label={`${label}: ${count.actual} of ${count.target} planned`}
    >
      {count.actual}
      <span className="font-medium text-[var(--color-muted)]">&nbsp;/ {count.target}</span>
    </span>
  );
}
