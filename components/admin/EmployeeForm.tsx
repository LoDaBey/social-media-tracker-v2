"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateEmployeeProfile } from "@/actions/admin";
import { LEVEL_LABELS } from "@/lib/level-labels";
import { EMPLOYMENT_STATUSES, EMPLOYMENT_STATUS_LABELS } from "@/lib/employment-status";
import { setupRegionForCountry } from "@/lib/setup-options";
import {
  ROLE_LABELS,
  reportingFieldsFromSupervisor,
  reportingValidationMessage,
  supervisorIdFromReporting,
} from "@/lib/role-hierarchy";
import type { Role } from "@/types/db";
import type { EmployeeFormProps, UpdateEmployeeProfilePayload } from "@/types/admin";
import { AdminCountrySelect } from "@/components/admin/AdminCountrySelect";
import { EmployeeReportingFields } from "@/components/admin/EmployeeReportingFields";
import { ManagerCountriesField } from "@/components/admin/ManagerCountriesField";
import { SupervisorAssignField } from "@/components/admin/SupervisorAssignField";

function normalizeDate(v: string | null): string {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

function managerCountriesForEmployee(
  managerId: number | null,
  teamLeadId: number | null,
  teamLeads: EmployeeFormProps["teamLeads"],
  managers: EmployeeFormProps["managers"]
): string[] {
  if (managerId) {
    return managers.find((manager) => manager.id === managerId)?.countries ?? [];
  }
  if (!teamLeadId) return [];
  const teamLead = teamLeads.find((tl) => tl.id === teamLeadId);
  if (!teamLead?.manager_id) return [];
  return managers.find((m) => m.id === teamLead.manager_id)?.countries ?? [];
}

export function EmployeeForm({
  initial,
  teamLeads,
  managers,
  ops,
  admins,
  embedded = false,
  onSaved,
  employmentStatusLocked = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const base = useMemo(
    () => ({
      full_name: initial.full_name,
      email: initial.email,
      phone: initial.phone ?? "",
      role: initial.role,
      is_active: initial.is_active,
      employee_code: initial.employee_code ?? "",
      employment_status: initial.employment_status,
      hire_date: normalizeDate(initial.hire_date),
      team_lead_id: initial.team_lead_id,
      manager_id: initial.manager_id,
      op_id: initial.op_id,
      manager_countries: initial.manager_countries,
      base_salary: String(initial.base_salary),
      current_level: initial.current_level,
      pay_cycle_start_date: normalizeDate(initial.pay_cycle_start_date),
      country: initial.country,
    }),
    [initial]
  );

  const [form, setForm] = useState(base);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(base), [form, base]);

  const isManagerRole = form.role === "manager";
  const isGlobalRole = form.role === "admin" || form.role === "op";
  const showCountryFields = !isManagerRole && !isGlobalRole;

  const supervisorId = supervisorIdFromReporting(form.role, {
    team_lead_id: form.team_lead_id,
    manager_id: form.manager_id,
    op_id: form.op_id,
  });

  const employeeManagerId =
    form.manager_id ??
    teamLeads.find((teamLead) => teamLead.id === form.team_lead_id)?.manager_id ??
    null;

  const regionalManagerCountries = useMemo(() => {
    if (form.role !== "employee") return [];
    return managerCountriesForEmployee(
      employeeManagerId,
      form.team_lead_id,
      teamLeads,
      managers
    );
  }, [form.role, employeeManagerId, form.team_lead_id, teamLeads, managers]);

  const assignedRegion = useMemo(() => {
    if (isManagerRole && form.manager_countries.length > 0) {
      return setupRegionForCountry(form.manager_countries[0]);
    }
    if (form.country) return setupRegionForCountry(form.country);
    return "";
  }, [form.country, form.manager_countries, isManagerRole]);

  const countryMismatch =
    form.role === "employee" &&
    Boolean(form.country) &&
    regionalManagerCountries.length > 0 &&
    !regionalManagerCountries.includes(form.country);

  function setSupervisor(nextSupervisorId: number | null) {
    const reporting = reportingFieldsFromSupervisor(form.role, nextSupervisorId);
    setForm((f) => ({
      ...f,
      team_lead_id: reporting.team_lead_id,
      manager_id: reporting.manager_id,
      op_id: reporting.op_id,
    }));
  }

  function toggleManagerCountry(option: string) {
    setForm((f) => ({
      ...f,
      manager_countries: f.manager_countries.includes(option)
        ? f.manager_countries.filter((c) => c !== option)
        : [...f.manager_countries, option],
    }));
  }

  function cancel() {
    setForm(base);
    setError(null);
  }

  function submit() {
    setError(null);
    if (form.role === "employee") {
      const reportingMessage = reportingValidationMessage(form.role, {
        team_lead_id: form.team_lead_id,
        manager_id: employeeManagerId,
        op_id: null,
      });
      if (reportingMessage) {
        toast.error(reportingMessage);
        return;
      }
    }
    const payload: UpdateEmployeeProfilePayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() === "" ? null : form.phone.trim(),
      role: form.role,
      is_active: form.is_active,
      employee_code: form.employee_code.trim() === "" ? null : form.employee_code.trim(),
      employment_status: form.employment_status,
      hire_date: form.hire_date,
      team_lead_id: form.team_lead_id,
      manager_id:
        form.role === "employee" ? employeeManagerId : form.manager_id,
      op_id: form.op_id,
      manager_countries:
        form.role === "manager" ? form.manager_countries : undefined,
      base_salary: Number(form.base_salary),
      current_level: form.current_level,
      pay_cycle_start_date: form.pay_cycle_start_date === "" ? null : form.pay_cycle_start_date,
      country:
        form.role === "manager"
          ? form.manager_countries[0] ?? form.country
          : form.country.trim(),
    };

    startTransition(async () => {
      try {
        await updateEmployeeProfile(initial.id, payload);
        toast.success("Profile saved.");
        router.refresh();
        onSaved?.();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const fieldClass =
    "rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-2 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}
      {countryMismatch ? (
        <p
          role="status"
          className="rounded-lg bg-[var(--color-gold)]/15 px-4 py-2 text-[14px] text-[var(--color-ink)]"
        >
          Warning: {form.country} is not in the regional manager&apos;s countries (
          {regionalManagerCountries.join(", ") || "none"}). The employee may stay
          hidden from that manager until countries overlap.
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Full name
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Employee code
          <input
            value={form.employee_code}
            aria-label="Employee code"
            onChange={(e) =>
              setForm((f) => ({ ...f, employee_code: e.target.value }))
            }
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Status
          <select
            value={form.employment_status}
            disabled={employmentStatusLocked}
            aria-label="Employee status"
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                employment_status: e.target.value as typeof f.employment_status,
              }))
            }
            className={`cursor-pointer ${fieldClass} disabled:cursor-not-allowed disabled:bg-[var(--color-cream-tint)] disabled:text-[var(--color-muted)]`}
          >
            {EMPLOYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EMPLOYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={fieldClass}
          />
        </label>

        {showCountryFields ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Country
            <AdminCountrySelect
              value={form.country}
              onChange={(country) => setForm((f) => ({ ...f, country }))}
              ariaLabel="Employee country"
            />
          </label>
        ) : null}

        {showCountryFields ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Region
            <input
              value={assignedRegion}
              disabled
              readOnly
              placeholder="Select a country"
              aria-label={
                assignedRegion
                  ? `Region is ${assignedRegion}`
                  : "Region is set automatically from the selected country"
              }
              className={`${fieldClass} cursor-not-allowed bg-[var(--color-cream-tint)] text-[var(--color-muted)]`}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={form.role}
            onChange={(e) => {
              const nextRole = e.target.value as Role;
              setForm((f) => ({
                ...f,
                role: nextRole,
                team_lead_id: null,
                manager_id: null,
                op_id: null,
              }));
            }}
            aria-label="Select role"
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="employee">{ROLE_LABELS.employee}</option>
            <option value="team_lead">{ROLE_LABELS.team_lead}</option>
            <option value="manager">{ROLE_LABELS.manager}</option>
            <option value="op">{ROLE_LABELS.op}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </label>

        {form.role === "employee" ? (
          <EmployeeReportingFields
            value={{
              managerId: employeeManagerId,
              teamLeadId: form.team_lead_id,
            }}
            onChange={(next) =>
              setForm((f) => ({
                ...f,
                manager_id: next.managerId,
                team_lead_id: next.teamLeadId,
              }))
            }
            teamLeads={teamLeads}
            managers={managers}
            country={form.country}
            fieldClass={fieldClass}
            invalidFieldClass="border-[var(--color-coral)]"
          />
        ) : (
          <SupervisorAssignField
            userRole={form.role}
            value={supervisorId}
            onChange={setSupervisor}
            teamLeads={teamLeads}
            managers={managers}
            ops={ops}
            admins={admins}
            fieldClass={fieldClass}
            invalidFieldClass="border-[var(--color-coral)]"
          />
        )}

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Hire date
          <input
            type="date"
            value={form.hire_date}
            onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
            className={fieldClass}
          />
        </label>

        {isManagerRole ? (
          <ManagerCountriesField
            selected={form.manager_countries}
            onToggle={toggleManagerCountry}
          />
        ) : null}

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Base salary
          <span className="flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2">
            <span className="text-[13px] font-semibold text-[var(--color-muted)]">EGP</span>
            <input
              type="number"
              min={0}
              step={100}
              value={form.base_salary}
              onChange={(e) => setForm((f) => ({ ...f, base_salary: e.target.value }))}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[var(--color-ink)] outline-none"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Current level
          <select
            value={form.current_level}
            onChange={(e) =>
              setForm((f) => ({ ...f, current_level: Number(e.target.value) }))
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            {[1, 2, 3, 4, 5, 6].map((lv) => (
              <option key={lv} value={lv}>
                {lv} — {LEVEL_LABELS[lv] ?? lv}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Pay cycle start date
          <input
            type="date"
            value={form.pay_cycle_start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, pay_cycle_start_date: e.target.value }))
            }
            className={fieldClass}
          />
          <span className="text-[12px] font-normal text-[var(--color-muted)]">
            Changing this will reset the cycle for this employee.
          </span>
        </label>
      </div>

      <div
        className={
          embedded
            ? "sticky bottom-0 z-20 flex flex-wrap gap-3 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] py-4"
            : "sticky bottom-0 z-20 -mx-4 flex flex-wrap gap-3 border-t border-[var(--color-hairline)] bg-[var(--color-cream)] px-4 py-4 sm:-mx-8"
        }
      >
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!dirty || pending}
          onClick={submit}
          aria-label="Save profile changes"
          className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-5 py-2.5 text-[14px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save changes"}
        </motion.button>
        <button
          type="button"
          disabled={!dirty}
          onClick={cancel}
          aria-label="Discard profile changes"
          className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
