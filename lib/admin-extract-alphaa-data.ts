import {
  ALPHAA_LEGACY_ACCOUNT_WHERE,
  ALPHAA_LEGACY_COUNTRY,
  ALPHAA_PLATFORM_IS_FACEBOOK,
  ALPHAA_PLATFORM_IS_INSTAGRAM,
  ALPHAA_PLATFORM_IS_TIKTOK,
  ALPHAA_PLATFORM_IS_X,
  alphaaExtraPlatformSql,
} from "@/lib/alphaa-platform-sql";
import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import { query } from "@/lib/db";
import type {
  AdminExtractFilters,
  AdminExtractRow,
  AlphaaExtraPlatformKey,
} from "@/types/admin";
import type { AccountScope } from "@/types/db";

type AlphaaExtractQueryRow = {
  id: number;
  region: string | null;
  country: string | null;
  handler_name: string | null;
  platform: string | null;
  personal: boolean | null;
  umberlla: boolean | null;
  username: string | null;
  account_name: string | null;
  account_url: string | null;
  category: string | null;
  acc_state: string | null;
  is_spare: boolean;
};

function mapAlphaaStatus(
  accState: string | null
): AdminExtractRow["status"] {
  const value = (accState ?? "").trim().toLowerCase();
  if (value === "archived") return "archived";
  if (value === "suspended" || value === "inactive" || value === "closed") {
    return "suspended";
  }
  return "active";
}

function mapAlphaaScope(
  personal: boolean | null,
  umberlla: boolean | null
): AccountScope {
  return umberlla ? "umbrella" : personal ? "personal" : "personal";
}

function normalizeAlphaaPlatformKey(
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
      return `((${ALPHAA_PLATFORM_IS_FACEBOOK}) AND sma.personal IS TRUE)`;
    case "facebook_umbrella":
      return `((${ALPHAA_PLATFORM_IS_FACEBOOK}) AND sma.umberlla IS TRUE)`;
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
    country: row.country?.trim() || null,
    handler_name: row.handler_name?.trim() || `Handler ${row.id}`,
    platform: normalizeAlphaaPlatformKey(row.platform, row.umberlla),
    account_scope: mapAlphaaScope(row.personal, row.umberlla),
    username: row.username,
    account_name: row.account_name?.trim() || row.username?.trim() || "—",
    account_url: row.account_url,
    category: row.category,
    status: mapAlphaaStatus(row.acc_state),
    is_spare: Boolean(row.is_spare),
  };
}

/** ALPHAA accounts from legacy social_media_accounts (+ users). */
export async function fetchAlphaaAdminExtract(
  filters: AdminExtractFilters
): Promise<AdminExtractRow[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.spare === "exclude") {
    where.push(ALPHAA_LEGACY_ACCOUNT_WHERE);
  } else if (filters.spare === "only") {
    where.push(`sma.spare_acc IS TRUE`);
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
      where.push(`sma.umberlla IS TRUE`);
    } else {
      where.push(`COALESCE(sma.umberlla, FALSE) IS FALSE`);
    }
  }

  if (filters.status === "active") {
    where.push(`
      (
        sma.acc_state IS NULL
        OR LOWER(TRIM(sma.acc_state)) IN ('', 'active', 'open', 'live')
      )
    `);
  } else if (filters.status === "archived") {
    where.push(`LOWER(TRIM(COALESCE(sma.acc_state, ''))) = 'archived'`);
  } else if (filters.status === "suspended") {
    where.push(`
      LOWER(TRIM(COALESCE(sma.acc_state, ''))) IN (
        'suspended', 'inactive', 'closed'
      )
    `);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join("\n        AND ")}` : "";

  const rows = await query<AlphaaExtractQueryRow>(
    `SELECT
        sma.id,
        sma.region,
        ${ALPHAA_LEGACY_COUNTRY} AS country,
        COALESCE(
          NULLIF(TRIM(u.username), ''),
          'Handler ' || COALESCE(sma.user_id::text, sma.id::text)
        ) AS handler_name,
        sma.platform,
        sma.personal,
        sma.umberlla,
        sma.acc_username AS username,
        sma.acc_name AS account_name,
        sma.acc_url AS account_url,
        sma.direction AS category,
        sma.acc_state,
        COALESCE(sma.spare_acc, FALSE) AS is_spare
       FROM social_media_accounts sma
       LEFT JOIN users u ON u.id = sma.user_id
      ${whereSql}
      ORDER BY country ASC NULLS LAST,
               handler_name ASC,
               sma.platform ASC,
               sma.id ASC`,
    params
  );

  return rows.map(mapAlphaaRow);
}
