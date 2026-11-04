import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { StrategyPlatformIcon } from "@/app/(app)/admin/strategy/components/StrategyPlatformIcon";
import {
  coverageMetricHasShortfall,
  coverageMetricTotal,
} from "@/lib/coverage-live-metrics";
import type { CoverageLivePlatformCardProps } from "@/types/admin";

const SCOPE_BAR = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
  default: "bg-[var(--color-ink)]",
} as const;

export function CoverageLivePlatformCard({ metric }: CoverageLivePlatformCardProps) {
  const total = coverageMetricTotal(metric);
  const short = coverageMetricHasShortfall(metric);

  return (
    <article
      className={`relative flex flex-col gap-2.5 rounded-[14px] p-3 ring-1 ${
        short
          ? "bg-[#FDE8E6] ring-[var(--color-coral)]"
          : "bg-[var(--color-surface)] ring-[var(--color-hairline)]"
      }`}
    >
      <header className="flex items-center gap-2">
        <StrategyPlatformIcon platform={metric.platform} className="h-6 w-6" />
        <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-ink)]">
          {metric.label}
        </h4>
        <AdminCoverageCountCell
          count={total}
          label={`${metric.label} accounts`}
        />
      </header>

      <ul className="flex flex-col gap-2">
        {metric.scopes.map((scope) => {
          const ratio =
            scope.count.target > 0
              ? scope.count.actual / scope.count.target
              : scope.count.actual > 0
                ? 1
                : 0;
          const width = Math.max(0, Math.min(100, ratio * 100));
          const isShort = scope.count.actual < scope.count.target;

          return (
            <li key={scope.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--color-muted)]">
                  {scope.label}
                </span>
                <AdminCoverageCountCell
                  count={scope.count}
                  label={`${metric.label} ${scope.label}`}
                />
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[var(--color-cream)]"
                aria-hidden="true"
              >
                <div
                  className={`h-1.5 rounded-full ${
                    isShort ? "bg-[var(--color-coral)]" : SCOPE_BAR[scope.tone]
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
