import { fetchAdminEmployeesList } from "@/lib/admin-data";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import {
  EmployeesCreateButton,
  EmployeesFilters,
  EmployeesSearchForm,
} from "@/components/admin/EmployeesFilters";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployees } from "@/lib/admin-view";

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
    roleRaw === "employee" || roleRaw === "manager" ? roleRaw : "all";

  const rows = await fetchAdminEmployeesList({
    q,
    status: status === "all" ? undefined : status,
    role: role === "all" ? undefined : role,
  });

  return (
    <AdminWorkspace view={adminViewEmployees()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <EmployeesSearchForm
            initialQ={q}
            hiddenStatus={status === "all" ? undefined : status}
            hiddenRole={role === "all" ? undefined : role}
          />
          <EmployeesCreateButton />
        </div>

        <EmployeesFilters />

        <EmployeesTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
