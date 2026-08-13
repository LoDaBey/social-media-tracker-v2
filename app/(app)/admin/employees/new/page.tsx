import { fetchTeamLeadOptions } from "@/lib/admin-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import { CreateEmployeeForm } from "@/components/admin/CreateEmployeeForm";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployeeNew } from "@/lib/admin-view";

export default async function AdminNewEmployeePage() {
  const [teamLeads, managers] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
  ]);

  return (
    <AdminWorkspace view={adminViewEmployeeNew()}>
      <CreateEmployeeForm teamLeads={teamLeads} managers={managers} />
    </AdminWorkspace>
  );
}
