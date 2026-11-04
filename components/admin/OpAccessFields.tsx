"use client";

import { AdminFieldError } from "@/components/admin/AdminFieldError";
import { CountryFlag } from "@/lib/country-icons";
import { countriesForCreateProject } from "@/lib/employee-create-projects";
import { regionDisplayLabel } from "@/lib/project-labels";
import { regionFromStrategyProjectSlug } from "@/lib/employee-create-projects";
import type { OpAccessFieldsProps } from "@/types/admin";

export function OpAccessFields({
  projects,
  projectSlug,
  selectedCountries,
  projectError,
  countriesError,
  fieldClass,
  invalidFieldClass,
  onProjectChange,
  onToggleCountry,
}: OpAccessFieldsProps) {
  const projectCountries = countriesForCreateProject(projects, projectSlug);
  const regionLabel = projectSlug
    ? regionDisplayLabel(regionFromStrategyProjectSlug(projectSlug))
    : "";

  return (
    <div className="sm:col-span-2 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
        Project access
        <select
          value={projectSlug}
          onChange={(e) => onProjectChange(e.target.value)}
          aria-label="Select project this Operation Manager can access"
          aria-invalid={Boolean(projectError)}
          aria-describedby={projectError ? "create-op-project-error" : undefined}
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
        <AdminFieldError id="create-op-project-error" message={projectError} />
        {regionLabel ? (
          <span className="text-[12px] font-medium text-[var(--color-muted)]">
            Region for this project: {regionLabel}
          </span>
        ) : null}
      </label>

      <fieldset>
        <legend className="text-[13px] font-semibold text-[var(--color-muted)]">
          Country access
        </legend>
        <p className="mt-1 text-[12px] font-medium text-[var(--color-muted)]">
          Choose which countries inside this project the Operation Manager can
          view. They will only see employees, spare, strategy, extract, and
          activity for these countries.
        </p>
        <div
          className={`mt-2 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border bg-[var(--color-cream-tint)] p-4 ${
            countriesError
              ? "border-[var(--color-coral)]"
              : "border-[var(--color-hairline)]"
          }`}
        >
          {!projectSlug ? (
            <p className="text-[13px] text-[var(--color-muted)]">
              Select a project first to list its countries.
            </p>
          ) : projectCountries.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)]">
              This project has no countries yet. Add them in Strategy.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {projectCountries.map((country) => (
                <label
                  key={country}
                  className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--color-ink)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country)}
                    onChange={() => onToggleCountry(country)}
                    className="rounded outline-none"
                    aria-label={`Allow access to ${country}`}
                  />
                  <CountryFlag country={country} className="h-5 w-7" />
                  <span>{country}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <AdminFieldError id="create-op-countries-error" message={countriesError} />
      </fieldset>
    </div>
  );
}
