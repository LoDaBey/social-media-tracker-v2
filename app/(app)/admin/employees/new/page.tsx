import { fetchTeamLeadOptions } from "@/lib/admin-data";
import { CreateEmployeeForm } from "@/components/admin/CreateEmployeeForm";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployeeNew } from "@/lib/admin-view";

export default async function AdminNewEmployeePage() {
  const teamLeads = await fetchTeamLeadOptions();

  return (
    <AdminWorkspace view={adminViewEmployeeNew()}>
      <CreateEmployeeForm teamLeads={teamLeads} />
    </AdminWorkspace>
  );
}
