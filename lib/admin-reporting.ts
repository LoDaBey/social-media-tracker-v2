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

export async function assertValidReporting(
  client: PoolClient,
  userRole: Role,
  fields: ReportingFields
): Promise<{ normalized: ReportingFields; error: string | null }> {
  const normalized = normalizeReportingForRole(userRole, fields);
  const message = reportingValidationMessage(userRole, normalized);
  if (message) return { normalized, error: message };

  const supervisorRole = supervisorRoleFor(userRole);
  const supervisorId = supervisorIdFromReporting(userRole, normalized);
  if (!supervisorRole || !supervisorId) {
    return { normalized, error: null };
  }

  const row = await client.query<{ id: number }>(
    `SELECT id FROM temp_users WHERE id = $1 AND role = $2 AND is_active = TRUE`,
    [supervisorId, supervisorRole]
  );
  if (!row.rows[0]) {
    return {
      normalized,
      error: `Selected ${ROLE_LABELS[supervisorRole]} is invalid.`,
    };
  }

  return { normalized, error: null };
}
