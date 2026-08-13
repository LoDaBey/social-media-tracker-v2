import { fetchEmployeeActivityTimeline } from "@/lib/admin-data";
import { AdminEmployeeActivityList } from "@/components/admin/AdminEmployeeActivityList";

type Props = {
  userId: number;
};

export async function AdminEmployeeActivity({ userId }: Props) {
  const items = await fetchEmployeeActivityTimeline(userId);
  return <AdminEmployeeActivityList items={items} />;
}
