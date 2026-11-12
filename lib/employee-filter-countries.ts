import { query } from "@/lib/db";
import { normalizeProjectRegion } from "@/lib/admin-view";
import type { EmployeeFilterCountry } from "@/types/admin";

/**
 * Project + country pairs that actually have accounts, for the Employees filters.
 * Countries with nobody holding an account are left out of the dropdown.
 */
export async function fetchEmployeeFilterCountries(): Promise<EmployeeFilterCountry[]> {
  const rows = await query<{ region: string | null; country: string }>(
    `SELECT DISTINCT u.region, u.country
       FROM temp_users u
      WHERE COALESCE(TRIM(u.country), '') <> ''
        AND EXISTS (
          SELECT 1 FROM temp_social_media_accounts a WHERE a.user_id = u.id
        )`
  );
  const seen = new Set<string>();
  const list: EmployeeFilterCountry[] = [];
  for (const row of rows) {
    const region = normalizeProjectRegion(row.region);
    if (!region) continue;
    const key = `${region}|${row.country}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ region, country: row.country });
  }
  return list;
}
