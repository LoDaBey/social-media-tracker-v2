import { fetchAlphaaAdminExtract } from "@/lib/admin-extract-alphaa-data";
import {
  countriesForExtractSource,
  EXTRACT_ROLES,
  extractRoleLabel,
  isExtractRoleFilter,
} from "@/lib/admin-extract-filters";
import { extractFilterPlatformLabel } from "@/lib/admin-extract-platform";
import {
  overviewDisplayCountry,
  overviewLabeledCountry,
} from "@/lib/overview-country-display";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import { query } from "@/lib/db";
import type { AccountScope } from "@/types/db";
import type {
  AdminExtractBucketCount,
  AdminExtractFilters,
  AdminExtractResult,
  AdminExtractRoleFilter,
  AdminExtractRow,
  AdminExtractSummary,
} from "@/types/admin";

export { emptyAdminExtractFilters } from "@/lib/admin-extract-filters";

const EMPTY_SUMMARY: AdminExtractSummary = {
  total: 0,
  byRegion: [],
  byCountry: [],
  byPlatform: [],
  byScope: [],
  byRole: [],
};

function normalizeHandlerRole(role: string | null): AdminExtractRoleFilter | null {
  const value = role?.trim().toLowerCase() ?? "";
  if (value === "team leader" || value === "team_lead") return "team_lead";
  if (isExtractRoleFilter(value)) return value;
  if (value === "handler") return "employee";
  return null;
}

function scopeLabel(scope: AccountScope) {
  return scope === "umbrella" ? "Umbrella" : "Personal";
}

function regionLabel(region: string | null | undefined) {
  const trimmed = region?.trim() || "Unassigned";
  if (trimmed.toLowerCase() === "balkan") return "Europe";
  if (trimmed.toLowerCase() === "alphaa") return MAIN_PROJECT_LABEL;
  return trimmed;
}

