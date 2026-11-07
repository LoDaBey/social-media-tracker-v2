import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  requireAdminPageAccess,
  viewerAllows,
} from "@/lib/admin-access";
import {
  fetchAdminSupervisorOptions,
  fetchOpOptions,
  fetchTeamLeadOptions,
} from "@/lib/admin-data";
import { fetchEmployeeCreateProjectOptions } from "@/lib/employee-create-projects-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import { CreateEmployeeForm } from "@/components/admin/CreateEmployeeForm";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewEmployeeNew } from "@/lib/admin-view";

export const metadata: Metadata = {
  title: "New employee",
};

export default async function AdminNewEmployeePage() {
  const viewer = await requireAdminPageAccess("employees");
  if (!viewerAllows(viewer, "employees", "canCreate")) {
    redirect("/admin/employees");
  }

  const [teamLeads, managers, ops, admins, projects] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
    fetchOpOptions(),
    fetchAdminSupervisorOptions(),
    fetchEmployeeCreateProjectOptions(),
  ]);

  return (
    <AdminWorkspace view={adminViewEmployeeNew()}>
      <CreateEmployeeForm
        teamLeads={teamLeads}
        managers={managers}
        ops={ops}
        admins={admins}
        projects={projects}
      />
    </AdminWorkspace>
  );
}
