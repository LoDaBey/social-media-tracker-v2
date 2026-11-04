import { CoverageLiveHolderCard } from "@/components/admin/CoverageLiveHolderCard";
import { CoverageLivePlatformGrid } from "@/components/admin/CoverageLivePlatformGrid";
import { CoverageLiveTotals } from "@/components/admin/CoverageLiveTotals";
import { coverageLiveMetricsFromRow } from "@/lib/coverage-live-metrics";
import type { AdminCountryCoverageDetailProps } from "@/types/admin";

export function AdminCountryCoverageDetail({
  row,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageDetailProps) {
  const metrics = coverageLiveMetricsFromRow(row, showAlphaaPlatforms);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <CoverageLiveTotals
          resources={row.resources}
          totalAccounts={row.totalAccounts}
        />
        <CoverageLivePlatformGrid metrics={metrics} />
      </div>

      <section aria-label="Account holders" className="flex flex-col gap-3">
        <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
          Account holders
        </h3>

        {row.holders.length > 0 ? (
          <div className="flex flex-col gap-3">
            {row.holders.map((holder, index) => (
              <CoverageLiveHolderCard
                key={holder.id ?? `vacant-${row.country}-${index}`}
                holder={holder}
                country={row.country}
                language={row.language}
                showAlphaaPlatforms={showAlphaaPlatforms}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[13px] text-[var(--color-muted)]">
            No account holders in {row.country} yet.
          </p>
        )}
      </section>
    </div>
  );
}
