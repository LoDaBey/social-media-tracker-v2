import type { CountryRegion } from "@/lib/region-config";
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
