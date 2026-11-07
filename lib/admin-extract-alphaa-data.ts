import {
  ALPHAA_LEGACY_ACCOUNT_WHERE,
  ALPHAA_LEGACY_COUNTRY,
  ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL,
  ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA,
  ALPHAA_PLATFORM_IS_INSTAGRAM,
  ALPHAA_PLATFORM_IS_TIKTOK,
  ALPHAA_PLATFORM_IS_X,
  ALPHAA_REGION_WHERE,
  alphaaExtraPlatformSql,
} from "@/lib/alphaa-platform-sql";
import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import {
  EXTRACT_ROLES,
  isExtractRoleFilter,
} from "@/lib/admin-extract-filters";
import { query } from "@/lib/db";
import {
  isDualRegionCountry,
  overviewDisplayCountry,
  overviewLabeledCountry,
} from "@/lib/overview-country-display";
import { isExtractMainAsiaCountry } from "@/lib/admin-extract-filters";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type {
  AdminExtractFilters,
  AdminExtractRoleFilter,
  AdminExtractRow,
  AlphaaExtraPlatformKey,
} from "@/types/admin";
import type { AccountScope } from "@/types/db";

function displayAlphaaExtractCountry(country: string): string {
  if (isDualRegionCountry(country) || isExtractMainAsiaCountry(country)) {
    return overviewLabeledCountry(country, MAIN_PROJECT_LABEL);
  }
  return overviewDisplayCountry(country, "Alphaa");
}

type AlphaaExtractQueryRow = {
  id: number;
  region: string | null;
  country: string | null;
  handler_name: string | null;
  handler_role: string | null;
  platform: string;
  account_scope: AccountScope;
  username: string | null;
  account_name: string | null;
  account_url: string | null;
  category: string | null;
  status: AdminExtractRow["status"];
  is_spare: boolean;
};

function legacyLabelsForExtractRole(role: AdminExtractRoleFilter): string[] {
  switch (role) {
    case "employee":
      return ["handler", "employee"];
    case "team_lead":
      return ["team leader", "team_lead"];
    case "manager":
      return ["manager"];
    case "op":
      return ["op"];
  }
}

function normalizeAlphaaHandlerRole(
  role: string | null
): AdminExtractRoleFilter | null {
  const value = role?.trim().toLowerCase() ?? "";
  if (value === "handler" || value === "employee") return "employee";
  if (value === "team leader" || value === "team_lead") return "team_lead";
  if (isExtractRoleFilter(value)) return value;
  return null;
}

export function mapAlphaaStatus(
  accState: string | null
): AdminExtractRow["status"] {
  const value = (accState ?? "").trim().toLowerCase();
  if (value === "archived") return "archived";
  if (value === "suspended" || value === "inactive" || value === "closed") {
    return "suspended";
  }
  return "active";
}

export function mapAlphaaScope(
  personal: boolean | null,
  umberlla: boolean | null
): AccountScope {
  return umberlla ? "umbrella" : personal ? "personal" : "personal";
}

export function normalizeAlphaaPlatformKey(
  platform: string | null,
  umberlla: boolean | null
): string {
  const raw = (platform ?? "").trim();
  const lower = raw.toLowerCase();

  if (
    (lower === "twitter" ||
      lower === "x" ||
      lower.includes("twitter")) &&
    !lower.includes("communities") &&
    !lower.includes("verified")
  ) {
    return "x";
  }

  if (
    lower === "facebook" ||
    (lower.includes("facebook") && !lower.includes("groups"))
  ) {
    return umberlla ? "facebook_umbrella" : "facebook_personal";
  }

  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("tiktok")) return "tiktok";

  for (const key of ALPHAA_EXTRA_PLATFORM_KEYS) {
    if (matchesExtraPlatform(lower, key)) return key;
  }

  return raw || "unknown";
}

function matchesExtraPlatform(
  lower: string,
  key: AlphaaExtraPlatformKey
): boolean {
  switch (key) {
    case "threads":
      return lower.includes("thread");
    case "reddit":
      return lower.includes("reddit");
    case "youtube":
      return lower.includes("youtube");
    case "blogspot":
      return (
        (lower.includes("blogspot") || lower.includes("blogger")) &&
        !lower.includes("blogsky")
      );
    case "telegram":
      return lower.includes("telegram");
    case "website":
      return lower.includes("website");
    case "pinterest":
      return lower.includes("pinterest");
    case "turkkitap":
      return lower.includes("turkkitap") || lower.includes("1000kitap");
    case "kizlarsoruyor":
      return lower.includes("kizlarsoruyor");
    case "balatarin":
      return lower.includes("balatarin");
    default:
      return false;
  }
}

function alphaaPlatformSql(platform: string): string | null {
  switch (platform) {
    case "x":
      return `(${ALPHAA_PLATFORM_IS_X})`;
    case "facebook_personal":
      return `(${ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL})`;
    case "facebook_umbrella":
      return `(${ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA})`;
    case "instagram":
      return `(${ALPHAA_PLATFORM_IS_INSTAGRAM})`;
    case "tiktok":
      return `(${ALPHAA_PLATFORM_IS_TIKTOK})`;
    default:
      if (
        (ALPHAA_EXTRA_PLATFORM_KEYS as readonly string[]).includes(platform)
      ) {
        return `(${alphaaExtraPlatformSql(platform as AlphaaExtraPlatformKey)})`;
      }
      return null;
  }
}

