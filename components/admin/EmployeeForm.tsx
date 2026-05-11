"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { updateEmployeeProfile } from "@/actions/admin";
import { LEVEL_LABELS } from "@/lib/level-labels";
import type { Role } from "@/types/db";
import type { UpdateEmployeeProfilePayload } from "@/types/admin";

type TeamLeadOption = { id: number; full_name: string };

export type EmployeeFormInitial = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  hire_date: string;
  team_lead_id: number | null;
  base_salary: string;
  current_level: number;
  pay_cycle_start_date: string | null;
  /** Bumps when the user row changes so the parent can reset client form state via `key`. */
  updated_at: string;
};

type Props = {
  initial: EmployeeFormInitial;
  teamLeads: TeamLeadOption[];
};

function normalizeDate(v: string | null): string {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

export function EmployeeForm({ initial, teamLeads }: Props) {
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
      hire_date: normalizeDate(initial.hire_date),
      team_lead_id: initial.team_lead_id,
      base_salary: String(initial.base_salary),
      current_level: initial.current_level,
      pay_cycle_start_date: normalizeDate(initial.pay_cycle_start_date),
    }),
    [initial]
  );

  const [form, setForm] = useState(base);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(base), [form, base]);

  const teamLeadDisabled = form.role === "team_lead" || form.role === "admin";

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
      hire_date: form.hire_date,
      team_lead_id: teamLeadDisabled ? null : form.team_lead_id,
      base_salary: Number(form.base_salary),
      current_level: form.current_level,
      pay_cycle_start_date: form.pay_cycle_start_date === "" ? null : form.pay_cycle_start_date,
    };

    startTransition(async () => {
      try {
        await updateEmployeeProfile(initial.id, payload);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-2 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Full name
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
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
              }))
            }
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <option value="employee">Employee</option>
            <option value="team_lead">Team lead</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-[var(--color-muted)]">Active</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_active}
            aria-label={form.is_active ? "Employee is active" : "Employee is inactive"}
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className={`relative h-9 w-16 cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              form.is_active ? "bg-[var(--color-emerald)]" : "bg-[var(--color-hairline)]"
            }`}
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                form.is_active ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Hire date
          <input
            type="date"
            value={form.hire_date}
            onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
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
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None</option>
            {teamLeads.map((tl) => (
              <option key={tl.id} value={tl.id}>
                {tl.full_name}
              </option>
            ))}
          </select>
        </label>

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
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            {[1, 2, 3, 4, 5, 6].map((lv) => (
              <option key={lv} value={lv}>
                {lv} — {LEVEL_LABELS[lv] ?? lv}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)] lg:col-span-2">
          Pay cycle start date
          <input
            type="date"
            value={form.pay_cycle_start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, pay_cycle_start_date: e.target.value }))
            }
            className="max-w-xs rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          />
          <span className="text-[12px] font-normal text-[var(--color-muted)]">
            Changing this will reset the cycle for this employee.
          </span>
        </label>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap gap-3 border-t border-[var(--color-hairline)] bg-[var(--color-cream)] px-4 py-4 sm:-mx-8">
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
