import { query, queryOne } from "@/lib/db";
import {
  ALPHAA_LEGACY_COUNTRY,
  ALPHAA_REGION_WHERE,
} from "@/lib/alphaa-platform-sql";
import { spareItemMatchesCountries } from "@/lib/admin-spare";
import { managerEmployeeScopeSql } from "@/lib/manager-employee-scope";
import { sameProject } from "@/lib/project-region-sql";
import type { AdminEmployeeSource } from "@/types/admin";
import { targetsFromCounts } from "@/lib/setup-complete";
import { totalAssignedAccountTarget } from "@/lib/setup-facebook";
import { fetchWeeklyChecksForAccounts } from "@/lib/weekly-checks-data";
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

/** The Country Manager's own project (temp_users.region). */
export async function fetchManagerRegion(managerId: number): Promise<string | null> {
  const row = await queryOne<{ region: string | null }>(
    `SELECT region FROM temp_users WHERE id = $1`,
    [managerId]
  );
  return row?.region ?? null;
}

export async function fetchManagerOptions(): Promise<ManagerOption[]> {
  const managers = await query<{
    id: number;
    full_name: string;
    region: string | null;
    country: string | null;
  }>(
    `SELECT id, full_name, region, country
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
    region: m.region,
    home_country: m.country,
  }));
}

type HolderQueryRow = {
  id: number;
  full_name: string;
  email: string;
  country: string | null;
  language: string | null;
  region: string | null;
  employment_status: ManagerHolderRow["employment_status"];
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

  const scope = managerEmployeeScopeSql("temp_users", "$1", "$2");
  const holders = await query<HolderQueryRow>(
    `SELECT id,
            full_name,
            email,
            country,
            language,
            region,
            employment_status,
            target_x_count,
            target_facebook_personal_count,
            target_facebook_umbrella_count,
            target_instagram_count,
            target_tiktok_count
       FROM temp_users
      WHERE ${scope}
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

  const weeklyChecks = await fetchWeeklyChecksForAccounts(
    accounts.map((account) => account.id)
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
    const targets = targetsFromCounts(holder);
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
        account_scope: account.account_scope ?? "personal",
        status: account.status,
        is_spare: Boolean(account.is_spare),
        weekly_check: weeklyChecks.get(account.id) ?? null,
      })
    );
    groups.get(country)!.push({
      id: holder.id,
      full_name: holder.full_name,
      email: holder.email,
      country,
      language: holder.language,
      region: holder.region,
      employment_status: holder.employment_status ?? "active",
      targets: {
        target_x_count: holder.target_x_count ?? 0,
        target_facebook_personal_count: holder.target_facebook_personal_count ?? 0,
        target_facebook_umbrella_count: holder.target_facebook_umbrella_count ?? 0,
        target_instagram_count: holder.target_instagram_count ?? 0,
        target_tiktok_count: holder.target_tiktok_count ?? 0,
      },
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

export async function assertManagerCanViewHolder(
  managerId: number,
  holderId: number,
  source: AdminEmployeeSource
): Promise<boolean> {
  const managerCountries = await fetchManagerCountries(managerId);
  if (!managerCountries.length) return false;

  const managerRegion = await fetchManagerRegion(managerId);

  if (source === "temp") {
    const row = await queryOne<{ country: string | null; region: string | null }>(
      `SELECT country, region
         FROM temp_users
        WHERE id = $1
          AND role = 'employee'
          AND is_active = TRUE`,
      [holderId]
    );
    if (!sameProject(row?.region, managerRegion)) return false;
    return spareItemMatchesCountries(
      { country: row?.country ?? null, projects: row?.country ? [row.country] : [] },
      managerCountries
    );
  }

  // Main (ALPHAA) holder: region 'Alphaa' or also a Main handler (main_country).
  if (!sameProject("Alphaa", managerRegion)) return false;
  const row = await queryOne<{ country: string | null }>(
    `SELECT ${ALPHAA_LEGACY_COUNTRY} AS country
       FROM temp_users u
      WHERE u.id = $1
        AND ${ALPHAA_REGION_WHERE}`,
    [holderId]
  );
  if (!row) return false;
  return spareItemMatchesCountries(
    { country: row.country, projects: row.country ? [row.country] : [] },
    managerCountries
  );
}

export async function assertManagerCanSpareAccount(
  managerId: number,
  accountId: number,
  source: AdminEmployeeSource
): Promise<boolean> {
  const managerCountries = await fetchManagerCountries(managerId);
  if (!managerCountries.length) return false;

  if (source === "temp") {
    const row = await queryOne<{
      country: string | null;
      region: string | null;
    }>(
      `SELECT u.country, u.region
         FROM temp_social_media_accounts a
         INNER JOIN temp_users u ON u.id = a.user_id
        WHERE a.id = $1`,
      [accountId]
    );
    if (!row) return false;
    // Any project (Africa, Europe, Main, Asia): the account's owner must be in the
    // manager's own project and one of the manager's countries.
    if (!sameProject(row.region, await fetchManagerRegion(managerId))) return false;
    return spareItemMatchesCountries(
      { country: row.country, projects: row.country ? [row.country] : [] },
      managerCountries
    );
  }

  // Main (ALPHAA) account: owned by a Main holder (region 'Alphaa' or main_country).
  if (!sameProject("Alphaa", await fetchManagerRegion(managerId))) return false;
  const row = await queryOne<{ country: string | null }>(
    `SELECT ${ALPHAA_LEGACY_COUNTRY} AS country
       FROM temp_social_media_accounts sma
       INNER JOIN temp_users u ON u.id = sma.user_id
      WHERE sma.id = $1
        AND ${ALPHAA_REGION_WHERE}`,
    [accountId]
  );
  if (!row) return false;
  return spareItemMatchesCountries(
    { country: row.country, projects: row.country ? [row.country] : [] },
    managerCountries
  );
}

export async function assertManagerCanEditEmployee(
  managerId: number,
  employeeId: number
): Promise<boolean> {
  const managerCountries = await fetchManagerCountries(managerId);
  if (!managerCountries.length) return false;

  const scope = managerEmployeeScopeSql("e", "$1", "$3");
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok
       FROM temp_users e
      WHERE e.id = $2
        AND ${scope}
      LIMIT 1`,
    [managerId, employeeId, managerCountries]
  );
  return rows.length > 0;
}
