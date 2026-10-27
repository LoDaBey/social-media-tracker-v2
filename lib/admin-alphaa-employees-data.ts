import { query, queryOne } from "@/lib/db";
import { ALPHAA_SETUP_COUNTRIES } from "@/lib/setup-options";
import {
  baseCountryFromDisplay,
  overviewDisplayCountry,
} from "@/lib/overview-country-display";
import {
  mapAlphaaScope,
  mapAlphaaStatus,
  normalizeAlphaaPlatformKey,
} from "@/lib/admin-extract-alphaa-data";
import type {
  AdminEmployeeListFilters,
  AdminEmployeeListRow,
  AdminSocialAccountListItem,
  AdminAlphaaEmployeeEditorBundle,
  AlphaaEmployeeProfile,
} from "@/types/admin";
import type { Role } from "@/types/db";

type AlphaaUserQueryRow = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  country: string | null;
  language: string | null;
};

type AlphaaAccountQueryRow = {
  id: number;
  user_id: number;
  platform: string | null;
  personal: boolean | null;
  umberlla: boolean | null;
  acc_name: string | null;
  acc_username: string | null;
  acc_url: string | null;
  acc_email: string | null;
  acc_password_hash: string | null;
  acc_mobile: string | null;
  direction: string | null;
  acc_state: string | null;
  spare_acc: boolean | null;
  country: string | null;
  language1: string | null;
};

export function mapAlphaaRole(role: string): Role {
  const value = role.trim().toLowerCase();
  if (value === "team leader" || value === "team_lead") return "team_lead";
  if (value === "manager") return "manager";
  if (value === "admin") return "admin";
  if (value === "op") return "op";
  return "employee";
}

function alphaaRoleSql(role: AdminEmployeeListFilters["role"]): string | null {
  if (role === "employee") return `'handler'`;
  if (role === "team_lead") return `'team leader'`;
  if (role === "manager") return `'manager'`;
  if (role === "op") return `'op'`;
  return null;
}

export function canonicalAlphaaCountry(value: string) {
  const base = baseCountryFromDisplay(value);
  return (
    ALPHAA_SETUP_COUNTRIES.find(
      (country) => country.toLowerCase() === base.toLowerCase()
    ) ?? base
  );
}

function uniqueCountries(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const country = value?.trim();
    if (!country) continue;
    const key = country.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(country);
  }
  return out;
}

/** ALPHAA `users.is_active` defaults to false and is not employment status. */
export function alphaaEmployeeIsActive(
  isActiveFlag: boolean | null | undefined,
  accounts: Pick<AdminSocialAccountListItem, "is_spare" | "status">[]
): boolean {
  if (accounts.length === 0) return true;
  const hasLiveAccount = accounts.some(
    (account) => !account.is_spare && account.status === "active"
  );
  if (hasLiveAccount) return true;
  return isActiveFlag !== false;
}

function mapAlphaaAccount(row: AlphaaAccountQueryRow): AdminSocialAccountListItem {
  return {
    id: row.id,
    platform: normalizeAlphaaPlatformKey(row.platform, row.umberlla),
    account_name: row.acc_name?.trim() || row.acc_username?.trim() || "—",
    account_handle: row.acc_username,
    account_url: row.acc_url,
    category: row.direction,
    username: row.acc_username,
    account_email: row.acc_email,
    account_password: row.acc_password_hash,
    email_password: null,
    mobile_number: row.acc_mobile,
    account_scope: mapAlphaaScope(row.personal, row.umberlla),
    status: mapAlphaaStatus(row.acc_state),
    is_spare: Boolean(row.spare_acc),
  };
}

export async function fetchAlphaaAccountsByUserIds(
  userIds: number[]
): Promise<Map<number, AdminSocialAccountListItem[]>> {
  const byUser = new Map<number, AdminSocialAccountListItem[]>();
  if (userIds.length === 0) return byUser;

  const rows = await query<AlphaaAccountQueryRow>(
    `SELECT id, user_id, platform, personal, umberlla, acc_name, acc_username,
            acc_url, acc_email, acc_password_hash, acc_mobile, direction,
            acc_state, spare_acc, country, language1
       FROM social_media_accounts
      WHERE user_id = ANY($1::int[])
      ORDER BY platform ASC, id ASC`,
    [userIds]
  );
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(mapAlphaaAccount(row));
    byUser.set(row.user_id, list);
  }
  return byUser;
}

/**
 * ALPHAA roster from legacy users + social_media_accounts.
 * Kept off region-config / setup-options client import paths.
 */
