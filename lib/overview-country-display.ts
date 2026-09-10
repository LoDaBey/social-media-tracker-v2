/** Countries shown twice on Overview (Africa temp + ALPHAA legacy). */
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
  return source === "Africa" ? `${country} (Africa)` : `${country} (ALPHAA)`;
}

/** Strip Overview suffix so flags match the base country name. */
export function baseCountryFromDisplay(displayCountry: string): string {
  const match = displayCountry.match(/^(.+)\s+\((Africa|ALPHAA)\)$/);
  return match?.[1]?.trim() ?? displayCountry;
}
