import { AdminCountryCoverageTable } from "@/components/admin/AdminCountryCoverageTable";
import type { AdminCountryCoverageSectionProps } from "@/types/admin";

export function AdminCountryCoverageSection({
  coverage,
}: AdminCountryCoverageSectionProps) {
  return (
    <section
      className="flex flex-col gap-3 rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-6"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      aria-label="Planned Africa coverage"
    >
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-ink)]">
          Planned coverage
        </h2>
        <p className="mt-1 text-[13px] text-[var(--color-muted)] sm:text-[14px]">
          How many employees and accounts each country should have. Each cell is
          current / planned. Open a country to see which account holders still
          have gaps. X combines Twitter personal and umbrella slots from the
          Africa plan.
        </p>
      </div>
      <AdminCountryCoverageTable rows={coverage.rows} totals={coverage.totals} />
    </section>
  );
}
