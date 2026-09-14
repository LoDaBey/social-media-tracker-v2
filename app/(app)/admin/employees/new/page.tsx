import {
  fetchAdminSupervisorOptions,
  fetchOpOptions,
  fetchTeamLeadOptions,
} from "@/lib/admin-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import { CreateEmployeeForm } from "@/components/admin/CreateEmployeeForm";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployeeNew } from "@/lib/admin-view";

export default async function AdminNewEmployeePage() {
  const [teamLeads, managers, ops, admins] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
    fetchOpOptions(),
    fetchAdminSupervisorOptions(),
  ]);

  return (
    <AdminWorkspace view={adminViewEmployeeNew()}>
      <CreateEmployeeForm
        teamLeads={teamLeads}
        managers={managers}
        ops={ops}
        admins={admins}
      />
    </AdminWorkspace>
  );
}
