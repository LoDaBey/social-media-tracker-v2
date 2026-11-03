/** User-facing name for the legacy Alphaa / ALPHAA book and roster. */
export const MAIN_PROJECT_LABEL = "Main";

/** Display name for a region key; the "Alphaa" key shows as the main project. */
export function regionDisplayLabel(region: string): string {
  return region === "Alphaa" ? MAIN_PROJECT_LABEL : region;
}

export function mainProjectDisplayCountry(country: string): string {
  return `${country} (${MAIN_PROJECT_LABEL})`;
}
