import Link from "next/link";
import { CoverageLivePlatformGrid } from "@/components/admin/CoverageLivePlatformGrid";
import { coverageLiveMetricsFromHolder } from "@/lib/coverage-live-metrics";
import { holderGapSummary, holderHasCoverageGap } from "@/lib/admin-coverage-gaps";
import { adminEmployeeHref } from "@/lib/admin-view";
import type { CoverageLiveHolderCardProps } from "@/types/admin";

export function CoverageLiveHolderCard({
  holder,
  country,
  language,
  showAlphaaPlatforms = false,
}: CoverageLiveHolderCardProps) {
  const hasGap = holderHasCoverageGap(holder);
  const summary = hasGap ? holderGapSummary(holder) : null;
  const metrics = coverageLiveMetricsFromHolder(holder, showAlphaaPlatforms);

  return (
    <article className="flex flex-col gap-3 rounded-[16px] bg-[var(--color-cream-tint)] p-3 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {holder.vacant ? (
            <h4 className="text-[15px] font-extrabold text-[var(--color-coral)]">
              {holder.fullName}
            </h4>
          ) : holder.id ? (
            <Link
              href={adminEmployeeHref(holder.id, holder.source)}
              aria-label={`Open ${holder.fullName} in ${country}`}
              className="rounded-lg text-[15px] font-extrabold text-[var(--color-ink)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              {holder.fullName}
            </Link>
          ) : (
            <h4 className="text-[15px] font-extrabold text-[var(--color-ink)]">
              {holder.fullName}
            </h4>
          )}
          <p className="mt-0.5 text-[12px] font-medium text-[var(--color-muted)]">
            {language || "—"}
            {holder.vacant ? " · Vacant seat" : ""}
          </p>
        </div>
        {summary ? (
          <p className="max-w-full rounded-md bg-[var(--color-coral)] px-2.5 py-1.5 text-[11px] font-extrabold leading-snug text-white shadow-[0_0_0_1px_rgba(180,40,40,.35)]">
            {summary}
          </p>
        ) : null}
      </header>

      <CoverageLivePlatformGrid
        metrics={metrics}
        label={`${holder.fullName} platforms`}
        showHeader={false}
        embedded
      />
    </article>
  );
}
