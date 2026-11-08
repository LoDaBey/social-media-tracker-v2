import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ManagerHome } from "@/components/manager/ManagerHome";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import {
  fetchAdminSpareAccounts,
  fetchAdminSpareMarkHolders,
} from "@/lib/admin-accounts-data";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import {
  spareAccountsForCountries,
  spareMarkHoldersForCountries,
} from "@/lib/admin-spare";
import {
  fetchManagerCountries,
  fetchManagerHomeGroups,
  fetchManagerRegion,
} from "@/lib/manager-data";
import { sameProject } from "@/lib/project-region-sql";
import { adminRegionFromSlug } from "@/lib/region-config";
import { homePathForRole } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

export const metadata: Metadata = {
  title: "Team",
};

export default async function ManagerHomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role !== "manager") redirect(homePathForRole(role));

  const managerId = Number(session.user.id);
  if (!Number.isFinite(managerId)) redirect("/login");

  const [groups, countries, managerRegion] = await Promise.all([
    fetchManagerHomeGroups(managerId),
    fetchManagerCountries(managerId),
    fetchManagerRegion(managerId),
  ]);
  const [coverage, spareAccounts, spareHolders] = await Promise.all([
    // Same project only: Palestine / Sudan / Somalia are in two projects.
    fetchAdminCountryCoverage({
      countries,
      region: managerRegion ? adminRegionFromSlug(managerRegion) : undefined,
    }),
    fetchAdminSpareAccounts(),
    fetchAdminSpareMarkHolders(),
  ]);
  const inManagerProject = (item: { source: string; region: string | null }) =>
    sameProject(item.source === "alphaa" ? "Alphaa" : item.region, managerRegion);

  return (
    <main className="w-full">
      <Suspense fallback={<ManagerHomeTable groups={groups} />}>
        <ManagerHome
          groups={groups}
          coverage={coverage}
          spareAccounts={spareAccountsForCountries(
            spareAccounts.filter(inManagerProject),
            countries
          )}
          spareHolders={spareMarkHoldersForCountries(
            spareHolders.filter(inManagerProject),
            countries
          )}
        />
      </Suspense>
    </main>
  );
}
