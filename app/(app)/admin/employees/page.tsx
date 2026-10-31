import type { Metadata } from "next";
import { fetchAdminEmployeesList } from "@/lib/admin-data";
import {
  employeeListStatusCounts,
  filterEmployeesByListStatus,
  parseEmployeeListStatus,
} from "@/lib/admin-employee-list";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import { EmployeesHeadingActions } from "@/app/(app)/admin/employees/components/EmployeesHeadingActions";
import { EmployeesTableToolbar } from "@/app/(app)/admin/employees/components/EmployeesTableToolbar";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployees } from "@/lib/admin-view";
import {
  employeeListRegionFromSlug,
  isCountryInEmployeeListRegion,
} from "@/lib/setup-options";

export const metadata: Metadata = {
  title: "Employees",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = parseEmployeeListStatus(
    typeof sp.status === "string" ? sp.status : undefined
  );
  const roleRaw = typeof sp.role === "string" ? sp.role : "all";
  const role =
    roleRaw === "employee" ||
    roleRaw === "manager" ||
    roleRaw === "team_lead" ||
    roleRaw === "op"
      ? roleRaw
      : "all";

  const regionFilter = employeeListRegionFromSlug(
    typeof sp.region === "string" ? sp.region : undefined
  );
  const region = regionFilter === "all" ? undefined : regionFilter;
  const countryRaw = typeof sp.country === "string" ? sp.country : "";
  const country = isCountryInEmployeeListRegion(countryRaw, regionFilter)
    ? countryRaw
    : "";

  const listed = await fetchAdminEmployeesList({
    q,
    role: role === "all" ? undefined : role,
    region,
    country: country || undefined,
  });
  const counts = employeeListStatusCounts(listed);
  const rows = filterEmployeesByListStatus(listed, status);
  const holders = listed
    .filter(
      (row) =>
        row.role === "employee" && (row.is_active || row.source === "alphaa")
    )
    .map((row) => ({
      id: row.id,
      source: row.source,
      full_name: row.full_name,
      country: row.country,
      language: row.language,
      team_lead_name: row.team_lead_name,
      manager_name: row.manager_name,
    }));

  return (
    <AdminWorkspace
      view={adminViewEmployees()}
      actions={<EmployeesHeadingActions holders={holders} />}
    >
      <EmployeesTable
        rows={rows}
        holders={holders}
        toolbar={
          <EmployeesTableToolbar initialQ={q} counts={counts} />
        }
      />
    </AdminWorkspace>
  );
}
