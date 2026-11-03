import type { Metadata } from "next";
import { fetchAdminCountryCoverage } from "@/lib/admin-country-coverage";
import { AdminCoverageKpis } from "@/components/admin/AdminCoverageKpis";
import { AdminCountryCoverageSection } from "@/components/admin/AdminCountryCoverageSection";
import { AdminOverviewHeadingActions } from "@/app/(app)/admin/components/AdminOverviewHeadingActions";
import { AdminOverviewRegionTabs } from "@/components/admin/AdminOverviewRegionTabs";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";
import { adminRegionFromSlug } from "@/lib/region-config";
import { fetchStrategyProjects } from "@/lib/strategy-projects-data";

export const metadata: Metadata = {
  title: "Admin",
};

type AdminOverviewPageProps = {
  searchParams: Promise<{ region?: string }>;
};

export default async function AdminOverviewPage({
  searchParams,
}: AdminOverviewPageProps) {
  const params = await searchParams;
  const region = adminRegionFromSlug(params.region);
  const [coverage, strategyProjects] = await Promise.all([
    fetchAdminCountryCoverage({ region }),
    fetchStrategyProjects(),
  ]);
  const projects = strategyProjects.map((project) => ({
    slug: project.slug,
    name: project.name,
  }));

  return (
    <AdminWorkspace
      view={adminViewOverview()}
      actions={<AdminOverviewHeadingActions region={region} />}
    >
      <AdminOverviewRegionTabs region={region} projects={projects}>
        <AdminCoverageKpis coverage={coverage} />
        <AdminCountryCoverageSection
          coverage={coverage}
          region={region}
          projectName={
            projects.find((project) => project.slug === region)?.name ??
            projects.find(
              (project) =>
                (project.slug === "africa" && region === "Africa") ||
                (project.slug === "europe" && region === "Europe") ||
                (project.slug === "alphaa" && region === "Alphaa")
            )?.name
          }
        />
      </AdminOverviewRegionTabs>
    </AdminWorkspace>
  );
}
