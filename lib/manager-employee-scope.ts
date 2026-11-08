/**
 * Which `temp_users` employees a Country Manager can see and edit.
 *
 * Matches planned coverage (employees in the manager's countries) while respecting
 * the reporting chain when it is set:
 * Employee → Team Leader Regional → Country Manager.
 *
 * Also keeps legacy direct `manager_id` and transitional rows (imports before
 * team leads / managers are wired). Always limited to the manager's own project.
 */
import { sameProjectSql } from "@/lib/project-region-sql";

export function managerEmployeeScopeSql(
  employeeAlias: string,
  managerIdParam: string,
  countriesParam: string
): string {
  const e = employeeAlias;
  return `${e}.role = 'employee'
    AND ${e}.is_active = TRUE
    AND ${e}.country = ANY(${countriesParam}::text[])
    AND ${sameProjectSql(
      `${e}.region`,
      `(SELECT scope_mgr.region FROM temp_users scope_mgr WHERE scope_mgr.id = ${managerIdParam})`
    )}
    AND (
      ${e}.manager_id = ${managerIdParam}
      OR EXISTS (
        SELECT 1
          FROM temp_users tl
         WHERE tl.id = ${e}.team_lead_id
           AND tl.role = 'team_lead'
           AND tl.manager_id = ${managerIdParam}
      )
      OR EXISTS (
        SELECT 1
          FROM temp_users tl
         WHERE tl.id = ${e}.team_lead_id
           AND tl.role = 'team_lead'
           AND tl.manager_id IS NULL
      )
      OR (
        ${e}.manager_id IS NULL
        AND ${e}.team_lead_id IS NULL
      )
    )`;
}