function mapAlphaaRow(row: AlphaaExtractQueryRow): AdminExtractRow {
  return {
    id: row.id,
    source: "alphaa",
    region: "Alphaa",
    country: row.country?.trim()
      ? displayAlphaaExtractCountry(row.country.trim())
      : null,
    handler_name: row.handler_name?.trim() || `Handler ${row.id}`,
    handler_role: normalizeAlphaaHandlerRole(row.handler_role),
    platform: row.platform,
    account_scope: row.account_scope,
    username: row.username,
    account_name: row.account_name?.trim() || row.username?.trim() || "—",
    account_url: row.account_url,
    category: row.category,
    status: row.status,
    is_spare: Boolean(row.is_spare),
  };
}

/** Role filter → Main/legacy handlers/users (not social accounts). */
async function fetchAlphaaAdminExtractUsers(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  const params: unknown[] = [];
  params.push(filters.roles.flatMap(legacyLabelsForExtractRole));
  const where: string[] = [
    ALPHAA_REGION_WHERE,
    `LOWER(TRIM(COALESCE(u.role, 'handler'))) = ANY($${params.length}::text[])`,
  ];

  if (filters.status === "active") {
    where.push(`u.is_active IS TRUE`);
  } else if (filters.status === "archived" || filters.status === "suspended") {
    where.push(`u.is_active IS FALSE`);
  }

  if (filters.countries.length > 0) {
    params.push(filters.countries);
    where.push(
      `TRIM(COALESCE(u.country, '')) = ANY($${params.length}::text[])`
    );
  }

  const rows = await query<{
    id: number;
    country: string | null;
    handler_name: string | null;
    handler_role: string | null;
    email: string | null;
  }>(
    `SELECT
        u.id,
        TRIM(COALESCE(u.country, '')) AS country,
        COALESCE(NULLIF(TRIM(u.full_name), ''), 'Handler ' || u.id::text) AS handler_name,
        COALESCE(u.role, 'handler') AS handler_role,
        u.email
       FROM temp_users u
      WHERE ${where.join("\n        AND ")}
      ORDER BY country ASC NULLS LAST,
               handler_name ASC,
               u.id ASC`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    source: "alphaa" as const,
    region: "Alphaa",
    country: row.country?.trim()
      ? displayAlphaaExtractCountry(row.country.trim())
      : null,
    handler_name: row.handler_name?.trim() || `Handler ${row.id}`,
    handler_role: normalizeAlphaaHandlerRole(row.handler_role),
    platform: "",
    account_scope: "personal" as const,
    username: row.email,
    account_name: row.handler_name?.trim() || `Handler ${row.id}`,
    account_url: null,
    category: null,
    status: "active" as const,
    is_spare: false,
  }));
}

/** Main (ALPHAA) accounts: temp_social_media_accounts of temp_users in region 'Alphaa'. */
export async function fetchAlphaaAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  if (filters.roles.length > 0) {
    return fetchAlphaaAdminExtractUsers(filters);
  }

  const params: unknown[] = [];
  const where: string[] = [ALPHAA_REGION_WHERE];
  params.push(EXTRACT_ROLES.flatMap(legacyLabelsForExtractRole));
  where.push(
    `LOWER(TRIM(COALESCE(u.role, 'handler'))) = ANY($${params.length}::text[])`
  );

  if (filters.spare === "exclude") {
    where.push(ALPHAA_LEGACY_ACCOUNT_WHERE);
  } else if (filters.spare === "only") {
    where.push(`sma.is_spare IS TRUE`);
  }

  if (filters.countries.length > 0) {
    params.push(filters.countries);
    where.push(
      `${ALPHAA_LEGACY_COUNTRY} = ANY($${params.length}::text[])`
    );
  }

  if (filters.platforms.length > 0) {
    const platformClauses = filters.platforms
      .map(alphaaPlatformSql)
      .filter((clause): clause is string => Boolean(clause));
    if (platformClauses.length === 0) {
      return [];
    }
    where.push(`(${platformClauses.join(" OR ")})`);
  }

  if (filters.scopes.length === 1) {
    if (filters.scopes[0] === "umbrella") {
      where.push(`sma.account_scope = 'umbrella'`);
    } else {
      where.push(`sma.account_scope = 'personal'`);
    }
  }

  if (filters.status === "active") {
    where.push(`sma.status = 'active'`);
  } else if (filters.status === "archived") {
    where.push(`sma.status = 'archived'`);
  } else if (filters.status === "suspended") {
    where.push(`sma.status = 'suspended'`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join("\n        AND ")}` : "";

  const rows = await query<AlphaaExtractQueryRow>(
    `SELECT
        sma.id,
        u.region,
        ${ALPHAA_LEGACY_COUNTRY} AS country,
        COALESCE(
          NULLIF(TRIM(u.full_name), ''),
          'Handler ' || sma.user_id::text
        ) AS handler_name,
        COALESCE(u.role, 'handler') AS handler_role,
        sma.platform,
        sma.account_scope,
        sma.username,
        sma.account_name,
        sma.account_url,
        sma.category,
        sma.status,
        sma.is_spare
       FROM temp_social_media_accounts sma
       INNER JOIN temp_users u ON u.id = sma.user_id
      ${whereSql}
      ORDER BY country ASC NULLS LAST,
               handler_name ASC,
               sma.platform ASC,
               sma.id ASC`,
    params
  );

  return rows.map(mapAlphaaRow);
}
