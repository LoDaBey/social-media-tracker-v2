import type { StrategyPageSearchParams, StrategyProjectSummary } from "@/types/strategy";

export function strategySlugFromSearchParams(
  params: StrategyPageSearchParams
): string | null {
  const project = params.project?.trim();
  if (project) return project;
  const book = params.book?.trim();
  if (book && book !== "project") return book;
  return null;
}

export function strategySelectedSlug(
  params: StrategyPageSearchParams,
  projects: Pick<StrategyProjectSummary, "slug">[]
): string | null {
  return strategySlugFromSearchParams(params) ?? projects[0]?.slug ?? null;
}

export function strategyHrefForProject(slug: string): string {
  return `/admin/strategy?project=${encodeURIComponent(slug)}`;
}
