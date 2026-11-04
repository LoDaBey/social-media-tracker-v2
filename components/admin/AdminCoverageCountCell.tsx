import type { AdminCoverageCountCellProps } from "@/types/admin";

export function AdminCoverageCountCell({
  count,
  label,
}: AdminCoverageCountCellProps) {
  const met = count.target > 0 && count.actual >= count.target;
  const short = count.actual < count.target;
  const extra = count.target === 0 && count.actual > 0;

  if (short) {
    return (
      <span
        className="inline-flex items-center whitespace-nowrap rounded-md bg-[var(--color-coral)] px-2 py-0.5 text-[13px] font-extrabold tabular-nums text-white shadow-[0_0_0_1px_rgba(180,40,40,.35)]"
        aria-label={`${label}: ${count.actual} of ${count.target} planned — shortfall`}
      >
        {count.actual}
        <span className="font-bold text-white/90">&nbsp;/ {count.target}</span>
      </span>
    );
  }

  const tone = met
    ? "text-[var(--color-emerald)]"
    : extra
      ? "text-[var(--color-amber)]"
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
