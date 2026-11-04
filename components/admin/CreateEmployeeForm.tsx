"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createEmployee } from "@/actions/admin";
import { setupRegionForCountry } from "@/lib/setup-options";
import { regionDisplayLabel } from "@/lib/project-labels";
import {
  countriesForCreateProject,
} from "@/lib/employee-create-projects";
import { ROLE_LABELS, reportingFieldsFromSupervisor } from "@/lib/role-hierarchy";
import type { Role } from "@/types/db";
import type {
  CreateEmployeeFieldErrors,
  CreateEmployeeFormProps,
} from "@/types/admin";
import { AdminFieldError } from "@/components/admin/AdminFieldError";
import { CreateEmployeeProjectFields } from "@/components/admin/CreateEmployeeProjectFields";
import { EmployeeReportingFields } from "@/components/admin/EmployeeReportingFields";
import { ManagerCountriesField } from "@/components/admin/ManagerCountriesField";
import { OpAccessFields } from "@/components/admin/OpAccessFields";
import { SupervisorAssignField } from "@/components/admin/SupervisorAssignField";
import {
  firstCreateEmployeeError,
  validateCreateEmployeeForm,
} from "@/lib/admin-create-validation";

function managerCountriesForEmployee(
  managerId: number | null,
  teamLeadId: number | null,
  teamLeads: CreateEmployeeFormProps["teamLeads"],
  managers: CreateEmployeeFormProps["managers"]
): string[] {
  if (managerId) {
    return managers.find((manager) => manager.id === managerId)?.countries ?? [];
  }
  if (!teamLeadId) return [];
  const teamLead = teamLeads.find((tl) => tl.id === teamLeadId);
  if (!teamLead?.manager_id) return [];
  return managers.find((m) => m.id === teamLead.manager_id)?.countries ?? [];
}

