import { fetchAdminPayoutRows } from "@/lib/admin-data";
import { PayoutsTable } from "@/components/admin/PayoutsTable";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewPayouts } from "@/lib/admin-view";

export default async function AdminPayoutsPage() {
  const rows = await fetchAdminPayoutRows();

  return (
    <AdminWorkspace view={adminViewPayouts()}>
      <PayoutsTable rows={rows} />
    </AdminWorkspace>
  );
}
