import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import { AdminOverviewActions } from "@/components/admin/AdminOverviewActions";
import { AdminOverviewRegionTabs } from "@/components/admin/AdminOverviewRegionTabs";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";
import { adminRegionFromSlug } from "@/lib/region-config";

type AdminOverviewPageProps = {
  searchParams: Promise<{ region?: string }>;
};

export default async function AdminOverviewPage({
  searchParams,
}: AdminOverviewPageProps) {
  const params = await searchParams;
  const region = adminRegionFromSlug(params.region);
  const coverage = await fetchAdminCountryCoverage({ region });

  return (
    <AdminWorkspace view={adminViewOverview()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <AdminOverviewActions />
        <AdminOverviewRegionTabs region={region}>
          <AdminCoverageKpis coverage={coverage} />
          <AdminCountryCoverageSection coverage={coverage} region={region} />
        </AdminOverviewRegionTabs>
      </div>
    </AdminWorkspace>
  );
}
