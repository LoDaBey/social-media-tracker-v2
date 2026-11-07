import {
  fetchAdminSupervisorOptions,
  fetchOpOptions,
  fetchTeamLeadOptions,
} from "@/lib/admin-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import {
  canonicalAlphaaCountry,
} from "@/lib/admin-alphaa-employees-data";
import { EmployeeAccountsPanel } from "@/components/admin/EmployeeAccountsPanel";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import type { AlphaaEmployeeProfileProps } from "@/types/admin";

export async function AlphaaEmployeeProfile({
  profile,
}: AlphaaEmployeeProfileProps) {
  const country = canonicalAlphaaCountry(
    profile.countries[0] ?? profile.country ?? ""
  );
  const [teamLeads, managers, ops, admins] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
    fetchOpOptions(),
    fetchAdminSupervisorOptions(),
  ]);
  const holders = [
    {
      id: profile.id,
      source: "alphaa" as const,
      full_name: profile.fullName,
      country: country || null,
      language: profile.language,
      team_lead_name: null,
      manager_name: null,
    },
  ];
  const planCount = profile.accounts.filter((account) => !account.is_spare)
    .length;

  return (
    <div className="flex flex-col gap-5">
      <EmployeeForm
        key={[
          profile.fullName,
          profile.email,
          profile.phone ?? "",
          profile.mappedRole,
          country,
          String(profile.isActive),
        ].join("::")}
        initial={{
          id: profile.id,
          full_name: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          role: profile.mappedRole,
          is_active: profile.isActive,
          employee_code: null,
          employment_status: profile.isActive ? "active" : "deactivated",
          hire_date: "",
          team_lead_id: null,
          manager_id: null,
          op_id: null,
          manager_countries: [],
          current_level: 2,
          country,
          updated_at: new Date().toISOString(),
        }}
        teamLeads={teamLeads}
        managers={managers}
        ops={ops}
        admins={admins}
        source="alphaa"
      />

      <section className="flex flex-col gap-3">
        <EmployeeAccountsPanel
          userId={profile.id}
          fullName={profile.fullName}
          country={country || null}
          language={profile.language}
          accounts={profile.accounts}
          assignedCount={planCount}
          canAdd
          canImport
          canMarkSpare
          holders={holders}
          holderSource="alphaa"
        />
      </section>
    </div>
  );
}