export async function fetchAlphaaEmployeesList(
  filters: AdminEmployeeListFilters
): Promise<AdminEmployeeListRow[]> {
  if (filters.region === "Africa" || filters.region === "Europe") return [];
  if (filters.role === "op") return [];
  if (filters.teamLeadId != null) return [];

  const q = filters.q?.trim() ?? "";
  const status = filters.status ?? "all";
  const country = filters.country?.trim() ?? "";
  const params: unknown[] = [[...ALPHAA_SETUP_COUNTRIES]];
  const where: string[] = [
    `(
        LOWER(TRIM(u.role)) IN ('handler', 'team leader', 'manager')
        OR EXISTS (
            SELECT 1 FROM social_media_accounts sma
             WHERE sma.user_id = u.id
               AND INITCAP(TRIM(COALESCE(sma.country, ''))) = ANY($1::text[])
          )
      )`,
  ];

  const roleSql = alphaaRoleSql(filters.role);
  if (roleSql) {
    where.push(`LOWER(TRIM(u.role)) = ${roleSql}`);
  }

  if (country) {
    params.push(country);
    const i = params.length;
    where.push(
      `(INITCAP(TRIM(COALESCE(u.country, ''))) = $${i}
        OR EXISTS (
            SELECT 1 FROM social_media_accounts sma
             WHERE sma.user_id = u.id
               AND INITCAP(TRIM(COALESCE(sma.country, ''))) = $${i}
          ))`
    );
  }

  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(
      `(COALESCE(u.username, '') ILIKE $${i}
        OR COALESCE(u.email, '') ILIKE $${i}
        OR COALESCE(u.country, '') ILIKE $${i}
        OR COALESCE(u.role, '') ILIKE $${i}
        OR EXISTS (
            SELECT 1 FROM social_media_accounts sma
             WHERE sma.user_id = u.id
               AND (
                 COALESCE(sma.acc_name, '') ILIKE $${i}
                 OR COALESCE(sma.acc_username, '') ILIKE $${i}
                 OR COALESCE(sma.acc_url, '') ILIKE $${i}
                 OR COALESCE(sma.acc_email, '') ILIKE $${i}
                 OR COALESCE(sma.platform, '') ILIKE $${i}
                 OR COALESCE(sma.country, '') ILIKE $${i}
               )
          ))`
    );
  }

  const hasAnyAccountSql = `EXISTS (
      SELECT 1 FROM social_media_accounts sma
       WHERE sma.user_id = u.id
    )`;
  const hasLiveAccountSql = `EXISTS (
      SELECT 1 FROM social_media_accounts sma
       WHERE sma.user_id = u.id
         AND COALESCE(sma.spare_acc, FALSE) IS FALSE
         AND (
           sma.acc_state IS NULL
           OR LOWER(TRIM(sma.acc_state)) IN ('', 'active', 'open', 'live')
         )
    )`;
  if (status === "active") {
    where.push(
      `(COALESCE(u.is_active, TRUE) = TRUE OR ${hasLiveAccountSql} OR NOT ${hasAnyAccountSql})`
    );
  }
  if (status === "inactive") {
    where.push(
      `(COALESCE(u.is_active, TRUE) = FALSE AND ${hasAnyAccountSql} AND NOT ${hasLiveAccountSql})`
    );
  }

  const rows = await query<AlphaaUserQueryRow>(
    `SELECT
        u.id,
        COALESCE(NULLIF(TRIM(u.username), ''), 'Handler ' || u.id::text) AS full_name,
        COALESCE(NULLIF(TRIM(u.email), ''), '') AS email,
        COALESCE(u.role, 'Handler') AS role,
        COALESCE(u.is_active, TRUE) AS is_active,
        NULLIF(INITCAP(TRIM(COALESCE(u.country, ''))), '') AS country,
        (
          SELECT INITCAP(TRIM(sma.language1))
            FROM social_media_accounts sma
           WHERE sma.user_id = u.id
             AND NULLIF(TRIM(sma.language1), '') IS NOT NULL
           ORDER BY sma.id ASC
           LIMIT 1
        ) AS language
       FROM users u
      WHERE ${where.join(" AND ")}
      ORDER BY full_name ASC, u.id ASC`,
    params
  );

  const userIds = rows.map((row) => row.id);
  const accountsByUser = await fetchAlphaaAccountsByUserIds(userIds);
  const countriesByUser = new Map<number, string[]>();
  if (userIds.length > 0) {
    const accountCountryRows = await query<{ user_id: number; country: string }>(
      `SELECT user_id, INITCAP(TRIM(COALESCE(country, ''))) AS country
         FROM social_media_accounts
        WHERE user_id = ANY($1::int[])
          AND NULLIF(TRIM(country), '') IS NOT NULL`,
      [userIds]
    );
    for (const row of accountCountryRows) {
      const list = countriesByUser.get(row.user_id) ?? [];
      list.push(row.country);
      countriesByUser.set(row.user_id, list);
    }
  }

  return rows.map((row) => {
    const accounts = accountsByUser.get(row.id) ?? [];
    const accountCountries = uniqueCountries(countriesByUser.get(row.id) ?? []);
    const countries = (
      accountCountries.length > 0
        ? accountCountries
        : uniqueCountries([row.country])
    ).map((value) => overviewDisplayCountry(value, "Alphaa"));
    const planAccounts = accounts.filter((account) => !account.is_spare).length;
    const isActive = alphaaEmployeeIsActive(row.is_active, accounts);
    return {
      id: row.id,
      source: "alphaa",
      full_name: row.full_name,
      email: row.email,
      role: mapAlphaaRole(row.role),
      is_active: isActive,
      employee_code: null,
      employment_status: isActive ? "active" : "deactivated",
      team_lead_id: null,
      team_lead_name: null,
      manager_id: null,
      manager_name: null,
      op_id: null,
      op_name: null,
      country: countries[0] ?? null,
      language: row.language,
      countries,
      current_level: 0,
      target_accounts_sum: planAccounts,
      cycle_status: "pending",
      accounts,
    };
  });
}

