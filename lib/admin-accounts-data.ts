import { query } from "@/lib/db";
import type { Platform } from "@/lib/platform-config";
import type { AdminSocialAccountListItem } from "@/types/admin";

type AccountQueryRow = {
  id: number;
  user_id: number;
  platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  status: AdminSocialAccountListItem["status"];
};

function mapAccount(row: AccountQueryRow): AdminSocialAccountListItem {
  return {
    id: row.id,
    platform: row.platform,
    account_name: row.account_name,
    account_handle: row.account_handle,
    account_url: row.account_url,
    category: row.category,
    username: row.username,
    account_email: row.account_email,
    account_password: row.account_password,
    email_password: row.email_password,
    mobile_number: row.mobile_number,
    status: row.status,
  };
}

export async function fetchAdminEmployeeAccounts(
  userId: number
): Promise<AdminSocialAccountListItem[]> {
  const byUser = await fetchAdminAccountsByUserIds([userId]);
  return byUser.get(userId) ?? [];
}

export async function fetchAdminAccountsByUserIds(
  userIds: number[]
): Promise<Map<number, AdminSocialAccountListItem[]>> {
  const byUser = new Map<number, AdminSocialAccountListItem[]>();
  if (userIds.length === 0) return byUser;

  const rows = await query<AccountQueryRow>(
    `SELECT id, user_id, platform, account_name, account_handle, account_url,
            category, username, account_email, account_password, email_password,
            mobile_number, status
       FROM temp_social_media_accounts
      WHERE user_id = ANY($1::int[])
      ORDER BY platform ASC, id ASC`,
    [userIds]
  );
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(mapAccount(row));
    byUser.set(row.user_id, list);
  }
  return byUser;
}
