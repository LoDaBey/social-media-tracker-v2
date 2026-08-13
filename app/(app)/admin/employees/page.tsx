import { fetchAdminEmployeesList, fetchTeamLeadOptions } from "@/lib/admin-data";
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
  const leadRaw = typeof sp.lead === "string" ? sp.lead : "";
  const teamLeadId =
    leadRaw && /^\d+$/.test(leadRaw) ? Number(leadRaw) : null;

  const [rows, teamLeads] = await Promise.all([
    fetchAdminEmployeesList({
      q,
      status: status === "all" ? undefined : status,
      teamLeadId: teamLeadId ?? undefined,
    }),
    fetchTeamLeadOptions(),
  ]);

  return (
    <AdminWorkspace view={adminViewEmployees()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <EmployeesSearchForm
            initialQ={q}
            hiddenStatus={status === "all" ? undefined : status}
            hiddenLead={leadRaw || undefined}
          />
          <EmployeesCreateButton />
        </div>

        <EmployeesFilters teamLeads={teamLeads} />

        <EmployeesTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
