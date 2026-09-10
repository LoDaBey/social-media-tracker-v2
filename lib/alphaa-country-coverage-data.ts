import { query } from "@/lib/db";
import {
  ALPHAA_ACTIVE_ACCOUNT_WHERE,
  ALPHAA_NORMALIZED_COUNTRY,
  ALPHAA_PLATFORM_IS_FACEBOOK,
  ALPHAA_PLATFORM_IS_INSTAGRAM,
  ALPHAA_PLATFORM_IS_TIKTOK,
  ALPHAA_PLATFORM_IS_X,
  ALPHAA_USER_COUNTRY,
} from "@/lib/alphaa-platform-sql";

export type AlphaaCountryActuals = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
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
};

function countrySqlClause(paramIndex: number, column: string) {
  return `${column} = ANY($${paramIndex}::text[])`;
}

export async function fetchAlphaaCountryActuals(
  countries: string[]
): Promise<Map<string, AlphaaCountryActuals>> {
  if (countries.length === 0) return new Map();

  const [employeeRows, accountRows] = await Promise.all([
    query<{ country: string; employees: string }>(
      `SELECT
         country,
         COUNT(DISTINCT handler_id)::text AS employees
       FROM (
         SELECT ${ALPHAA_USER_COUNTRY} AS country, u.id AS handler_id
           FROM users u
          WHERE u.role = 'Handler'
            AND u.is_active = TRUE
            AND ${countrySqlClause(1, ALPHAA_USER_COUNTRY)}

         UNION

         SELECT ${ALPHAA_NORMALIZED_COUNTRY} AS country, sma.user_id AS handler_id
           FROM social_media_accounts sma
          WHERE sma.spare_acc = FALSE
            AND sma.user_id IS NOT NULL
            AND ${countrySqlClause(1, ALPHAA_NORMALIZED_COUNTRY)}
       ) handlers
       GROUP BY country`,
      [countries]
    ),
    query<{
      country: string;
      x: string;
      facebook_personal: string;
      facebook_umbrella: string;
      instagram: string;
      tiktok: string;
    }>(
      `SELECT
         ${ALPHAA_NORMALIZED_COUNTRY} AS country,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_X})::text AS x,
         COUNT(sma.id) FILTER (
           WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK} AND sma.personal IS TRUE
         )::text AS facebook_personal,
         COUNT(sma.id) FILTER (
           WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK} AND sma.umberlla IS TRUE
         )::text AS facebook_umbrella,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_INSTAGRAM})::text AS instagram,
         COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_TIKTOK})::text AS tiktok
       FROM social_media_accounts sma
       WHERE ${ALPHAA_ACTIVE_ACCOUNT_WHERE}
         AND ${countrySqlClause(1, ALPHAA_NORMALIZED_COUNTRY)}
       GROUP BY ${ALPHAA_NORMALIZED_COUNTRY}`,
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
    });
  }

  for (const row of employeeRows) {
    const country = row.country.trim() || "Unassigned";
    const current = actualByCountry.get(country) ?? {
      employees: 0,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
    };
    current.employees = Number(row.employees);
    actualByCountry.set(country, current);
  }

  for (const row of accountRows) {
    const country = row.country.trim() || "Unassigned";
    const current = actualByCountry.get(country) ?? {
      employees: 0,
      x: 0,
      facebookPersonal: 0,
      facebookUmbrella: 0,
      instagram: 0,
      tiktok: 0,
    };
    current.x = Number(row.x);
    current.facebookPersonal = Number(row.facebook_personal);
    current.facebookUmbrella = Number(row.facebook_umbrella);
    current.instagram = Number(row.instagram);
    current.tiktok = Number(row.tiktok);
    actualByCountry.set(country, current);
  }

  return actualByCountry;
}

export async function fetchAlphaaHolderActuals(
  countries: string[]
): Promise<Map<string, AlphaaHolderActuals[]>> {
  if (countries.length === 0) return new Map();

  const rows = await query<{
    id: number;
    full_name: string;
    email: string;
    country: string;
    x: string;
    facebook_personal: string;
    facebook_umbrella: string;
    instagram: string;
    tiktok: string;
  }>(
    `SELECT
       u.id,
       COALESCE(NULLIF(TRIM(u.username), ''), 'Unknown') AS full_name,
       COALESCE(u.email, '') AS email,
       ${ALPHAA_NORMALIZED_COUNTRY} AS country,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_X})::text AS x,
       COUNT(sma.id) FILTER (
         WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK} AND sma.personal IS TRUE
       )::text AS facebook_personal,
       COUNT(sma.id) FILTER (
         WHERE ${ALPHAA_PLATFORM_IS_FACEBOOK} AND sma.umberlla IS TRUE
       )::text AS facebook_umbrella,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_INSTAGRAM})::text AS instagram,
       COUNT(sma.id) FILTER (WHERE ${ALPHAA_PLATFORM_IS_TIKTOK})::text AS tiktok
     FROM users u
     INNER JOIN social_media_accounts sma
       ON sma.user_id = u.id
      AND ${ALPHAA_ACTIVE_ACCOUNT_WHERE}
     WHERE u.role = 'Handler'
       AND u.is_active = TRUE
       AND ${countrySqlClause(1, ALPHAA_NORMALIZED_COUNTRY)}
     GROUP BY u.id, u.username, u.email, ${ALPHAA_NORMALIZED_COUNTRY}
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
    });
    holdersByCountry.set(country, list);
  }

  return holdersByCountry;
}
