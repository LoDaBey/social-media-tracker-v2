import { query } from "@/lib/db";
import type { Platform } from "@/lib/platform-config";
import type { SheetsExportAccountRow } from "@/types/admin";

type SheetsExportQueryRow = {
  region: string | null;
  country: string | null;
  language: string | null;
  handler_name: string;
  platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string | null;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  mobile_number: string | null;
  status: SheetsExportAccountRow["status"];
};

export async function fetchAccountsForSheetsExport(): Promise<SheetsExportAccountRow[]> {
  const rows = await query<SheetsExportQueryRow>(
    `SELECT
        u.region,
        u.country,
        u.language,
        u.full_name AS handler_name,
        sma.platform,
        sma.account_name,
        sma.account_handle,
        sma.account_url,
        sma.category,
        sma.username,
        sma.account_email,
        sma.account_password,
        sma.mobile_number,
        sma.status
      FROM temp_social_media_accounts sma
      INNER JOIN temp_users u ON sma.user_id = u.id
      WHERE u.role = 'employee'
        AND u.is_active = TRUE
      ORDER BY u.country ASC NULLS LAST, u.full_name ASC, sma.platform ASC, sma.id ASC`
  );

  return rows.map((row) => ({
    region: row.region,
    country: row.country,
    language: row.language,
    handler_name: row.handler_name,
    platform: row.platform,
    account_name: row.account_name,
    account_handle: row.account_handle,
    account_url: row.account_url,
    category: row.category,
    username: row.username,
    account_email: row.account_email,
    account_password: row.account_password,
    mobile_number: row.mobile_number,
    status: row.status,
  }));
}
