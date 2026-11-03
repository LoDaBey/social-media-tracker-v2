import { AdminCountryCoverageTable } from "@/components/admin/AdminCountryCoverageTable";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type { AdminCountryCoverageSectionProps } from "@/types/admin";

export function AdminCountryCoverageSection({
  coverage,
  region,
  projectName,
}: AdminCountryCoverageSectionProps) {
  const planLabel =
    region === "Overview"
      ? "all strategy projects"
      : region === "Alphaa"
        ? MAIN_PROJECT_LABEL
        : projectName ?? region;

  return (
    <section
      className="flex flex-col gap-3 rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-6"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      aria-label={`${planLabel} coverage`}
    >
      <AdminCountryCoverageTable
        rows={coverage.rows}
        totals={coverage.totals}
        showAlphaaPlatforms={region === "Alphaa"}
      />
    </section>
  );
}
