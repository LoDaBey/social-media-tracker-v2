"use client";

import { useMemo } from "react";
import { ROLE_LABELS } from "@/lib/role-hierarchy";
import type { EmployeeReportingFieldsProps } from "@/types/admin";

function managerLabel(
  fullName: string,
  countries: string[]
): string {
  return countries.length ? `${fullName} (${countries.join(", ")})` : fullName;
}

export function EmployeeReportingFields({
  value,
  onChange,
  teamLeads,
  managers,
  country,
  disabled = false,
  managerError,
  managerErrorId,
  fieldClass,
  invalidFieldClass,
}: EmployeeReportingFieldsProps) {
  const managerOptions = useMemo(() => {
    const matching = country
      ? managers.filter(
          (manager) =>
            manager.countries.length === 0 ||
            manager.countries.includes(country)
        )
      : managers;
    const options = matching.length > 0 ? matching : managers;
    if (value.managerId && !options.some((manager) => manager.id === value.managerId)) {
      const selected = managers.find((manager) => manager.id === value.managerId);
      return selected ? [selected, ...options] : options;
    }
    return options;
  }, [country, managers, value.managerId]);

  const teamLeadOptions = useMemo(() => {
    const matching = value.managerId
      ? teamLeads.filter(
          (teamLead) =>
            teamLead.manager_id == null || teamLead.manager_id === value.managerId
        )
      : teamLeads;
    if (
      value.teamLeadId &&
      !matching.some((teamLead) => teamLead.id === value.teamLeadId)
    ) {
      const selected = teamLeads.find((teamLead) => teamLead.id === value.teamLeadId);
      return selected ? [selected, ...matching] : matching;
    }
    return matching;
  }, [teamLeads, value.managerId, value.teamLeadId]);

  function handleManagerChange(nextManagerId: number | null) {
    const selectedTeamLead = teamLeads.find(
      (teamLead) => teamLead.id === value.teamLeadId
    );
    const teamLeadConflicts =
      Boolean(selectedTeamLead?.manager_id) &&
      nextManagerId != null &&
      selectedTeamLead?.manager_id !== nextManagerId;

    onChange({
      managerId: nextManagerId,
      teamLeadId: teamLeadConflicts ? null : value.teamLeadId,
    });
  }

  function handleTeamLeadChange(nextTeamLeadId: number | null) {
    const selectedTeamLead = teamLeads.find(
      (teamLead) => teamLead.id === nextTeamLeadId
    );
    const nextManagerId =
      selectedTeamLead?.manager_id && selectedTeamLead.manager_id !== value.managerId
        ? selectedTeamLead.manager_id
        : value.managerId;

    onChange({
      managerId: nextManagerId,
      teamLeadId: nextTeamLeadId,
    });
  }

  return (
    <>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
        {ROLE_LABELS.manager}
        <select
          disabled={disabled}
          value={value.managerId ?? ""}
          onChange={(e) =>
            handleManagerChange(e.target.value ? Number(e.target.value) : null)
          }
          aria-label={`Assign ${ROLE_LABELS.manager}`}
          aria-invalid={Boolean(managerError)}
          aria-describedby={managerError ? managerErrorId : undefined}
          className={`cursor-pointer rounded outline-none ${fieldClass} ${
            managerError ? invalidFieldClass : ""
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <option value="">{`Select ${ROLE_LABELS.manager}`}</option>
          {managerOptions.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {managerLabel(manager.full_name, manager.countries)}
            </option>
          ))}
        </select>
        {managerError ? (
          <span
            id={managerErrorId}
            className="text-[12px] font-medium text-[var(--color-coral)]"
          >
            {managerError}
          </span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
        {ROLE_LABELS.team_lead} (optional)
        <select
          disabled={disabled}
          value={value.teamLeadId ?? ""}
          onChange={(e) =>
            handleTeamLeadChange(e.target.value ? Number(e.target.value) : null)
          }
          aria-label={`Assign ${ROLE_LABELS.team_lead} (optional)`}
          className={`cursor-pointer rounded outline-none ${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <option value="">{`No ${ROLE_LABELS.team_lead}`}</option>
          {teamLeadOptions.map((teamLead) => (
            <option key={teamLead.id} value={teamLead.id}>
              {teamLead.full_name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
