import {
  emptyAlphaaExtraPlatformCounts,
  parseAlphaaExtraPlatformRow,
} from "@/lib/alphaa-coverage-platforms";
import { query } from "@/lib/db";
import {
  ALPHAA_COVERAGE_ACCOUNT_WHERE,
  ALPHAA_LEGACY_COUNTRY,
  ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL,
  ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA,
  ALPHAA_PLATFORM_IS_INSTAGRAM,
  ALPHAA_PLATFORM_IS_TIKTOK,
  ALPHAA_PLATFORM_IS_X,
  alphaaExtraPlatformCountColumns,
} from "@/lib/alphaa-platform-sql";
import type { AlphaaExtraPlatformKey } from "@/types/admin";

export type AlphaaCountryActuals = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  extraPlatforms: Record<AlphaaExtraPlatformKey, number>;
  /** Unique live non-spare accounts — matches extract. */
  accounts: number;
};

export type AlphaaHolderActuals = {
  id: number;
  fullName: string;
  email: string;
  country: string;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  extraPlatforms: Record<AlphaaExtraPlatformKey, number>;
  accounts: number;
};

function countrySqlClause(paramIndex: number) {
  return `${ALPHAA_LEGACY_COUNTRY} = ANY($${paramIndex}::text[])`;
}

function existingCountryKey(map: Map<string, unknown>, country: string): string {
  if (map.has(country)) return country;
  const needle = country.trim().toLowerCase();
  for (const key of map.keys()) {
    if (key.trim().toLowerCase() === needle) return key;
  }
  return country;
}

/**
 * ALPHAA tab only — legacy users + social_media_accounts (TableCreations.sql).
 * Never reads temp_users or temp_social_media_accounts.
 * Spare accounts (spare_acc = true) and inactive acc_state rows are excluded.
 * TOTAL uses unique account ids so it matches extract.
 */
export async function fetchAlphaaCountryActuals(
  countries: string[]
): Promise<Map<string, AlphaaCountryActuals>> {
  if (countries.length === 0) return new Map();

  const [employeeRows, accountRows] = await Promise.all([
    query<{ country: string; employees: string }>(
      `SELECT
         ${ALPHAA_LEGACY_COUNTRY} AS country,
         COUNT(DISTINCT u.id)::text AS employees
       FROM users u
       INNER JOIN social_media_accounts sma ON sma.user_id = u.id
       WHERE ${ALPHAA_COVERAGE_ACCOUNT_WHERE}
         AND ${countrySqlClause(1)}
       GROUP BY ${ALPHAA_LEGACY_COUNTRY}`,
      [countries]
    ),
    query<
      {
        country: string;
        accounts: string;
        x: string;
        facebook_personal: string;
        facebook_umbrella: string;
        instagram: string;
        tiktok: string;
      } & Partial<Record<AlphaaExtraPlatformKey, string>>
    >(
      `SELECT
         ${ALPHAA_LEGACY_COUNTRY} AS country,
         COUNT(sma.id)::text AS accounts,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_X})::text AS x,
         COUNT(sma.id) FILTER (
           WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL}
         )::text AS facebook_personal,
         COUNT(sma.id) FILTER (
           WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA}
         )::text AS facebook_umbrella,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_INSTAGRAM})::text AS instagram,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_TIKTOK})::text AS tiktok,
         ${alphaaExtraPlatformCountColumns()}
       FROM social_media_accounts sma
       WHERE ${ALPHAA_COVERAGE_ACCOUNT_WHERE}
         AND ${countrySqlClause(1)}
       GROUP BY ${ALPHAA_LEGACY_COUNTRY}`,
      [countries]
    ),
  ]);

  const actualByCountry = new Map<string, AlphaaCountryActuals>();

  for (const country of countries) {
    actualByCountry.set(country, {
      employees: 0,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
      extraPlatforms: emptyAlphaaExtraPlatformCounts(),
      accounts: 0,
    });
  }

  for (const row of employeeRows) {
    const country = existingCountryKey(
      actualByCountry,
      row.country.trim() || "Unassigned"
    );
    const current = actualByCountry.get(country) ?? {
      employees: 0,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
      extraPlatforms: emptyAlphaaExtraPlatformCounts(),
      accounts: 0,
    };
    current.employees = Number(row.employees);
    actualByCountry.set(country, current);
  }

  for (const row of accountRows) {
    const country = existingCountryKey(
      actualByCountry,
      row.country.trim() || "Unassigned"
    );
    const current = actualByCountry.get(country) ?? {
      employees: 0,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
      extraPlatforms: emptyAlphaaExtraPlatformCounts(),
      accounts: 0,
    };
    current.x = Number(row.x);
    current.facebookPersonal = Number(row.facebook_personal);
    current.facebookUmbrella = Number(row.facebook_umbrella);
    current.instagram = Number(row.instagram);
    current.tiktok = Number(row.tiktok);
    current.extraPlatforms = parseAlphaaExtraPlatformRow(row);
    current.accounts = Number(row.accounts);
    actualByCountry.set(country, current);
  }

  return actualByCountry;
}

