import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ManagerHome } from "@/components/manager/ManagerHome";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { fetchManagerCountries, fetchManagerHomeGroups } from "@/lib/manager-data";
import { homePathForRole } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

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
  const coverage = await fetchAdminCountryCoverage({ countries });

  return (
    <main className="w-full">
      <Suspense fallback={<ManagerHomeTable groups={groups} />}>
        <ManagerHome groups={groups} coverage={coverage} />
      </Suspense>
    </main>
  );
}
