import { queryOne } from "@/lib/db";
import type { EmployeeReporting } from "@/types/admin";

/**
 * Direct FKs first, then country: many Africa/Europe handlers have no
 * team_lead_id/manager_id and only sit under a manager via owned countries.
 */
export const TEMP_TEAM_LEAD_NAME_SQL = `COALESCE(
  tl.full_name,
  (
    SELECT ctl.full_name
      FROM temp_users ctl
     WHERE ctl.role = 'team_lead'
       AND ctl.is_active = TRUE
       AND NULLIF(TRIM(u.country), '') IS NOT NULL
       AND LOWER(TRIM(ctl.country)) = LOWER(TRIM(u.country))
     ORDER BY ctl.full_name ASC, ctl.id ASC
     LIMIT 1
  ),
  (
    SELECT ctl.full_name
      FROM temp_users ctl
      INNER JOIN temp_manager_countries mc ON mc.user_id = ctl.manager_id
     WHERE ctl.role = 'team_lead'
       AND ctl.is_active = TRUE
       AND NULLIF(TRIM(u.country), '') IS NOT NULL
       AND LOWER(TRIM(mc.country)) = LOWER(TRIM(u.country))
     ORDER BY ctl.full_name ASC, ctl.id ASC
     LIMIT 1
  )
)`;

export const TEMP_MANAGER_NAME_SQL = `COALESCE(
  mgr.full_name,
  tlm.full_name,
  (
    SELECT m.full_name
      FROM temp_users m
      INNER JOIN temp_manager_countries mc ON mc.user_id = m.id
     WHERE m.role = 'manager'
       AND m.is_active = TRUE
       AND NULLIF(TRIM(u.country), '') IS NOT NULL
       AND LOWER(TRIM(mc.country)) = LOWER(TRIM(u.country))
     ORDER BY m.full_name ASC, m.id ASC
     LIMIT 1
  ),
  (
    SELECT m.full_name
      FROM temp_users m
     WHERE m.role = 'manager'
       AND m.is_active = TRUE
       AND NULLIF(TRIM(u.country), '') IS NOT NULL
       AND LOWER(TRIM(m.country)) = LOWER(TRIM(u.country))
     ORDER BY m.full_name ASC, m.id ASC
     LIMIT 1
  )
)`;

async function fetchTempReporting(id: number): Promise<EmployeeReporting | null> {
  const row = await queryOne<{
    team_lead_name: string | null;
    manager_name: string | null;
  }>(
    `SELECT ${TEMP_TEAM_LEAD_NAME_SQL} AS team_lead_name,
            ${TEMP_MANAGER_NAME_SQL} AS manager_name
       FROM temp_users u
       LEFT JOIN temp_users tl ON tl.id = u.team_lead_id
       LEFT JOIN temp_users mgr ON mgr.id = u.manager_id
       LEFT JOIN temp_users tlm ON tlm.id = tl.manager_id
      WHERE u.id = $1`,
    [id]
  );
  if (!row) return null;
  return {
    teamLeadName: row.team_lead_name,
    managerName: row.manager_name,
  };
}

/** Main (ALPHAA) holders are temp_users too, so both sources resolve the same way. */
export async function fetchEmployeeReporting(
  _source: "temp" | "alphaa",
  id: number
): Promise<EmployeeReporting | null> {
  return fetchTempReporting(id);
}
