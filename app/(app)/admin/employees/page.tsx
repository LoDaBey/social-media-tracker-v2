import Link from "next/link";
import { fetchAdminEmployeesList, fetchTeamLeadOptions } from "@/lib/admin-data";
import { EmployeesTable } from "@/components/admin/EmployeesTable";
import {
  EmployeesFilters,
  EmployeesSearchForm,
} from "@/components/admin/EmployeesFilters";

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
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">Employees</h1>
        <div className="flex flex-wrap items-center gap-3">
          <EmployeesSearchForm
            initialQ={q}
            hiddenStatus={status === "all" ? undefined : status}
            hiddenLead={leadRaw || undefined}
          />
          <Link
            href="/admin/employees/new"
            aria-label="Create a new employee"
            className="inline-flex cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            + Create employee
          </Link>
        </div>
      </div>

      <EmployeesFilters teamLeads={teamLeads} />

      <EmployeesTable rows={rows} />
    </main>
  );
}
