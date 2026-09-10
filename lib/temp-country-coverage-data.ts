import { query } from "@/lib/db";
import {
  TEMP_USER_COUNTRY,
  tempUserCountryInList,
} from "@/lib/temp-country-sql";

export type TempCountryActuals = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
};

export type TempHolderActuals = {
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

export type TempCoverageRegionScope = "Africa" | "Balkan" | "AfricaAndBalkan";

function tempRegionClause(scope: TempCoverageRegionScope | undefined) {
  if (scope === "Africa") {
    return ` AND LOWER(TRIM(u.region)) = 'africa'`;
  }
  if (scope === "Balkan") {
    return ` AND LOWER(TRIM(u.region)) = 'balkan'`;
  }
  if (scope === "AfricaAndBalkan") {
    return ` AND LOWER(TRIM(u.region)) IN ('africa', 'balkan')`;
  }
  return "";
}

/**
 * Africa / Balkan / Overview (Africa side) — temp_users + temp_social_media_accounts only.
 * Never reads legacy users or social_media_accounts.
 */
export async function fetchTempCountryCoverage(
  countries: string[] | null,
  options?: { regionScope?: TempCoverageRegionScope }
) {
  const sqlCountryClause =
    countries === null ? "" : ` AND ${tempUserCountryInList(1)}`;
  const sqlParams = countries === null ? [] : [countries];
  const regionClause = tempRegionClause(options?.regionScope);

  const [countryRows, holderRows, onHoldRow] = await Promise.all([
    query<{
      country: string;
      employees: string;
      x: string;
      facebook_personal: string;
      facebook_umbrella: string;
      instagram: string;
      tiktok: string;
    }>(
      `SELECT
         ${TEMP_USER_COUNTRY} AS country,
         COUNT(DISTINCT u.id)::text AS employees,
         COUNT(a.id) FILTER (WHERE a.platform = 'x')::text AS x,
         COUNT(a.id) FILTER (WHERE a.platform = 'facebook_personal')::text AS facebook_personal,
         COUNT(a.id) FILTER (WHERE a.platform = 'facebook_umbrella')::text AS facebook_umbrella,
         COUNT(a.id) FILTER (WHERE a.platform = 'instagram')::text AS instagram,
         COUNT(a.id) FILTER (WHERE a.platform = 'tiktok')::text AS tiktok
       FROM temp_users u
       LEFT JOIN temp_social_media_accounts a
         ON a.user_id = u.id
        AND a.status = 'active'
      WHERE LOWER(u.role) = 'employee'
        AND u.is_active = TRUE${regionClause}${sqlCountryClause}
      GROUP BY ${TEMP_USER_COUNTRY}`,
      sqlParams
    ),
    query<{
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
         u.full_name,
         u.email,
         ${TEMP_USER_COUNTRY} AS country,
         COUNT(a.id) FILTER (WHERE a.platform = 'x')::text AS x,
         COUNT(a.id) FILTER (WHERE a.platform = 'facebook_personal')::text AS facebook_personal,
         COUNT(a.id) FILTER (WHERE a.platform = 'facebook_umbrella')::text AS facebook_umbrella,
         COUNT(a.id) FILTER (WHERE a.platform = 'instagram')::text AS instagram,
         COUNT(a.id) FILTER (WHERE a.platform = 'tiktok')::text AS tiktok
       FROM temp_users u
       LEFT JOIN temp_social_media_accounts a
         ON a.user_id = u.id
        AND a.status = 'active'
      WHERE LOWER(u.role) = 'employee'
        AND u.is_active = TRUE${regionClause}${sqlCountryClause}
      GROUP BY u.id, u.full_name, u.email, ${TEMP_USER_COUNTRY}
      ORDER BY u.full_name ASC, u.id ASC`,
      sqlParams
    ),
    query<{ on_hold: string }>(
      countries === null
        ? `SELECT COUNT(*)::text AS on_hold
             FROM temp_users u
            WHERE employment_status = 'on_hold'
              AND LOWER(u.role) = 'employee'${regionClause}`
        : `SELECT COUNT(*)::text AS on_hold
             FROM temp_users u
            WHERE employment_status = 'on_hold'
              AND LOWER(u.role) = 'employee'${regionClause}
              AND ${tempUserCountryInList(1)}`,
      sqlParams
    ),
  ]);

  const actualByCountry = new Map<string, TempCountryActuals>();
  for (const row of countryRows) {
    const country = row.country.trim() || "Unassigned";
    actualByCountry.set(country, {
      employees: Number(row.employees),
      x: Number(row.x),
      facebookPersonal: Number(row.facebook_personal),
      facebookUmbrella: Number(row.facebook_umbrella),
      instagram: Number(row.instagram),
      tiktok: Number(row.tiktok),
    });
  }

  const holdersByCountry = new Map<string, TempHolderActuals[]>();
  for (const row of holderRows) {
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

  return {
    actualByCountry,
    holdersByCountry,
    onHoldCount: Number(onHoldRow[0]?.on_hold ?? 0),
  };
}
