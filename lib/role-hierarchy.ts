import type { Role } from "@/types/db";

export type ReportingFields = {
  team_lead_id: number | null;
  manager_id: number | null;
  op_id: number | null;
};

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  team_lead: "Team Leader Regional",
  manager: "Manager Regional",
  op: "OP",
  admin: "Admin",
};

/** Direct supervisor role for each assignable role (admin has none). */
export function supervisorRoleFor(userRole: Role): Role | null {
  switch (userRole) {
    case "employee":
      return "team_lead";
    case "team_lead":
      return "manager";
    case "manager":
      return "op";
    case "op":
      return "admin";
    default:
      return null;
  }
}

export function supervisorLabelForUserRole(userRole: Role): string | null {
  const supervisorRole = supervisorRoleFor(userRole);
  return supervisorRole ? ROLE_LABELS[supervisorRole] : null;
}

export function supervisorRequired(userRole: Role): boolean {
  if (userRole === "manager" || userRole === "employee") {
    return false;
  }
  return supervisorRoleFor(userRole) !== null;
}

export function emptyReportingFields(): ReportingFields {
  return { team_lead_id: null, manager_id: null, op_id: null };
}

/** Map a single supervisor picker value into the three reporting columns. */
export function reportingFieldsFromSupervisor(
  userRole: Role,
  supervisorId: number | null
): ReportingFields {
  const empty = emptyReportingFields();
  if (!supervisorId) return empty;

  switch (userRole) {
    case "employee":
      return { ...empty, team_lead_id: supervisorId };
    case "team_lead":
      return { ...empty, manager_id: supervisorId };
    case "manager":
      return { ...empty, op_id: supervisorId };
    case "op":
      return { ...empty, manager_id: supervisorId };
    default:
      return empty;
  }
}

export function normalizeReportingForRole(
  userRole: Role,
  fields: ReportingFields
): ReportingFields {
  if (userRole === "admin") return emptyReportingFields();

  switch (userRole) {
    case "employee":
      return {
        team_lead_id: fields.team_lead_id,
        manager_id: fields.manager_id,
        op_id: null,
      };
    case "team_lead":
      return { ...emptyReportingFields(), manager_id: fields.manager_id };
    case "manager":
      return { ...emptyReportingFields(), op_id: fields.op_id };
    case "op":
      return { ...emptyReportingFields(), manager_id: fields.manager_id };
    default:
      return emptyReportingFields();
  }
}

export function supervisorIdFromReporting(
  userRole: Role,
  fields: ReportingFields
): number | null {
  switch (userRole) {
    case "employee":
      return fields.team_lead_id;
    case "team_lead":
      return fields.manager_id;
    case "manager":
      return fields.op_id;
    case "op":
      return fields.manager_id;
    default:
      return null;
  }
}

export function reportingValidationMessage(
  userRole: Role,
  fields: ReportingFields
): string | null {
  if (userRole === "employee") {
    if (!fields.manager_id) {
      return `Select a ${ROLE_LABELS.manager}.`;
    }
    return null;
  }

  if (!supervisorRequired(userRole)) return null;

  const supervisorRole = supervisorRoleFor(userRole);
  const supervisorId = supervisorIdFromReporting(userRole, fields);
  if (!supervisorId) {
    return `Select a ${supervisorRole ? ROLE_LABELS[supervisorRole] : "supervisor"}.`;
  }
  return null;
}
