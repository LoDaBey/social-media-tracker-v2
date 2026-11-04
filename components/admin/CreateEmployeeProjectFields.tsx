"use client";

import { AdminCountrySelect } from "@/components/admin/AdminCountrySelect";
import { AdminFieldError } from "@/components/admin/AdminFieldError";
import { regionDisplayLabel } from "@/lib/project-labels";
import { regionFromStrategyProjectSlug } from "@/lib/employee-create-projects";
import type { EmployeeCreateProjectOption } from "@/types/admin";

type Props = {
  projects: EmployeeCreateProjectOption[];
  projectSlug: string;
  country: string;
  projectCountries: string[];
  projectError?: string;
  countryError?: string;
  fieldClass: string;
  invalidFieldClass: string;
  onProjectChange: (slug: string) => void;
  onCountryChange: (country: string) => void;
};

export function CreateEmployeeProjectFields({
  projects,
  projectSlug,
  country,
  projectCountries,
  projectError,
  countryError,
  fieldClass,
  invalidFieldClass,
  onProjectChange,
  onCountryChange,
}: Props) {
  const assignedRegion = projectSlug
    ? regionDisplayLabel(regionFromStrategyProjectSlug(projectSlug))
    : "";

  return (
    <>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
        Project
        <select
          value={projectSlug}
          onChange={(e) => onProjectChange(e.target.value)}
          aria-label="Select project"
          aria-invalid={Boolean(projectError)}
          aria-describedby={
            projectError ? "create-project-error" : undefined
          }
          className={`cursor-pointer ${fieldClass} ${
            projectError ? invalidFieldClass : ""
          }`}
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
              {project.countries.length > 0
                ? ` (${project.countries.length})`
                : ""}
            </option>
          ))}
        </select>
        <AdminFieldError id="create-project-error" message={projectError} />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
        Region
        <input
          value={assignedRegion}
          disabled
          readOnly
          placeholder="Select a project"
          aria-label={
            assignedRegion
              ? `Region is ${assignedRegion}`
              : "Region is set automatically from the selected project"
          }
          className={`${fieldClass} cursor-not-allowed opacity-70`}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)] sm:col-span-2">
        Country / sub-project
        <AdminCountrySelect
          value={country}
          countries={projectCountries}
          disabled={!projectSlug || projectCountries.length === 0}
          onChange={onCountryChange}
          ariaLabel="Assign employee country for this project"
          ariaInvalid={Boolean(countryError)}
          ariaDescribedBy={
            countryError ? "create-country-error" : "create-country-hint"
          }
          invalid={Boolean(countryError)}
        />
        {countryError ? (
          <AdminFieldError
            id="create-country-error"
            message={countryError}
          />
        ) : (
          <span
            id="create-country-hint"
            className="text-[12px] font-medium text-[var(--color-muted)]"
          >
            {!projectSlug
              ? "Select a project first to see its countries."
              : projectCountries.length === 0
                ? "This project has no countries yet. Add them in Strategy."
                : `Showing ${projectCountries.length} ${
                    projectCountries.length === 1 ? "country" : "countries"
                  } for this project.`}
          </span>
        )}
      </label>
    </>
  );
}
