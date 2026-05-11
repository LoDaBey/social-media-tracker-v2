import { fetchAdminTeamLeads } from "@/lib/admin-data";
import { TeamLeadsTable } from "@/components/admin/TeamLeadsTable";

export default async function AdminTeamLeadsPage() {
  const rows = await fetchAdminTeamLeads();

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">Team leads</h1>
      <p className="max-w-2xl text-[14px] text-[var(--color-muted)]">
        Each row opens the same employee profile used across the org. Team leads are users with
        the team lead role.
      </p>
      <TeamLeadsTable rows={rows} />
    </main>
  );
}
