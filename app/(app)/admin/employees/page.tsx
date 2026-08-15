import { fetchAdminEmployeesList } from "@/lib/admin-data";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import {
  EmployeesCreateButton,
  EmployeesFilters,
  EmployeesSearchForm,
} from "@/components/admin/EmployeesFilters";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployees } from "@/lib/admin-view";
import { SETUP_COUNTRIES } from "@/lib/setup-options";

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

  const countryRaw = typeof sp.country === "string" ? sp.country : "";
  const country = (SETUP_COUNTRIES as readonly string[]).includes(countryRaw)
    ? countryRaw
    : "";

  const rows = await fetchAdminEmployeesList({
    q,
    status: status === "all" ? undefined : status,
    role: role === "all" ? undefined : role,
    country: country || undefined,
  });

  return (
    <AdminWorkspace view={adminViewEmployees()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <EmployeesSearchForm
            initialQ={q}
            hiddenStatus={status === "all" ? undefined : status}
            hiddenRole={role === "all" ? undefined : role}
            hiddenCountry={country || undefined}
          />
          <EmployeesCreateButton />
        </div>

        <EmployeesFilters />

        <EmployeesTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
