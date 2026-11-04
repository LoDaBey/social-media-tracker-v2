import { fetchStrategyProjects } from "@/lib/strategy-projects-data";
import type { EmployeeCreateProjectOption } from "@/types/admin";

export async function fetchEmployeeCreateProjectOptions(): Promise<
  EmployeeCreateProjectOption[]
> {
  const projects = await fetchStrategyProjects();
  return projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    countries: [
      ...new Set(
        project.subProjects.map((child) => child.name.trim()).filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b)),
  }));
}
