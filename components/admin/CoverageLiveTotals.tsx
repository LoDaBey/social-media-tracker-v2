import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import type { CoverageLiveTotalsProps } from "@/types/admin";

export function CoverageLiveTotals({
  resources,
  totalAccounts,
}: CoverageLiveTotalsProps) {
  const accountsShort = totalAccounts.actual < totalAccounts.target;

  return (
    <section
      aria-label="Coverage totals"
      className="rounded-[16px] bg-[var(--color-cream-tint)] p-4"
    >
      <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
        Live coverage
      </h3>
      <div className="mt-3">
        <p className="text-[12px] font-medium text-[var(--color-muted)]">
          Accounts
        </p>
        <div
          className={`mt-1 rounded-[12px] px-3 py-3 ${
            accountsShort
              ? "bg-[var(--color-coral)] text-white"
              : "bg-[var(--color-surface)]"
          }`}
        >
          <p
            className={`text-[28px] font-extrabold tabular-nums leading-none ${
              accountsShort ? "text-white" : "text-[var(--color-ink)]"
            }`}
          >
            {totalAccounts.actual}
            <span
              className={`text-[16px] font-bold ${
                accountsShort ? "text-white/85" : "text-[var(--color-muted)]"
              }`}
            >
              {" "}
              / {totalAccounts.target}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--color-muted)]">
          Resources
        </span>
        <AdminCoverageCountCell count={resources} label="Employees" />
      </div>
    </section>
  );
}
