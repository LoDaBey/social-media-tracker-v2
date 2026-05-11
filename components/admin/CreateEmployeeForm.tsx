"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createEmployee } from "@/actions/admin";
import type { Role } from "@/types/db";

type TeamLeadOption = { id: number; full_name: string };

type Props = {
  teamLeads: TeamLeadOption[];
};

export function CreateEmployeeForm({ teamLeads }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [team_lead_id, setTeamLeadId] = useState<string>("");
  const [base_salary, setBaseSalary] = useState("4500");

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createEmployee({
          full_name,
          email,
          password,
          phone: phone.trim() || null,
          role,
          team_lead_id:
            role === "employee" && team_lead_id ? Number(team_lead_id) : null,
          base_salary: Number(base_salary),
        });
        router.push(`/admin/employees/${id}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create employee.");
      }
    });
  }

  const teamLeadDisabled = role !== "employee";

  const fieldClass =
    "rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

  return (
    <div
      className="w-full max-w-[960px] rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-8 md:p-10"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <h2 className="text-[26px] font-extrabold tracking-tight text-[var(--color-ink)] md:text-[30px]">
        New employee
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        Create an account and sign-in credentials. The employee can change their password after first
        login.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Full name
          <input
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Temporary password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="employee">Employee</option>
            <option value="team_lead">Team lead</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Team lead
          <select
            disabled={teamLeadDisabled}
            value={team_lead_id}
            onChange={(e) => setTeamLeadId(e.target.value)}
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
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)] sm:col-span-2">
          Base salary (EGP / cycle)
          <span className="flex max-w-md items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5">
            <span className="text-[13px] font-semibold text-[var(--color-muted)]">EGP</span>
            <input
              type="number"
              min={0}
              value={base_salary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            />
          </span>
        </label>
      </div>

      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={pending}
        onClick={submit}
        aria-label="Create employee account"
        className="mt-8 w-full cursor-pointer rounded-lg bg-[var(--color-emerald)] px-6 py-3.5 text-[15px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
      >
        {pending ? "Creating…" : "Create employee"}
      </motion.button>
    </div>
  );
}
