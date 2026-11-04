import type { CountryRegion } from "@/lib/region-config";
import { fetchStrategyProjects } from "@/lib/strategy-projects-data";
import type { EmployeeCreateProjectOption } from "@/types/admin";

const KNOWN_REGIONS: Record<string, CountryRegion> = {
  alphaa: "Alphaa",
  africa: "Africa",
  europe: "Europe",
  asia: "Asia",
};

/** Map a Strategy project slug to the `temp_users.region` value. */
export function regionFromStrategyProjectSlug(slug: string): CountryRegion {
  const normalized = slug.trim().toLowerCase();
  return KNOWN_REGIONS[normalized] ?? "Africa";
}

export async function fetchEmployeeCreateProjectOptions(): Promise<
  EmployeeCreateProjectOption[]
> {
  const projects = await fetchStrategyProjects();
  return projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    countries: [
      ...new Set(project.subProjects.map((child) => child.name.trim()).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b)),
  }));
}

export function countriesForCreateProject(
  projects: EmployeeCreateProjectOption[],
  projectSlug: string
): string[] {
  return projects.find((project) => project.slug === projectSlug)?.countries ?? [];
}

export function projectNameForSlug(
  projects: EmployeeCreateProjectOption[],
  projectSlug: string
): string {
  return projects.find((project) => project.slug === projectSlug)?.name ?? projectSlug;
}
