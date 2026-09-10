import { fetchAdminEmployeesList } from "@/lib/admin-data";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import {
  EmployeesBulkImportButton,
} from "@/components/admin/EmployeesBulkImportButton";
import { SyncSheetsButton } from "@/components/admin/SyncSheetsButton";
import {
  EmployeesCreateButton,
  EmployeesFilters,
  EmployeesSearchForm,
} from "@/components/admin/EmployeesFilters";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployees } from "@/lib/admin-view";
import {
  employeeListRegionFromSlug,
  employeeListRegionSlug,
  isCountryInEmployeeListRegion,
} from "@/lib/setup-options";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q : "";
  const statusRaw = typeof sp.status === "string" ? sp.status : "all";
  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "all";
  const roleRaw = typeof sp.role === "string" ? sp.role : "all";
  const role =
    roleRaw === "employee" || roleRaw === "manager" || roleRaw === "team_lead"
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

  const rows = await fetchAdminEmployeesList({
    q,
    status: status === "all" ? undefined : status,
    role: role === "all" ? undefined : role,
    region,
    country: country || undefined,
  });
  const holders = rows
    .filter((row) => row.role === "employee" && row.is_active)
    .map((row) => ({
      id: row.id,
      full_name: row.full_name,
      country: row.country,
      language: row.language,
    }));

  return (
    <AdminWorkspace view={adminViewEmployees()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <EmployeesSearchForm
            initialQ={q}
            hiddenStatus={status === "all" ? undefined : status}
            hiddenRole={role === "all" ? undefined : role}
            hiddenRegion={region ? employeeListRegionSlug(region) : undefined}
            hiddenCountry={country || undefined}
          />
          <EmployeesBulkImportButton holders={holders} />
          <SyncSheetsButton />
          <EmployeesCreateButton />
        </div>

        <EmployeesFilters />

        <EmployeesTable rows={rows} holders={holders} />
      </div>
    </AdminWorkspace>
  );
}
