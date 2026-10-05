import { query } from "@/lib/db";
import { PLATFORM_LABELS, type Platform } from "@/lib/platform-config";
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
      (key) => PLATFORM_LABELS[key as Platform] ?? key
    ),
    byScope: countBy(
      rows,
      (row) => row.account_scope,
      (key) => scopeLabel(key as AccountScope)
    ),
  };
}

/** Query temp social accounts with optional region/country/platform/scope filters. */
export async function fetchAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractResult> {
  const params: unknown[] = [];
  const where: string[] = [
    `LOWER(u.role) = 'employee'`,
    `u.is_active = TRUE`,
  ];

  if (filters.region === "Africa") {
    params.push(["Africa"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else if (filters.region === "Europe") {
    // Europe replaced Balkan in temp tables; include legacy "Balkan" rows.
    params.push(["Europe", "Balkan"]);
    where.push(`TRIM(u.region) = ANY($${params.length}::text[])`);
  } else {
    where.push(
      `LOWER(TRIM(COALESCE(u.region, ''))) IN ('africa', 'europe', 'balkan')`
    );
  }

  if (filters.countries.length > 0) {
    params.push(filters.countries);
    where.push(`TRIM(u.country) = ANY($${params.length}::text[])`);
  }

  if (filters.platforms.length > 0) {
    params.push(filters.platforms);
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

  const rows = await query<AdminExtractRow>(
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

  if (rows.length === 0) {
    return { rows: [], summary: EMPTY_SUMMARY };
  }

  return { rows, summary: buildSummary(rows) };
}
