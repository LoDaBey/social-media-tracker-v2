import type { Metadata } from "next";
import { requireAdminPageAccess, viewerAllows } from "@/lib/admin-access";
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
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import {
  employeeListRegionFromSlug,
  isCountryInEmployeeListRegion,
  type SetupRegion,
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
  const viewer = await requireAdminPageAccess("employees");
  const canCreateEmployees = viewerAllows(viewer, "employees", "canCreate");

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
    roleRaw === "op" ||
    roleRaw === "hoo"
      ? roleRaw
      : "all";

  const regionFilter = employeeListRegionFromSlug(
    typeof sp.region === "string" ? sp.region : undefined
  );
  let region = regionFilter === "all" ? undefined : regionFilter;
  const countryRaw = typeof sp.country === "string" ? sp.country : "";
  let country = isCountryInEmployeeListRegion(countryRaw, regionFilter)
    ? countryRaw
    : "";

  if (viewer.role === "op" && viewer.scope) {
    region = viewer.scope.region as SetupRegion;
    if (country && !viewer.scope.countries.includes(country)) {
      country = "";
    }
  }

  let listed = await fetchAdminEmployeesList({
    q,
    role: role === "all" ? undefined : role,
    region,
    country: country || undefined,
  });

  if (viewer.role === "op" && viewer.scope) {
    const allowed = new Set(viewer.scope.countries);
    const regionName = viewer.scope.region.toLowerCase();
    listed = listed.filter((row) => {
      // Operation Managers don't see themselves in their own team list.
      if (row.source === "temp" && row.id === viewer.userId) return false;
      const base = baseCountryFromDisplay(row.country ?? "");
      if (!allowed.has(base) && !(row.country && allowed.has(row.country))) {
        return false;
      }
      if (row.role === "employee") {
        return (row.region ?? "").trim().toLowerCase() === regionName;
      }
      return true;
    });
  }

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
      region: row.region,
    }));

  return (
    <AdminWorkspace
      view={adminViewEmployees()}
      actions={
        <EmployeesHeadingActions canCreateEmployees={canCreateEmployees} />
      }
    >
      <EmployeesTable
        key={`${q}|${status}|${role}|${region ?? ""}|${country}`}
        rows={rows}
        holders={holders}
        canManagePermissions={viewer.role === "admin"}
        toolbar={
          <EmployeesTableToolbar
            initialQ={q}
            counts={counts}
            holders={holders}
            canCreateEmployees={canCreateEmployees}
          />
        }
      />
    </AdminWorkspace>
  );
}