export function CreateEmployeeForm({
  teamLeads,
  managers,
  ops,
  admins,
  projects,
}: CreateEmployeeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [supervisor_id, setSupervisorId] = useState<string>("");
  const [employee_manager_id, setEmployeeManagerId] = useState<number | null>(
    null
  );
  const [employee_team_lead_id, setEmployeeTeamLeadId] = useState<number | null>(
    null
  );
  const [manager_countries, setManagerCountries] = useState<string[]>([]);
  const [op_countries, setOpCountries] = useState<string[]>([]);
  const [project_slug, setProjectSlug] = useState("");
  const [country, setCountry] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CreateEmployeeFieldErrors>({});

  const isManagerRole = role === "manager";
  const isOpRole = role === "op";
  const isGlobalRole = role === "admin";
  const showCountryFields = !isManagerRole && !isGlobalRole && !isOpRole;

  const projectCountries = useMemo(
    () => countriesForCreateProject(projects, project_slug),
    [projects, project_slug]
  );

  const regionalManagerCountries = useMemo(() => {
    if (role !== "employee") return [];
    return managerCountriesForEmployee(
      employee_manager_id,
      employee_team_lead_id,
      teamLeads,
      managers
    );
  }, [role, employee_manager_id, employee_team_lead_id, teamLeads, managers]);

  const countryMismatch =
    role === "employee" &&
    Boolean(country) &&
    regionalManagerCountries.length > 0 &&
    !regionalManagerCountries.includes(country);

  function toggleManagerCountry(option: string) {
    setManagerCountries((prev) =>
      prev.includes(option)
        ? prev.filter((c) => c !== option)
        : [...prev, option]
    );
  }

  function toggleOpCountry(option: string) {
    setOpCountries((prev) =>
      prev.includes(option)
        ? prev.filter((c) => c !== option)
        : [...prev, option]
    );
  }

  function handleProjectChange(nextSlug: string) {
    setProjectSlug(nextSlug);
    setCountry("");
    setOpCountries([]);
    setFieldErrors((prev) => ({
      ...prev,
      project_slug: undefined,
      country: undefined,
      op_countries: undefined,
    }));
  }

  function submit() {
    setError(null);
    const nextFieldErrors = validateCreateEmployeeForm({
      full_name,
      email,
      password,
      role,
      country,
      project_slug,
      projectCountries,
      supervisor_id,
      manager_id: employee_manager_id,
      team_lead_id: employee_team_lead_id,
      manager_countries,
      op_countries,
    });
    setFieldErrors(nextFieldErrors);
    const firstError = firstCreateEmployeeError(nextFieldErrors);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    const reporting =
      role === "employee"
        ? {
            team_lead_id: employee_team_lead_id,
            manager_id: employee_manager_id,
            op_id: null,
          }
        : reportingFieldsFromSupervisor(
            role,
            supervisor_id ? Number(supervisor_id) : null
          );

    startTransition(async () => {
      try {
        const result = await createEmployee({
          full_name,
          email,
          password,
          phone: phone.trim() || null,
          role,
          team_lead_id: reporting.team_lead_id,
          manager_id: reporting.manager_id,
          op_id: reporting.op_id,
          manager_countries: role === "manager" ? manager_countries : undefined,
          op_countries: role === "op" ? op_countries : undefined,
          project_slug:
            showCountryFields || role === "op" ? project_slug : undefined,
          country:
            role === "manager"
              ? manager_countries[0] ?? ""
              : role === "op"
                ? op_countries[0] ?? ""
                : country,
        });
        if ("error" in result) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        const { id } = result;
        toast.success(`${ROLE_LABELS[role]} created.`);
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

  const managerAssignedRegion = useMemo(() => {
    if (isManagerRole && manager_countries.length > 0) {
      return regionDisplayLabel(setupRegionForCountry(manager_countries[0]));
    }
    return "";
  }, [isManagerRole, manager_countries]);

  const fieldClass =
    "w-full rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";
  const invalidFieldClass =
    "border-[var(--color-coral)] focus-visible:ring-[var(--color-coral)]";

  return (
    <div
      className="w-full rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-8 md:p-10"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <h2 className="text-[26px] font-extrabold tracking-tight text-[var(--color-ink)] md:text-[30px]">
        New employee
      </h2>
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
          Warning: {country} is not in the country manager&apos;s countries (
          {regionalManagerCountries.join(", ")}). The employee may stay hidden
          from that manager until countries overlap.
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
        {showCountryFields ? (
          <CreateEmployeeProjectFields
            projects={projects}
            projectSlug={project_slug}
            country={country}
            projectCountries={projectCountries}
            projectError={fieldErrors.project_slug}
            countryError={fieldErrors.country}
            fieldClass={fieldClass}
            invalidFieldClass={invalidFieldClass}
            onProjectChange={handleProjectChange}
            onCountryChange={(next) => {
              setCountry(next);
              setFieldErrors((prev) => ({ ...prev, country: undefined }));
            }}
          />
        ) : null}
        {isManagerRole && managerAssignedRegion ? (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Primary region
            <input
              value={managerAssignedRegion}
              disabled
              readOnly
              aria-label={`Primary region is ${managerAssignedRegion}`}
              className={`${fieldClass} cursor-not-allowed opacity-70`}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role);
              setSupervisorId("");
              setEmployeeManagerId(null);
              setEmployeeTeamLeadId(null);
              setProjectSlug("");
              setCountry("");
              setOpCountries([]);
              setManagerCountries([]);
              setFieldErrors({});
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
        {role === "employee" ? (
          <EmployeeReportingFields
            value={{
              managerId: employee_manager_id,
              teamLeadId: employee_team_lead_id,
            }}
            onChange={(next) => {
              setEmployeeManagerId(next.managerId);
              setEmployeeTeamLeadId(next.teamLeadId);
              setFieldErrors((prev) => ({ ...prev, manager_id: undefined }));
            }}
            teamLeads={teamLeads}
            managers={managers}
            country={country}
            managerError={fieldErrors.manager_id}
            managerErrorId="create-manager-error"
            fieldClass={fieldClass}
            invalidFieldClass={invalidFieldClass}
          />
        ) : (
          <SupervisorAssignField
            userRole={role}
            value={supervisor_id ? Number(supervisor_id) : null}
            onChange={(id) => {
              setSupervisorId(id ? String(id) : "");
              setFieldErrors((prev) => ({ ...prev, supervisor_id: undefined }));
            }}
            teamLeads={teamLeads}
            managers={managers}
            ops={ops}
            admins={admins}
            error={fieldErrors.supervisor_id}
            errorId="create-supervisor-error"
            fieldClass={fieldClass}
            invalidFieldClass={invalidFieldClass}
          />
        )}
        {isManagerRole ? (
          <ManagerCountriesField
            selected={manager_countries}
            error={fieldErrors.manager_countries}
            projects={projects}
            onToggle={(option) => {
              toggleManagerCountry(option);
              setFieldErrors((prev) => ({
                ...prev,
                manager_countries: undefined,
              }));
            }}
          />
        ) : null}
        {isOpRole ? (
          <OpAccessFields
            projects={projects}
            projectSlug={project_slug}
            selectedCountries={op_countries}
            projectError={fieldErrors.project_slug}
            countriesError={fieldErrors.op_countries}
            fieldClass={fieldClass}
            invalidFieldClass={invalidFieldClass}
            onProjectChange={handleProjectChange}
            onToggleCountry={(option) => {
              toggleOpCountry(option);
              setFieldErrors((prev) => ({
                ...prev,
                op_countries: undefined,
              }));
            }}
          />
        ) : null}
      </div>

      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={pending}
        onClick={submit}
        aria-label="Create employee"
        className="mt-8 w-full cursor-pointer rounded-lg bg-[var(--color-emerald)] px-5 py-3.5 text-[15px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {pending ? "Creating…" : "Create employee"}
      </motion.button>
    </div>
  );
}
