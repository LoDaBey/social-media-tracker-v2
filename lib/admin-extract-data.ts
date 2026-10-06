import { fetchAlphaaAdminExtract } from "@/lib/admin-extract-alphaa-data";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { query } from "@/lib/db";
import type { AccountScope } from "@/types/db";
import type {
  AdminExtractBucketCount,
  AdminExtractFilters,
  AdminExtractResult,
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
};

function scopeLabel(scope: AccountScope) {
  return scope === "umbrella" ? "Umbrella" : "Personal";
}

function regionLabel(region: string | null | undefined) {
  const trimmed = region?.trim() || "Unassigned";
  if (trimmed.toLowerCase() === "balkan") return "Europe";
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
      rows,
      (row) => row.platform,
      (key) => extractPlatformLabel(key)
    ),
    byScope: countBy(
      rows,
      (row) => row.account_scope,
      (key) => scopeLabel(key as AccountScope)
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

async function fetchTempAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  const params: unknown[] = [];
  const where: string[] = [
    `LOWER(u.role) = 'employee'`,
    `u.is_active = TRUE`,
  ];

  if (filters.region === "Africa") {
    params.push(["Africa"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else if (filters.region === "Europe") {
    params.push(["Europe", "Balkan"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else {
    // "all" path for temp tables only (Alphaa comes from legacy).
    where.push(
      `LOWER(TRIM(COALESCE(u.region, ''))) IN ('africa', 'europe', 'balkan')`
    );
  }

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

  const rows = await query<Omit<AdminExtractRow, "source">>(
    `SELECT
        a.id,
        u.region,
        u.country,
        u.full_name AS handler_name,
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

  return rows.map((row) => ({ ...row, source: "temp" as const }));
}

/** Query Africa/Europe temp accounts and/or ALPHAA legacy accounts. */
export async function fetchAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractResult> {
  const includeTemp =
    filters.region === "all" ||
    filters.region === "Africa" ||
    filters.region === "Europe";
  const includeAlphaa =
    filters.region === "all" || filters.region === "Alphaa";

  const [tempRows, alphaaRows] = await Promise.all([
    includeTemp ? fetchTempAdminExtract(filters) : Promise.resolve([]),
    includeAlphaa ? fetchAlphaaAdminExtract(filters) : Promise.resolve([]),
  ]);

  const rows = sortExtractRows([...tempRows, ...alphaaRows]);
  if (rows.length === 0) {
    return { rows: [], summary: EMPTY_SUMMARY };
  }

  return { rows, summary: buildSummary(rows) };
}
