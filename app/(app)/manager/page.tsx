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
import { fetchManagerCountries, fetchManagerHomeGroups } from "@/lib/manager-data";
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

  const [groups, countries] = await Promise.all([
    fetchManagerHomeGroups(managerId),
    fetchManagerCountries(managerId),
  ]);
  const [coverage, spareAccounts, spareHolders] = await Promise.all([
    fetchAdminCountryCoverage({ countries }),
    fetchAdminSpareAccounts(),
    fetchAdminSpareMarkHolders(),
  ]);

  return (
    <main className="w-full">
      <Suspense fallback={<ManagerHomeTable groups={groups} />}>
        <ManagerHome
          groups={groups}
          coverage={coverage}
          spareAccounts={spareAccountsForCountries(spareAccounts, countries)}
          spareHolders={spareMarkHoldersForCountries(spareHolders, countries)}
        />
      </Suspense>
    </main>
  );
}
