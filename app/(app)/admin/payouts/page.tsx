import { fetchAdminPayoutRows } from "@/lib/admin-data";
import { PayoutsTable } from "@/components/admin/PayoutsTable";

export default async function AdminPayoutsPage() {
  const rows = await fetchAdminPayoutRows();

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">Payouts</h1>
      <PayoutsTable rows={rows} />
    </main>
  );
}
