import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminViewerOrNull } from "@/lib/admin-access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewStrategy } from "@/lib/admin-view";
import {
  fetchStrategyProjectRegionOptions,
  fetchStrategyProjects,
} from "@/lib/strategy-projects-data";
import { strategySelectedSlug } from "@/lib/strategy-tabs";
import { StrategyTool } from "./components/StrategyTool";
import type { StrategyPageSearchParams } from "@/types/strategy";

type StrategyPageProps = {
  searchParams: Promise<StrategyPageSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: StrategyPageProps): Promise<Metadata> {
  const params = await searchParams;
  const projects = await fetchStrategyProjects();
  const selectedSlug = strategySelectedSlug(params, projects);
  const project = projects.find((item) => item.slug === selectedSlug);
  return {
    title: `Strategy · ${project?.name ?? "Projects"}`,
  };
}

export default async function AdminStrategyPage({ searchParams }: StrategyPageProps) {
  const viewer = await getAdminViewerOrNull();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  const [allProjects, regionOptions] = await Promise.all([
    fetchStrategyProjects(),
    fetchStrategyProjectRegionOptions(),
  ]);

  const projects =
    viewer.role === "op" && viewer.scope?.projectSlug
      ? allProjects.filter((project) => project.slug === viewer.scope!.projectSlug)
      : allProjects;

  const selectedSlug = strategySelectedSlug(params, projects);
  const activeProject =
    projects.find((item) => item.slug === selectedSlug) ?? null;

  return (
    <AdminWorkspace view={adminViewStrategy()}>
      <StrategyTool
        key={selectedSlug ?? "empty"}
        selectedSlug={selectedSlug}
        projects={projects}
        activeProject={activeProject}
        regionOptions={regionOptions}
        canEdit={viewer.canEdit}
      />
    </AdminWorkspace>
  );
}
