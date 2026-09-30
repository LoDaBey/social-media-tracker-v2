import { query } from "@/lib/db";
import type { Platform } from "@/lib/platform-config";
import type {
  AdminSocialAccountListItem,
  AdminSpareAccountListItem,
} from "@/types/admin";

type AccountQueryRow = {
  id: number;
  user_id: number;
  platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string | null;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  status: AdminSocialAccountListItem["status"];
  is_spare: boolean;
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
    is_spare: row.is_spare,
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
            mobile_number, status, is_spare
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

/** Active spare accounts for Africa and Balkan handlers (admin modal). */
export async function fetchAdminSpareAccounts(): Promise<
  AdminSpareAccountListItem[]
> {
  return query<AdminSpareAccountListItem>(
    `SELECT
        a.id,
        a.platform,
        a.username,
        a.account_name,
        a.account_url,
        a.category,
        a.status,
        u.id AS handler_id,
        u.full_name AS handler_name,
        u.country,
        u.region
       FROM temp_social_media_accounts a
       INNER JOIN temp_users u ON u.id = a.user_id
      WHERE a.is_spare = TRUE
        AND a.status = 'active'
        AND LOWER(u.role) = 'employee'
        AND u.is_active = TRUE
        AND LOWER(TRIM(u.region)) IN ('africa', 'balkan')
      ORDER BY u.region ASC, u.country ASC, u.full_name ASC, a.platform ASC, a.id ASC`
  );
}
