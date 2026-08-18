import { AdminPageLoader } from "@/components/admin/AdminPageLoader";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";

export default function AdminOverviewLoading() {
  return (
    <AdminWorkspace view={adminViewOverview()}>
      <AdminPageLoader label="Loading overview" />
    </AdminWorkspace>
  );
}
