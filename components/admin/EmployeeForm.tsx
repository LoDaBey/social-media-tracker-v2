"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateEmployeeProfile } from "@/actions/admin";
import { LEVEL_LABELS } from "@/lib/level-labels";
import { EMPLOYMENT_STATUSES, EMPLOYMENT_STATUS_LABELS } from "@/lib/employment-status";
import { SETUP_COUNTRIES, SETUP_REGION } from "@/lib/setup-options";
import type { Role } from "@/types/db";
import type { EmployeeFormProps, UpdateEmployeeProfilePayload } from "@/types/admin";
import { ManagerCountriesField } from "@/components/admin/ManagerCountriesField";

function normalizeDate(v: string | null): string {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

export function EmployeeForm({
  initial,
  teamLeads,
  managers,
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

  const teamLeadDisabled = form.role === "team_lead" || form.role === "admin";
  const managerDisabled = form.role !== "employee";

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === form.manager_id) ?? null,
    [managers, form.manager_id]
  );

  const countryMismatch =
    form.role === "employee" &&
    Boolean(form.country) &&
    Boolean(selectedManager) &&
    !selectedManager!.countries.includes(form.country);

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
    const payload: UpdateEmployeeProfilePayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() === "" ? null : form.phone.trim(),
      role: form.role,
      is_active: form.is_active,
      employee_code: form.employee_code.trim() === "" ? null : form.employee_code.trim(),
      employment_status: form.employment_status,
      hire_date: form.hire_date,
      team_lead_id: teamLeadDisabled ? null : form.team_lead_id,
      manager_id: managerDisabled ? null : form.manager_id,
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
          Warning: {form.country} is not in this manager&apos;s countries (
          {selectedManager!.countries.join(", ") || "none"}). The employee will
          stay hidden from that manager until countries overlap.
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

        {form.role === "manager" ? null : (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Country
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              aria-label="Employee country"
              className={`cursor-pointer ${fieldClass}`}
            >
              <option value="">Select a country</option>
              {SETUP_COUNTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Region
          <input
            value={SETUP_REGION}
            disabled
            readOnly
            aria-label="Region is Africa for every country"
            className={`${fieldClass} cursor-not-allowed bg-[var(--color-cream-tint)] text-[var(--color-muted)]`}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value as Role,
                team_lead_id:
                  e.target.value === "team_lead" || e.target.value === "admin"
                    ? null
                    : f.team_lead_id,
                manager_id: e.target.value === "employee" ? f.manager_id : null,
              }))
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="team_lead">Team lead</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Hire date
          <input
            type="date"
            value={form.hire_date}
            onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Team lead
          <select
            disabled={teamLeadDisabled}
            value={form.team_lead_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                team_lead_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            aria-label="Assign team lead"
            className={`cursor-pointer ${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">None</option>
            {teamLeads.map((tl) => (
              <option key={tl.id} value={tl.id}>
                {tl.full_name}
              </option>
            ))}
          </select>
        </label>

        {form.role === "employee" ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Manager
            <select
              value={form.manager_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  manager_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              aria-label="Assign manager"
              className={`cursor-pointer ${fieldClass}`}
            >
              <option value="">Select a manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.countries.length ? ` (${m.countries.join(", ")})` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {form.role === "manager" ? (
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
