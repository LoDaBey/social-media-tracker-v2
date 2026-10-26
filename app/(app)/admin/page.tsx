import type { Metadata } from "next";
import {
  fetchAdminSpareAccounts,
  fetchAdminSpareMarkHolders,
} from "@/lib/admin-accounts-data";
import {
  spareAccountsForRegion,
  spareMarkHoldersForRegion,
} from "@/lib/admin-spare";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import { AdminOverviewActions } from "@/components/admin/AdminOverviewActions";
import { AdminOverviewRegionTabs } from "@/components/admin/AdminOverviewRegionTabs";
import { SpareAccountsButton } from "@/components/admin/SpareAccountsButton";
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
  const [coverage, spareAccounts, spareHolders] = await Promise.all([
    fetchAdminCountryCoverage({ region }),
    fetchAdminSpareAccounts(),
    fetchAdminSpareMarkHolders(),
  ]);

  return (
    <AdminWorkspace view={adminViewOverview()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-stretch gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <AdminOverviewActions />
          </div>
          <SpareAccountsButton
            accounts={spareAccountsForRegion(spareAccounts, region)}
            holders={spareMarkHoldersForRegion(spareHolders, region)}
          />
        </div>
        <AdminOverviewRegionTabs region={region}>
          <AdminCoverageKpis coverage={coverage} />
          <AdminCountryCoverageSection coverage={coverage} region={region} />
        </AdminOverviewRegionTabs>
      </div>
    </AdminWorkspace>
  );
}
