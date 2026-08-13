import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { computeWallet } from "@/lib/wallet";
import { fetchWalletTransactionsThisCycle } from "@/lib/wallet-page-data";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import type { TempUser } from "@/types/db";
import { AdminEmployeeWalletView } from "@/components/admin/AdminEmployeeWalletView";

type Props = {
  userId: number;
};

export async function AdminEmployeeWalletEmbed({ userId }: Props) {
  const user = await queryOne<TempUser>(
    `SELECT * FROM temp_users WHERE id = $1`,
    [userId]
  );
  if (!user) redirect("/admin/employees");

  const cycleStartStr = normalizePgDateColumn(user.pay_cycle_start_date);
  const [wallet, transactions] = await Promise.all([
    computeWallet(user),
    fetchWalletTransactionsThisCycle(userId, cycleStartStr),
  ]);

  return (
    <AdminEmployeeWalletView
      userId={userId}
      fullName={user.full_name}
      wallet={wallet}
      transactions={transactions}
    />
  );
}
