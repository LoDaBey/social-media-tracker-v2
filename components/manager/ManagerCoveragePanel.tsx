import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import type { ManagerCoveragePanelProps } from "@/types/manager";

export function ManagerCoveragePanel({ coverage }: ManagerCoveragePanelProps) {
  if (coverage.rows.length === 0) {
    return (
      <p className="rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-12 text-center text-[14px] text-[var(--color-muted)]">
        No countries are assigned to you yet, so planned coverage is empty.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <AdminCoverageKpis coverage={coverage} />
      <AdminCountryCoverageSection coverage={coverage} />
    </div>
  );
}
