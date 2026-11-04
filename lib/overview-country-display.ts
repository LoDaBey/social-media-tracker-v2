import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";

/** Countries shown twice on Overview between Africa temp + Main legacy. */
export const DUAL_REGION_COUNTRIES = ["Sudan"] as const;

export type OverviewCountrySource = "Africa" | "Alphaa";

export function isDualRegionCountry(country: string) {
  return (DUAL_REGION_COUNTRIES as readonly string[]).includes(country);
}

/** Normalize Alphaa → Main for Overview suffixes. */
export function overviewProjectLabel(projectLabel: string): string {
  if (projectLabel === "Alphaa" || projectLabel === "alphaa") {
    return MAIN_PROJECT_LABEL;
  }
  return projectLabel;
}

export function overviewLabeledCountry(
  country: string,
  projectLabel: string
): string {
  return `${country} (${overviewProjectLabel(projectLabel)})`;
}

export function overviewDisplayCountry(
  country: string,
  source: OverviewCountrySource
): string {
  if (!isDualRegionCountry(country)) return country;
  return overviewLabeledCountry(country, source);
}

/** Strip Overview project suffix so flags and filters match the base country. */
export function baseCountryFromDisplay(displayCountry: string): string {
  const match = displayCountry.match(/^(.+)\s+\(([^)]+)\)$/);
  return match?.[1]?.trim() ?? displayCountry;
}

/**
 * When the same country appears under multiple projects, resolve which display
 * key matches a preferred project (e.g. Main vs Asia).
 */
export function resolveOverviewActualKey(
  displayCountries: readonly string[],
  baseCountry: string,
  preferredProjectLabel: string
): string {
  const matches = displayCountries.filter(
    (name) => baseCountryFromDisplay(name) === baseCountry
  );
  if (matches.length === 0) return baseCountry;
  if (matches.length === 1) return matches[0]!;
  const preferred = overviewLabeledCountry(baseCountry, preferredProjectLabel);
  return matches.find((name) => name === preferred) ?? matches[0]!;
}

type OverviewPlanEntry<T> = {
  plan: T;
  baseCountry: string;
  projectLabel: string;
};

/** Append `(Project)` when the same country appears under more than one project. */
export function labelDuplicateOverviewPlans<T extends { country: string }>(
  entries: OverviewPlanEntry<T>[]
): T[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.baseCountry, (counts.get(entry.baseCountry) ?? 0) + 1);
  }

  return entries.map(({ plan, baseCountry, projectLabel }) => {
    const duplicate = (counts.get(baseCountry) ?? 0) > 1;
    return {
      ...plan,
      country: duplicate
        ? overviewLabeledCountry(baseCountry, projectLabel)
        : baseCountry,
    };
  });
}
