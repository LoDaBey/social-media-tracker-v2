import { query, queryOne } from "@/lib/db";
import type { EmployeeReporting } from "@/types/admin";

function reportingKeys(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const value of values) {
    const key = value?.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

async function alphaaNameForRole(
  roles: string[],
  keys: string[],
  excludeUserId: number
): Promise<string | null> {
  if (keys.length === 0) return null;

  const row = await queryOne<{ full_name: string }>(
    `SELECT COALESCE(NULLIF(TRIM(username), ''), 'User ' || id::text) AS full_name
       FROM users
      WHERE id <> $1
        AND LOWER(TRIM(role)) = ANY($2::text[])
        AND EXISTS (
          SELECT 1
            FROM unnest(COALESCE(projects, ARRAY[]::text[])) AS p
           WHERE LOWER(TRIM(p)) = ANY($3::text[])
        )
      ORDER BY id ASC
      LIMIT 1`,
    [excludeUserId, roles, keys]
  );
  return row?.full_name ?? null;
}

async function alphaaNameForCountry(
  roles: string[],
  keys: string[],
  excludeUserId: number
): Promise<string | null> {
  if (keys.length === 0) return null;

  const row = await queryOne<{ full_name: string }>(
    `SELECT COALESCE(NULLIF(TRIM(username), ''), 'User ' || id::text) AS full_name
       FROM users
      WHERE id <> $1
        AND LOWER(TRIM(role)) = ANY($2::text[])
        AND LOWER(TRIM(COALESCE(country, ''))) = ANY($3::text[])
      ORDER BY id ASC
      LIMIT 1`,
    [excludeUserId, roles, keys]
  );
  return row?.full_name ?? null;
}

async function resolveAlphaaNames(
  keys: string[],
  fallbackCountryKeys: string[],
  excludeUserId: number
): Promise<EmployeeReporting> {
  let teamLeadName = await alphaaNameForRole(
    ["team leader", "team_lead"],
    keys,
    excludeUserId
  );
  let managerName = await alphaaNameForRole(["manager"], keys, excludeUserId);

  if (!teamLeadName) {
    teamLeadName = await alphaaNameForCountry(
      ["team leader", "team_lead"],
      fallbackCountryKeys,
      excludeUserId
    );
  }
  if (!managerName) {
    managerName = await alphaaNameForCountry(
      ["manager"],
      fallbackCountryKeys,
      excludeUserId
    );
  }

  return { teamLeadName, managerName };
}

async function fetchAlphaaReporting(id: number): Promise<EmployeeReporting | null> {
  const user = await queryOne<{
    projects: string[] | null;
    country: string | null;
  }>(`SELECT projects, country FROM users WHERE id = $1`, [id]);
  if (!user) return null;

  const projectKeys = reportingKeys(user.projects ?? []);
  if (projectKeys.length > 0) {
    return resolveAlphaaNames(projectKeys, reportingKeys([user.country]), id);
  }

  const accountCountries = await query<{ country: string | null }>(
    `SELECT DISTINCT country
       FROM social_media_accounts
      WHERE user_id = $1
        AND NULLIF(TRIM(country), '') IS NOT NULL`,
    [id]
  );
  const countryKeys = reportingKeys([
    user.country,
    ...accountCountries.map((row) => row.country),
  ]);
  return resolveAlphaaNames(countryKeys, countryKeys, id);
}

async function fetchTempReporting(id: number): Promise<EmployeeReporting | null> {
  const row = await queryOne<{
    team_lead_name: string | null;
    manager_name: string | null;
  }>(
    `SELECT tl.full_name AS team_lead_name,
            mgr.full_name AS manager_name
       FROM temp_users u
       LEFT JOIN temp_users tl ON tl.id = u.team_lead_id
       LEFT JOIN temp_users mgr ON mgr.id = u.manager_id
      WHERE u.id = $1`,
    [id]
  );
  if (!row) return null;
  return {
    teamLeadName: row.team_lead_name,
    managerName: row.manager_name,
  };
}

export async function fetchEmployeeReporting(
  source: "temp" | "alphaa",
  id: number
): Promise<EmployeeReporting | null> {
  if (source === "alphaa") return fetchAlphaaReporting(id);
  return fetchTempReporting(id);
}
