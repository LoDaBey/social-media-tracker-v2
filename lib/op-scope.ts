import { query, queryOne } from "@/lib/db";
import { regionFromStrategyProjectSlug } from "@/lib/employee-create-projects";
import type { OpAccessScope } from "@/types/admin";

export async function fetchOpAccessScope(
  opUserId: number
): Promise<OpAccessScope | null> {
  if (!Number.isFinite(opUserId)) return null;

  const user = await queryOne<{ op_project_slug: string | null; role: string }>(
    `SELECT op_project_slug, role FROM temp_users WHERE id = $1`,
    [opUserId]
  );
  if (!user || user.role !== "op") return null;

  const projectSlug = (user.op_project_slug ?? "").trim();
  if (!projectSlug) {
    return { projectSlug: "", region: "Africa", countries: [] };
  }

  const countries = await query<{ country: string }>(
    `SELECT country
       FROM temp_op_countries
      WHERE user_id = $1
      ORDER BY country ASC`,
    [opUserId]
  );

  return {
    projectSlug,
    region: regionFromStrategyProjectSlug(projectSlug),
    countries: countries.map((row) => row.country.trim()).filter(Boolean),
  };
}

/** SQL predicate: employee rows visible to an OP (project region + countries). */
export function opEmployeeScopeSql(
  employeeAlias: string,
  countriesParam: string,
  regionParam: string
): string {
  const e = employeeAlias;
  return `${e}.role = 'employee'
    AND ${e}.is_active = TRUE
    AND ${e}.country = ANY(${countriesParam}::text[])
    AND LOWER(TRIM(${e}.region)) = LOWER(TRIM(${regionParam}))`;
}

export function opScopeAllowsCountry(
  scope: OpAccessScope | null | undefined,
  country: string
): boolean {
  if (!scope) return true;
  if (scope.countries.length === 0) return false;
  return scope.countries.includes(country.trim());
}

export function opScopeAllowsProject(
  scope: OpAccessScope | null | undefined,
  projectSlug: string
): boolean {
  if (!scope) return true;
  return scope.projectSlug === projectSlug.trim();
}
