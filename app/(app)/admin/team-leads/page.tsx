import { fetchAdminTeamLeads } from "@/lib/admin-data";
import { TeamLeadsTable } from "@/components/admin/TeamLeadsTable";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewTeamLeads } from "@/lib/admin-view";

export default async function AdminTeamLeadsPage() {
  const rows = await fetchAdminTeamLeads();

  return (
    <AdminWorkspace view={adminViewTeamLeads()}>
      <div className="flex flex-col gap-6">
        <p className="max-w-2xl text-[14px] text-[var(--color-muted)]">
          Each row opens the same employee profile used across the org. Team leads are users with
          the team lead role.
        </p>
        <TeamLeadsTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