function countBy(
  rows: AdminExtractRow[],
  keyFn: (row: AdminExtractRow) => string,
  labelFn: (key: string) => string
): AdminExtractBucketCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: labelFn(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildSummary(rows: AdminExtractRow[]): AdminExtractSummary {
  return {
    total: rows.length,
    byRegion: countBy(
      rows,
      (row) => regionLabel(row.region),
      (key) => key
    ),
    byCountry: countBy(
      rows,
      (row) => row.country?.trim() || "Unassigned",
      (key) => key
    ),
    byPlatform: countBy(
      rows.filter((row) => Boolean(row.platform)),
      (row) => extractFilterPlatformLabel(row.platform),
      (key) => key
    ),
    byScope: countBy(
      rows.filter((row) => Boolean(row.platform)),
      (row) => row.account_scope,
      (key) => scopeLabel(key as AccountScope)
    ),
    byRole: countBy(
      rows,
      (row) => row.handler_role ?? "unassigned",
      (key) =>
        key === "unassigned"
          ? "Unassigned"
          : extractRoleLabel(key as AdminExtractRoleFilter)
    ),
  };
}

function sortExtractRows(rows: AdminExtractRow[]) {
  return [...rows].sort((a, b) => {
    const regionCmp = regionLabel(a.region).localeCompare(regionLabel(b.region));
    if (regionCmp !== 0) return regionCmp;
    const countryCmp = (a.country ?? "").localeCompare(b.country ?? "");
    if (countryCmp !== 0) return countryCmp;
    const handlerCmp = a.handler_name.localeCompare(b.handler_name);
    if (handlerCmp !== 0) return handlerCmp;
    const platformCmp = a.platform.localeCompare(b.platform);
    if (platformCmp !== 0) return platformCmp;
    return a.id - b.id;
  });
}

function appendTempUserRegionFilter(
  filters: AdminExtractFilters,
  params: unknown[],
  where: string[]
) {
  if (filters.region === "Africa") {
    params.push(["Africa"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else if (filters.region === "Europe") {
    params.push(["Europe", "Balkan"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else if (filters.region === "Asia") {
    // Compared lowercased below, so the value must be lowercase too.
    params.push(["asia"]);
    where.push(
      `LOWER(TRIM(COALESCE(u.region, ''))) = ANY($${params.length}::text[])`
    );
  } else {
    // "all" path for temp tables only (Alphaa comes from legacy).
    where.push(
      `LOWER(TRIM(COALESCE(u.region, ''))) IN ('africa', 'europe', 'balkan', 'asia')`
    );
  }
}

function displayTempExtractCountry(
  country: string | null,
  region: string | null
): string | null {
  if (!country?.trim()) return country;
  const regionValue = region?.trim().toLowerCase() ?? "";
  if (regionValue === "asia" && country === "Palestine") {
    return overviewLabeledCountry(country, "Asia");
  }
  return overviewDisplayCountry(country, "Africa");
}

/** Role filter → handlers/users (not social accounts). */
async function fetchTempAdminExtractUsers(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  const params: unknown[] = [];
  params.push(filters.roles);
  const where: string[] = [
    `LOWER(TRIM(u.role)) = ANY($${params.length}::text[])`,
  ];

  if (filters.status === "active") {
    where.push(`u.is_active = TRUE`);
  } else if (filters.status === "archived" || filters.status === "suspended") {
    where.push(`u.is_active = FALSE`);
  }

  appendTempUserRegionFilter(filters, params, where);

  if (filters.countries.length > 0) {
    params.push(filters.countries);
    where.push(`TRIM(u.country) = ANY($${params.length}::text[])`);
  }

  const rows = await query<{
    id: number;
    region: string | null;
    country: string | null;
    handler_name: string;
    handler_role: string | null;
    email: string | null;
  }>(
    `SELECT
        u.id,
        u.region,
        u.country,
        u.full_name AS handler_name,
        u.role AS handler_role,
        u.email
       FROM temp_users u
      WHERE ${where.join("\n        AND ")}
      ORDER BY u.region ASC NULLS LAST,
               u.country ASC NULLS LAST,
               u.full_name ASC,
               u.id ASC`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    source: "temp" as const,
    region: row.region,
    country: displayTempExtractCountry(row.country, row.region),
    handler_name: row.handler_name,
    handler_role: normalizeHandlerRole(row.handler_role),
    platform: "",
    account_scope: "personal" as const,
    username: row.email,
    account_name: row.handler_name,
    account_url: null,
    category: null,
    status: "active" as const,
    is_spare: false,
  }));
}

async function fetchTempAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  if (filters.roles.length > 0) {
    return fetchTempAdminExtractUsers(filters);
  }

  const params: unknown[] = [];
  params.push([...EXTRACT_ROLES]);
  const where: string[] = [
    `LOWER(TRIM(u.role)) = ANY($${params.length}::text[])`,
    `u.is_active = TRUE`,
    // Accounts of people who are also Main handlers are listed under Main only.
    `NULLIF(TRIM(u.main_country), '') IS NULL`,
  ];

  appendTempUserRegionFilter(filters, params, where);

  if (filters.countries.length > 0) {
    params.push(filters.countries);
    where.push(`TRIM(u.country) = ANY($${params.length}::text[])`);
  }

  // Alphaa-only extra platforms never exist on temp rows.
  const tempPlatforms = filters.platforms.filter((platform) =>
    [
      "x",
      "facebook_personal",
      "facebook_umbrella",
      "instagram",
      "tiktok",
    ].includes(platform)
  );
  if (filters.platforms.length > 0 && tempPlatforms.length === 0) {
    return [];
  }
  if (tempPlatforms.length > 0) {
    params.push(tempPlatforms);
    where.push(`a.platform = ANY($${params.length}::text[])`);
  }

  if (filters.scopes.length > 0) {
    params.push(filters.scopes);
    where.push(`a.account_scope = ANY($${params.length}::text[])`);
  }

  if (filters.status === "active") {
    where.push(`a.status = 'active'`);
  } else if (filters.status === "archived" || filters.status === "suspended") {
    params.push(filters.status);
    where.push(`a.status = $${params.length}`);
  }

  if (filters.spare === "exclude") {
    where.push(`a.is_spare = FALSE`);
  } else if (filters.spare === "only") {
    where.push(`a.is_spare = TRUE`);
  }

  const rows = await query<
    Omit<AdminExtractRow, "source" | "handler_role"> & { handler_role: string | null }
  >(
    `SELECT
        a.id,
        u.region,
        u.country,
        u.full_name AS handler_name,
        u.role AS handler_role,
        a.platform,
        a.account_scope,
        a.username,
        a.account_name,
        a.account_url,
        a.category,
        a.status,
        a.is_spare
       FROM temp_social_media_accounts a
       INNER JOIN temp_users u ON u.id = a.user_id
      WHERE ${where.join("\n        AND ")}
      ORDER BY u.region ASC NULLS LAST,
               u.country ASC NULLS LAST,
               u.full_name ASC,
               a.platform ASC,
               a.id ASC`,
    params
  );

  return rows.map((row) => ({
    ...row,
    source: "temp" as const,
    handler_role: normalizeHandlerRole(row.handler_role),
    country: displayTempExtractCountry(row.country, row.region),
  }));
}

/** Query Africa/Europe temp accounts and/or ALPHAA legacy accounts. */
export async function fetchAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractResult> {
  const includeTemp =
    filters.region === "all" ||
    filters.region === "Africa" ||
    filters.region === "Europe" ||
    filters.region === "Asia";
  const includeAlphaa =
    filters.region === "all" || filters.region === "Alphaa";
  const tempCountries = countriesForExtractSource(filters.countries, "temp");
  const alphaaCountries = countriesForExtractSource(
    filters.countries,
    "alphaa"
  );

  const [tempRows, alphaaRows] = await Promise.all([
    includeTemp && !tempCountries.skip
      ? fetchTempAdminExtract({
          ...filters,
          countries: tempCountries.countries,
        })
      : Promise.resolve([]),
    includeAlphaa && !alphaaCountries.skip
      ? fetchAlphaaAdminExtract({
          ...filters,
          countries: alphaaCountries.countries,
        })
      : Promise.resolve([]),
  ]);

  const rows = sortExtractRows([...tempRows, ...alphaaRows]);
  if (rows.length === 0) {
    return { rows: [], summary: EMPTY_SUMMARY };
  }

  return { rows, summary: buildSummary(rows) };
}