type AlphaaProfileQueryRow = {
  id: number;
  username: string | null;
  email: string | null;
  role: string | null;
  phone_number: string | null;
  is_active: boolean | null;
  country: string | null;
  department: string | null;
  location: string | null;
  projects: string[] | null;
};

export async function fetchAlphaaEmployeeById(
  id: number
): Promise<AlphaaEmployeeProfile | null> {
  const user = await queryOne<AlphaaProfileQueryRow>(
    `SELECT id, username, email, role, phone_number, is_active,
            NULLIF(INITCAP(TRIM(COALESCE(country, ''))), '') AS country,
            department, location, projects
       FROM users
      WHERE id = $1`,
    [id]
  );
  if (!user) return null;

  const accountsByUser = await fetchAlphaaAccountsByUserIds([id]);
  const accounts = accountsByUser.get(id) ?? [];
  const accountCountryRows = await query<{ country: string }>(
    `SELECT INITCAP(TRIM(COALESCE(country, ''))) AS country
       FROM social_media_accounts
      WHERE user_id = $1
        AND NULLIF(TRIM(country), '') IS NOT NULL`,
    [id]
  );
  const languageRow = await queryOne<{ language: string }>(
    `SELECT INITCAP(TRIM(language1)) AS language
       FROM social_media_accounts
      WHERE user_id = $1
        AND NULLIF(TRIM(language1), '') IS NOT NULL
      ORDER BY id ASC
      LIMIT 1`,
    [id]
  );
  const accountCountries = uniqueCountries(
    accountCountryRows.map((row) => row.country)
  );
  const countries = (
    accountCountries.length > 0
      ? accountCountries
      : uniqueCountries([user.country])
  ).map((value) => overviewDisplayCountry(value, "Alphaa"));
  return {
    id: user.id,
    fullName:
      user.username?.trim() || `Handler ${user.id}`,
    email: user.email?.trim() || "",
    roleLabel: user.role?.trim() || "Handler",
    mappedRole: mapAlphaaRole(user.role ?? "Handler"),
    phone: user.phone_number,
    country: countries[0] ?? null,
    countries,
    language: languageRow?.language ?? null,
    isActive: alphaaEmployeeIsActive(user.is_active, accounts),
    department: user.department,
    location: user.location,
    projects: Array.isArray(user.projects)
      ? user.projects.filter(Boolean)
      : [],
    accounts,
  };
}

export async function fetchAlphaaEmployeeEditorBundle(
  userId: number
): Promise<AdminAlphaaEmployeeEditorBundle | null> {
  const profile = await fetchAlphaaEmployeeById(userId);
  if (!profile) return null;

  const country = canonicalAlphaaCountry(
    profile.countries[0] ?? profile.country ?? ""
  );

  return {
    source: "alphaa",
    projectLabel: "ALPHAA",
    fetchedAt: new Date().toISOString(),
    fullName: profile.fullName,
    role: profile.mappedRole,
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? "",
      roleLabel: profile.roleLabel,
      country,
      department: profile.department ?? "",
      location: profile.location ?? "",
      projects: profile.projects,
      isActive: profile.isActive,
    },
  };
}