/** Spare accounts (`spare_acc`) on the legacy ALPHAA table. */
export async function fetchAlphaaSpareCount(
  countries: string[]
): Promise<number> {
  if (countries.length === 0) return 0;
  const rows = await query<{ spare: string }>(
    `SELECT COUNT(*)::text AS spare
       FROM social_media_accounts sma
      WHERE sma.spare_acc IS TRUE
        AND ${countrySqlClause(1)}`,
    [countries]
  );
  return Number(rows[0]?.spare ?? 0);
}

/** One row per legacy user with accounts in the ALPHAA country (users + social_media_accounts). */
export async function fetchAlphaaHolderActuals(
  countries: string[]
): Promise<Map<string, AlphaaHolderActuals[]>> {
  if (countries.length === 0) return new Map();

  const rows = await query<
    {
      id: number;
      full_name: string;
      email: string;
      country: string;
      x: string;
      facebook_personal: string;
      facebook_umbrella: string;
      instagram: string;
      tiktok: string;
      accounts: string;
    } & Partial<Record<AlphaaExtraPlatformKey, string>>
  >(
    `SELECT
       u.id,
       COALESCE(
         NULLIF(TRIM(u.username), ''),
         'Handler ' || u.id::text
       ) AS full_name,
       COALESCE(NULLIF(TRIM(u.email), ''), '') AS email,
       ${ALPHAA_LEGACY_COUNTRY} AS country,
       COUNT(sma.id)::text AS accounts,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_X})::text AS x,
       COUNT(sma.id) FILTER (
         WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL}
       )::text AS facebook_personal,
       COUNT(sma.id) FILTER (
         WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA}
       )::text AS facebook_umbrella,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_INSTAGRAM})::text AS instagram,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_TIKTOK})::text AS tiktok,
       ${alphaaExtraPlatformCountColumns()}
     FROM users u
     INNER JOIN social_media_accounts sma ON sma.user_id = u.id
     WHERE ${ALPHAA_COVERAGE_ACCOUNT_WHERE}
       AND ${countrySqlClause(1)}
     GROUP BY u.id, u.username, u.email, ${ALPHAA_LEGACY_COUNTRY}
     ORDER BY full_name ASC, u.id ASC`,
    [countries]
  );

  const holdersByCountry = new Map<string, AlphaaHolderActuals[]>();
  for (const row of rows) {
    const country = row.country.trim() || "Unassigned";
    const list = holdersByCountry.get(country) ?? [];
    list.push({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      country,
      x: Number(row.x),
      facebookPersonal: Number(row.facebook_personal),
      facebookUmbrella: Number(row.facebook_umbrella),
      instagram: Number(row.instagram),
      tiktok: Number(row.tiktok),
      extraPlatforms: parseAlphaaExtraPlatformRow(row),
      accounts: Number(row.accounts),
    });
    holdersByCountry.set(country, list);
  }

  return holdersByCountry;
}
