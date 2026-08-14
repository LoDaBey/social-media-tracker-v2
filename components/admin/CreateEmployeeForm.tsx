"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createEmployee } from "@/actions/admin";
import { SETUP_COUNTRIES, SETUP_REGION } from "@/lib/setup-options";
import type { Role } from "@/types/db";
import type {
  AdminManagerOption,
  AdminTeamLeadOption,
  CreateEmployeeFieldErrors,
} from "@/types/admin";
import { AdminFieldError } from "@/components/admin/AdminFieldError";
import { ManagerCountriesField } from "@/components/admin/ManagerCountriesField";
import {
  firstCreateEmployeeError,
  validateCreateEmployeeForm,
} from "@/lib/admin-create-validation";

type Props = {
  teamLeads: AdminTeamLeadOption[];
  managers: AdminManagerOption[];
};

export function CreateEmployeeForm({ teamLeads, managers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [team_lead_id, setTeamLeadId] = useState<string>("");
  const [manager_id, setManagerId] = useState<string>("");
  const [manager_countries, setManagerCountries] = useState<string[]>([]);
  const [base_salary, setBaseSalary] = useState("4500");
  const [country, setCountry] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreateEmployeeFieldErrors>({});

  const selectedManager = useMemo(
    () => managers.find((m) => String(m.id) === manager_id) ?? null,
    [managers, manager_id]
  );

  const countryMismatch =
    role === "employee" &&
    Boolean(country) &&
    Boolean(selectedManager) &&
    !selectedManager!.countries.includes(country);

  function toggleManagerCountry(option: string) {
    setManagerCountries((prev) =>
      prev.includes(option)
        ? prev.filter((c) => c !== option)
        : [...prev, option]
    );
  }

  function submit() {
    setError(null);
    const nextFieldErrors = validateCreateEmployeeForm({
      full_name,
      email,
      password,
      role,
      country,
      manager_id,
      manager_countries,
    });
    setFieldErrors(nextFieldErrors);
    const firstError = firstCreateEmployeeError(nextFieldErrors);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createEmployee({
          full_name,
          email,
          password,
          phone: phone.trim() || null,
          role,
          team_lead_id:
            (role === "employee" || role === "manager") && team_lead_id
              ? Number(team_lead_id)
              : null,
          manager_id:
            role === "employee" && manager_id ? Number(manager_id) : null,
          manager_countries: role === "manager" ? manager_countries : undefined,
          base_salary: Number(base_salary),
          country:
            role === "manager"
              ? manager_countries[0] ?? ""
              : country,
        });
        if ("error" in result) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        const { id } = result;
        const roleLabel =
          role === "manager"
            ? "Manager"
            : role === "team_lead"
              ? "Team lead"
              : role === "admin"
                ? "Admin"
                : "Employee";
        toast.success(`${roleLabel} created.`);
        router.push(`/admin/employees/${id}`);
        router.refresh();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not create employee.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const teamLeadDisabled = role === "team_lead" || role === "admin";
  const isManagerRole = role === "manager";
  const isEmployeeRole = role === "employee";

  const fieldClass =
    "rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";
  const invalidFieldClass =
    "border-[var(--color-coral)] focus-visible:ring-[var(--color-coral)]";

  return (
    <div
      className="w-full max-w-[960px] rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-8 md:p-10"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <h2 className="text-[26px] font-extrabold tracking-tight text-[var(--color-ink)] md:text-[30px]">
        New employee
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        Create an account and assign their country. Region is always {SETUP_REGION}. The employee
        can change their password after first login.
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}
      {countryMismatch ? (
        <p
          role="status"
          className="mt-4 rounded-lg bg-[var(--color-gold)]/15 px-4 py-3 text-[14px] text-[var(--color-ink)]"
        >
          Warning: {country} is not in this manager&apos;s countries (
          {selectedManager!.countries.join(", ") || "none"}). The employee will
          stay hidden from that manager&apos;s team until countries overlap.
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Full name
          <input
            value={full_name}
            onChange={(e) => {
              setFullName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, full_name: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.full_name)}
            aria-describedby={
              fieldErrors.full_name ? "create-full-name-error" : undefined
            }
            className={`${fieldClass} ${fieldErrors.full_name ? invalidFieldClass : ""}`}
          />
          <AdminFieldError
            id="create-full-name-error"
            message={fieldErrors.full_name}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "create-email-error" : undefined
            }
            className={`${fieldClass} ${fieldErrors.email ? invalidFieldClass : ""}`}
          />
          <AdminFieldError id="create-email-error" message={fieldErrors.email} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Temporary password
          <input
            type="password"
            value={password}
            minLength={8}
            autoComplete="new-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="create-password-hint"
            className={`${fieldClass} ${fieldErrors.password ? invalidFieldClass : ""}`}
          />
          <span
            id="create-password-hint"
            className={
              fieldErrors.password
                ? "text-[12px] font-medium text-[var(--color-coral)]"
                : "text-[12px] font-medium text-[var(--color-muted)]"
            }
          >
            {fieldErrors.password ?? "Must be at least 8 characters."}
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </label>
        {isManagerRole ? null : (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Country
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setFieldErrors((prev) => ({ ...prev, country: undefined }));
              }}
              aria-label="Assign employee country"
              aria-invalid={Boolean(fieldErrors.country)}
              aria-describedby={
                fieldErrors.country ? "create-country-error" : undefined
              }
              className={`cursor-pointer ${fieldClass} ${fieldErrors.country ? invalidFieldClass : ""}`}
            >
              <option value="">Select a country</option>
              {SETUP_COUNTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <AdminFieldError
              id="create-country-error"
              message={fieldErrors.country}
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Region
          <input
            value={SETUP_REGION}
            disabled
            readOnly
            aria-label="Region is Africa for every country"
            className={`${fieldClass} cursor-not-allowed opacity-70`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role);
              setFieldErrors({});
            }}
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
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
        {isEmployeeRole ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Manager
            <select
              value={manager_id}
              onChange={(e) => {
                setManagerId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, manager_id: undefined }));
              }}
              aria-label="Assign manager"
              aria-invalid={Boolean(fieldErrors.manager_id)}
              aria-describedby={
                fieldErrors.manager_id ? "create-manager-error" : undefined
              }
              className={`cursor-pointer ${fieldClass} ${fieldErrors.manager_id ? invalidFieldClass : ""}`}
            >
              <option value="">Select a manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.countries.length ? ` (${m.countries.join(", ")})` : ""}
                </option>
              ))}
            </select>
            <AdminFieldError
              id="create-manager-error"
              message={fieldErrors.manager_id}
            />
          </label>
        ) : null}
        {isManagerRole ? (
          <ManagerCountriesField
            selected={manager_countries}
            error={fieldErrors.manager_countries}
            onToggle={(option) => {
              toggleManagerCountry(option);
              setFieldErrors((prev) => ({
                ...prev,
                manager_countries: undefined,
              }));
            }}
          />
        ) : null}
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
