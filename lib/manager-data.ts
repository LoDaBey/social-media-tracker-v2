import { query } from "@/lib/db";
import {
  groupAccountsByPlatform,
  isEmployeeSetupComplete,
  targetsFromCounts,
} from "@/lib/setup-complete";
import { totalAssignedAccountTarget } from "@/lib/setup-facebook";
import type { TempSocialMediaAccount } from "@/types/db";
import type {
  ManagerAccountListItem,
  ManagerCountryGroup,
  ManagerHolderRow,
  ManagerOption,
} from "@/types/manager";

export async function fetchManagerCountries(
  managerId: number
): Promise<string[]> {
  const rows = await query<{ country: string }>(
    `SELECT country
       FROM temp_manager_countries
      WHERE user_id = $1
      ORDER BY country ASC`,
    [managerId]
  );
  return rows.map((r) => r.country);
}

export async function fetchManagerOptions(): Promise<ManagerOption[]> {
  const managers = await query<{ id: number; full_name: string }>(
    `SELECT id, full_name
       FROM temp_users
      WHERE role = 'manager' AND is_active = TRUE
      ORDER BY full_name`
  );
  if (!managers.length) return [];

  const countries = await query<{ user_id: number; country: string }>(
    `SELECT user_id, country
       FROM temp_manager_countries
      WHERE user_id = ANY($1::int[])
      ORDER BY country ASC`,
    [managers.map((m) => m.id)]
  );

  const byManager = new Map<number, string[]>();
  for (const row of countries) {
    const list = byManager.get(row.user_id) ?? [];
    list.push(row.country);
    byManager.set(row.user_id, list);
  }

  return managers.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    countries: byManager.get(m.id) ?? [],
  }));
}

type HolderQueryRow = {
  id: number;
  full_name: string;
  email: string;
  country: string | null;
  language: string | null;
  target_x_count: number;
  target_facebook_personal_count: number;
  target_facebook_umbrella_count: number;
  target_instagram_count: number;
  target_tiktok_count: number;
};

export async function fetchManagerHomeGroups(
  managerId: number
): Promise<ManagerCountryGroup[]> {
  const managerCountries = await fetchManagerCountries(managerId);
  if (!managerCountries.length) return [];

  const holders = await query<HolderQueryRow>(
    `SELECT id,
            full_name,
            email,
            country,
            language,
            target_x_count,
            target_facebook_personal_count,
            target_facebook_umbrella_count,
            target_instagram_count,
            target_tiktok_count
       FROM temp_users
      WHERE role = 'employee'
        AND is_active = TRUE
        AND manager_id = $1
        AND country = ANY($2::text[])
      ORDER BY country ASC, full_name ASC`,
    [managerId, managerCountries]
  );

  if (!holders.length) {
    return managerCountries.map((country) => ({
      country,
      holders: [],
    }));
  }

  const accounts = await query<TempSocialMediaAccount>(
    `SELECT *
       FROM temp_social_media_accounts
      WHERE user_id = ANY($1::int[])
      ORDER BY user_id ASC, platform ASC, id ASC`,
    [holders.map((h) => h.id)]
  );

  const accountsByUser = new Map<number, TempSocialMediaAccount[]>();
  for (const account of accounts) {
    const list = accountsByUser.get(account.user_id) ?? [];
    list.push(account);
    accountsByUser.set(account.user_id, list);
  }

  const groups = new Map<string, ManagerHolderRow[]>();
  for (const country of managerCountries) {
    groups.set(country, []);
  }

  for (const holder of holders) {
    const country = holder.country ?? "";
    if (!groups.has(country)) continue;
    const holderAccounts = accountsByUser.get(holder.id) ?? [];
    const activeAccounts = holderAccounts.filter(
      (account) => account.status === "active"
    );
    const targets = targetsFromCounts(holder);
    const accountsByPlatform = groupAccountsByPlatform(activeAccounts);
    const setupComplete = isEmployeeSetupComplete({
      country: holder.country,
      language: holder.language,
      targets,
      accountsByPlatform,
    });
    const publicAccounts: ManagerAccountListItem[] = holderAccounts.map(
      (account) => ({
        id: account.id,
        platform: account.platform,
        account_name: account.account_name,
        account_handle: account.account_handle,
        username: account.username,
        account_url: account.account_url,
        account_email: account.account_email,
        account_password: account.account_password,
        email_password: account.email_password,
        mobile_number: account.mobile_number,
        category: account.category,
        status: account.status,
      })
    );
    groups.get(country)!.push({
      id: holder.id,
      full_name: holder.full_name,
      email: holder.email,
      country,
      language: holder.language,
      setupComplete,
      targetAccountsSum: totalAssignedAccountTarget(targets),
      accountTotal: publicAccounts.length,
      accounts: publicAccounts,
    });
  }

  return managerCountries.map((country) => ({
    country,
    holders: groups.get(country) ?? [],
  }));
}

export async function assertManagerCanEditEmployee(
  managerId: number,
  employeeId: number
): Promise<boolean> {
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok
       FROM temp_users e
       INNER JOIN temp_manager_countries mc
         ON mc.user_id = $1 AND mc.country = e.country
      WHERE e.id = $2
        AND e.role = 'employee'
        AND e.manager_id = $1
        AND e.is_active = TRUE
      LIMIT 1`,
    [managerId, employeeId]
  );
  return rows.length > 0;
}
