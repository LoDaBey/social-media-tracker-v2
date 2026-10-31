import type { Metadata } from "next";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import { AdminOverviewHeadingActions } from "@/app/(app)/admin/components/AdminOverviewHeadingActions";
import { AdminOverviewSubtitle } from "@/app/(app)/admin/components/AdminOverviewSubtitle";
import { AdminOverviewRegionTabs } from "@/components/admin/AdminOverviewRegionTabs";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";
import { adminRegionFromSlug } from "@/lib/region-config";

export const metadata: Metadata = {
  title: "Admin",
};

type AdminOverviewPageProps = {
  searchParams: Promise<{ region?: string }>;
};

export default async function AdminOverviewPage({
  searchParams,
}: AdminOverviewPageProps) {
  const params = await searchParams;
  const region = adminRegionFromSlug(params.region);
  const coverage = await fetchAdminCountryCoverage({ region });
  const generatedAt = new Date().toISOString();

  return (
    <AdminWorkspace
      view={adminViewOverview()}
      subtitle={
        <AdminOverviewSubtitle
          countryCount={coverage.rows.length}
          generatedAt={generatedAt}
        />
      }
      actions={<AdminOverviewHeadingActions region={region} />}
    >
      <AdminOverviewRegionTabs region={region}>
        <AdminCoverageKpis coverage={coverage} />
        <AdminCountryCoverageSection coverage={coverage} region={region} />
      </AdminOverviewRegionTabs>
    </AdminWorkspace>
  );
}
