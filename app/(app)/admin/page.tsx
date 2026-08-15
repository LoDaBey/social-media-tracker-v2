import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import { AdminOverviewActions } from "@/components/admin/AdminOverviewActions";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";

export default async function AdminOverviewPage() {
  const coverage = await fetchAdminCountryCoverage();

  return (
    <AdminWorkspace view={adminViewOverview()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <AdminOverviewActions />
        <AdminCoverageKpis coverage={coverage} />
        <AdminCountryCoverageSection coverage={coverage} />
      </div>
    </AdminWorkspace>
  );
}
