import { AdminKpiTile } from "@/components/admin/AdminKpiTile";
import type { AdminCoverageKpisProps } from "@/types/admin";

function remaining(actual: number, target: number) {
  return Math.max(0, target - actual);
}

export function AdminCoverageKpis({ coverage }: AdminCoverageKpisProps) {
  const { totals, rows } = coverage;
  const countriesOnPlan = rows.filter((row) => row.onPlan).length;
  const countriesFilled = rows.filter(
    (row) =>
      row.onPlan &&
      row.resources.actual >= row.resources.target &&
      row.totalAccounts.actual >= row.totalAccounts.target
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <AdminKpiTile
        icon="users"
        title="Employees"
        value={`${totals.resources.actual} / ${totals.resources.target}`}
        subtitle="Active vs planned resources"
      />
      <AdminKpiTile
        icon="layers"
        title="Accounts"
        value={`${totals.totalAccounts.actual} / ${totals.totalAccounts.target}`}
        subtitle="Added vs planned slots"
      />
      <AdminKpiTile
        icon="clipboard"
        title="Still to add"
        value={String(remaining(totals.totalAccounts.actual, totals.totalAccounts.target))}
        subtitle="Account slots left on the plan"
      />
      <AdminKpiTile
        icon="globe"
        title="Countries ready"
        value={`${countriesFilled} / ${countriesOnPlan}`}
        subtitle="Countries that meet employee and account totals"
      />
    </div>
  );
}
