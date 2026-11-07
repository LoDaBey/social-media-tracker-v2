"use client";

import type { Role } from "@/types/db";
import type {
  AdminManagerOption,
  AdminSupervisorOption,
  AdminTeamLeadOption,
  SupervisorAssignFieldProps,
} from "@/types/admin";
import { supervisorLabelForUserRole, supervisorRoleFor } from "@/lib/role-hierarchy";
import { managersForProjectAndCountry } from "@/lib/admin-view";

function optionsForRole(
  userRole: Role,
  teamLeads: AdminTeamLeadOption[],
  managers: AdminManagerOption[],
  ops: AdminSupervisorOption[],
  admins: AdminSupervisorOption[],
  scope: { region?: string; country?: string; selectedId: number | null }
): { id: number; label: string }[] {
  const supervisorRole = supervisorRoleFor(userRole);
  if (!supervisorRole) return [];

  switch (supervisorRole) {
    case "team_lead":
      return teamLeads.map((tl) => ({ id: tl.id, label: tl.full_name }));
    case "manager": {
      // Team Leader → only Country Managers of the same project (and country).
      const fitting = managersForProjectAndCountry(managers, scope.region, scope.country);
      const selected = managers.find((m) => m.id === scope.selectedId);
      const list =
        selected && !fitting.includes(selected) ? [selected, ...fitting] : fitting;
      return list.map((m) => ({
        id: m.id,
        label: m.countries.length
          ? `${m.full_name} (${m.countries.join(", ")})`
          : m.full_name,
      }));
    }
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
  region,
  country,
  disabled = false,
  error,
  errorId,
  fieldClass,
  invalidFieldClass,
}: SupervisorAssignFieldProps) {
  const baseLabel = supervisorLabelForUserRole(userRole);
  if (!baseLabel) return null;

  const label =
    userRole === "manager" ? `${baseLabel} (optional)` : baseLabel;
  const options = optionsForRole(userRole, teamLeads, managers, ops, admins, {
    region,
    country,
    selectedId: value,
  });
  const emptyOptionLabel =
    userRole === "manager" ? `No ${baseLabel}` : `Select ${baseLabel}`;

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
        <option value="">{emptyOptionLabel}</option>
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
