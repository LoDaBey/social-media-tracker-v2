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
  ALPHAA_REGION_WHERE,
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
 * ALPHAA tab only — temp_users (region 'Alphaa') + temp_social_media_accounts.
 * Spare accounts (is_spare) and non-active accounts are excluded.
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
       FROM temp_users u
       INNER JOIN temp_social_media_accounts sma ON sma.user_id = u.id
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
       FROM temp_social_media_accounts sma
       INNER JOIN temp_users u ON u.id = sma.user_id
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

/** Spare Main (ALPHAA) accounts (`is_spare`). */
export async function fetchAlphaaSpareCount(
  countries: string[]
): Promise<number> {
  if (countries.length === 0) return 0;
  const rows = await query<{ spare: string }>(
    `SELECT COUNT(*)::text AS spare
       FROM temp_social_media_accounts sma
       INNER JOIN temp_users u ON u.id = sma.user_id
      WHERE ${ALPHAA_REGION_WHERE}
        AND sma.is_spare IS TRUE
        AND ${countrySqlClause(1)}`,
    [countries]
  );
  return Number(rows[0]?.spare ?? 0);
}

/** One row per Main (ALPHAA) holder with accounts in the country. */
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
         NULLIF(TRIM(u.full_name), ''),
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
     FROM temp_users u
     INNER JOIN temp_social_media_accounts sma ON sma.user_id = u.id
     WHERE ${ALPHAA_COVERAGE_ACCOUNT_WHERE}
       AND ${countrySqlClause(1)}
     GROUP BY u.id, u.full_name, u.email, ${ALPHAA_LEGACY_COUNTRY}
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
