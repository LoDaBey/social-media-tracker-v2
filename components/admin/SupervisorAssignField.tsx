"use client";

import type { Role } from "@/types/db";
import type {
  AdminManagerOption,
  AdminSupervisorOption,
  AdminTeamLeadOption,
  SupervisorAssignFieldProps,
} from "@/types/admin";
import { supervisorLabelForUserRole, supervisorRoleFor } from "@/lib/role-hierarchy";

function optionsForRole(
  userRole: Role,
  teamLeads: AdminTeamLeadOption[],
  managers: AdminManagerOption[],
  ops: AdminSupervisorOption[],
  admins: AdminSupervisorOption[]
): { id: number; label: string }[] {
  const supervisorRole = supervisorRoleFor(userRole);
  if (!supervisorRole) return [];

  switch (supervisorRole) {
    case "team_lead":
      return teamLeads.map((tl) => ({ id: tl.id, label: tl.full_name }));
    case "manager":
      return managers.map((m) => ({
        id: m.id,
        label: m.countries.length
          ? `${m.full_name} (${m.countries.join(", ")})`
          : m.full_name,
      }));
    case "op":
      return ops.map((op) => ({ id: op.id, label: op.full_name }));
    case "admin":
      return admins.map((admin) => ({ id: admin.id, label: admin.full_name }));
    default:
      return [];
  }
}

export function SupervisorAssignField({
  userRole,
  value,
  onChange,
  teamLeads,
  managers,
  ops,
  admins,
  disabled = false,
  error,
  errorId,
  fieldClass,
  invalidFieldClass,
}: SupervisorAssignFieldProps) {
  const label = supervisorLabelForUserRole(userRole);
  if (!label) return null;

  const options = optionsForRole(userRole, teamLeads, managers, ops, admins);

  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
      {label}
      <select
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        aria-label={`Assign ${label}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`cursor-pointer ${fieldClass} ${error ? invalidFieldClass : ""} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className="text-[12px] font-medium text-[var(--color-coral)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
