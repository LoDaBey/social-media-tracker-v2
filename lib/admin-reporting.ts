import type { PoolClient } from "pg";
import {
  ROLE_LABELS,
  normalizeReportingForRole,
  reportingValidationMessage,
  supervisorIdFromReporting,
  supervisorRoleFor,
  type ReportingFields,
} from "@/lib/role-hierarchy";
import type { Role } from "@/types/db";
import { sameProject } from "@/lib/project-region-sql";

async function projectOf(client: PoolClient, userId: number): Promise<string | null> {
  const row = await client.query<{ region: string | null }>(
    `SELECT region FROM temp_users WHERE id = $1`,
    [userId]
  );
  return row.rows[0]?.region ?? null;
}

async function assertActiveUserHasRole(
  client: PoolClient,
  userId: number,
  role: Role | Role[]
): Promise<boolean> {
  const roles = Array.isArray(role) ? role : [role];
  const row = await client.query<{ id: number }>(
    `SELECT id
       FROM temp_users
      WHERE id = $1
        AND role = ANY($2::text[])
        AND is_active = TRUE`,
    [userId, roles]
  );
  return Boolean(row.rows[0]);
}

async function withEmployeeManagerFromTeamLead(
  client: PoolClient,
  fields: ReportingFields
): Promise<ReportingFields> {
  if (fields.manager_id || !fields.team_lead_id) return fields;

  const row = await client.query<{ manager_id: number | null }>(
    `SELECT manager_id FROM temp_users WHERE id = $1 AND role = 'team_lead'`,
    [fields.team_lead_id]
  );
  return { ...fields, manager_id: row.rows[0]?.manager_id ?? null };
}

export async function assertValidReporting(
  client: PoolClient,
  userRole: Role,
  fields: ReportingFields,
  /** The person's project; their Country Manager / Team Leader must be in it. */
  projectRegion?: string | null
): Promise<{ normalized: ReportingFields; error: string | null }> {
  let normalized = normalizeReportingForRole(userRole, fields);
  if (userRole === "employee") {
    normalized = await withEmployeeManagerFromTeamLead(client, normalized);
  }

  const message = reportingValidationMessage(userRole, normalized);
  if (message) return { normalized, error: message };

  if (userRole === "employee") {
    if (normalized.manager_id) {
      const managerOk = await assertActiveUserHasRole(
        client,
        normalized.manager_id,
        "manager"
      );
      if (!managerOk) {
        return {
          normalized,
          error: `Selected ${ROLE_LABELS.manager} is invalid.`,
        };
      }
      if (
        projectRegion &&
        !sameProject(await projectOf(client, normalized.manager_id), projectRegion)
      ) {
        return {
          normalized,
          error: `Selected ${ROLE_LABELS.manager} is in another project. Pick one from this project.`,
        };
      }
    }

    if (normalized.team_lead_id) {
      const teamLead = await client.query<{
        id: number;
        manager_id: number | null;
      }>(
        `SELECT id, manager_id
           FROM temp_users
          WHERE id = $1 AND role = 'team_lead' AND is_active = TRUE`,
        [normalized.team_lead_id]
      );
      if (!teamLead.rows[0]) {
        return {
          normalized,
          error: `Selected ${ROLE_LABELS.team_lead} is invalid.`,
        };
      }
      if (
        projectRegion &&
        !sameProject(await projectOf(client, normalized.team_lead_id), projectRegion)
      ) {
        return {
          normalized,
          error: `Selected ${ROLE_LABELS.team_lead} is in another project. Pick one from this project.`,
        };
      }
      const teamLeadManagerId = teamLead.rows[0].manager_id;
      if (
        teamLeadManagerId &&
        normalized.manager_id &&
        teamLeadManagerId !== normalized.manager_id
      ) {
        return {
          normalized,
          error: `Selected ${ROLE_LABELS.team_lead} does not report to this ${ROLE_LABELS.manager}.`,
        };
      }
    }

    return { normalized, error: null };
  }

  const supervisorRole = supervisorRoleFor(userRole);
  const supervisorId = supervisorIdFromReporting(userRole, normalized);
  if (!supervisorRole || !supervisorId) {
    return { normalized, error: null };
  }

  const allowedSupervisorRoles: Role[] =
    supervisorRole === "admin" ? ["admin", "hoo"] : [supervisorRole];
  const supervisorOk = await assertActiveUserHasRole(
    client,
    supervisorId,
    allowedSupervisorRoles
  );
  if (!supervisorOk) {
    return {
      normalized,
      error: `Selected ${ROLE_LABELS[supervisorRole]} is invalid.`,
    };
  }
  // Team Leader → their Country Manager must be in the same project.
  if (
    userRole === "team_lead" &&
    projectRegion &&
    !sameProject(await projectOf(client, supervisorId), projectRegion)
  ) {
    return {
      normalized,
      error: `Selected ${ROLE_LABELS[supervisorRole]} is in another project. Pick one from this project.`,
    };
  }

  return { normalized, error: null };
}
