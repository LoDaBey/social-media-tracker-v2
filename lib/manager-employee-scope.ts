/**
 * Which `temp_users` employees a Manager Regional can see and edit.
 *
 * Matches planned coverage (employees in the manager's countries) while respecting
 * the reporting chain when it is set:
 * Employee → Team Leader Regional → Manager Regional.
 *
 * Also keeps legacy direct `manager_id` and transitional rows (imports before
 * team leads / managers are wired).
 */
export function managerEmployeeScopeSql(
  employeeAlias: string,
  managerIdParam: string,
  countriesParam: string
): string {
  const e = employeeAlias;
  return `${e}.role = 'employee'
    AND ${e}.is_active = TRUE
    AND ${e}.country = ANY(${countriesParam}::text[])
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
