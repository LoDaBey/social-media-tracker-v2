import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";

/** Countries shown twice on Overview (Africa temp + Main legacy). */
export const DUAL_REGION_COUNTRIES = ["Sudan"] as const;

export type OverviewCountrySource = "Africa" | "Alphaa";

export function isDualRegionCountry(country: string) {
  return (DUAL_REGION_COUNTRIES as readonly string[]).includes(country);
}

export function overviewDisplayCountry(
  country: string,
  source: OverviewCountrySource
): string {
  if (!isDualRegionCountry(country)) return country;
  return source === "Africa"
    ? `${country} (Africa)`
    : `${country} (${MAIN_PROJECT_LABEL})`;
}

/** Strip Overview suffix so flags match the base country name. */
export function baseCountryFromDisplay(displayCountry: string): string {
  const escaped = MAIN_PROJECT_LABEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = displayCountry.match(
    new RegExp(`^(.+)\\s+\\((Africa|${escaped})\\)$`)
  );
  return match?.[1]?.trim() ?? displayCountry;
}
