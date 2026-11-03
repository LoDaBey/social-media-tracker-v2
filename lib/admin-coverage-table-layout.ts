import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";

/** Shared coverage table column widths so country + holder rows stay aligned. */
export const COVERAGE_COL = {
  country: "w-[220px] min-w-[220px] max-w-[220px]",
  language: "w-[104px] min-w-[104px] max-w-[104px]",
  metric: "w-[92px] min-w-[92px] max-w-[92px]",
} as const;

export const COVERAGE_HEAD_CELL = `px-4 py-3 align-bottom ${COVERAGE_COL.metric}`;
export const COVERAGE_BODY_CELL = `whitespace-nowrap px-4 py-3 ${COVERAGE_COL.metric}`;
export const COVERAGE_COUNTRY_CELL = `px-4 py-3 ${COVERAGE_COL.country}`;
export const COVERAGE_LANGUAGE_CELL = `whitespace-nowrap px-4 py-3 ${COVERAGE_COL.language}`;

export function coverageTableMinWidth(showAlphaaPlatforms: boolean) {
  const base = 220 + 104 + 92 * 7;
  const extra = showAlphaaPlatforms
    ? ALPHAA_EXTRA_PLATFORM_KEYS.length * 92
    : 0;
  return base + extra;
}

export function coverageColumnCount(showAlphaaPlatforms: boolean) {
  return showAlphaaPlatforms ? 9 + ALPHAA_EXTRA_PLATFORM_KEYS.length : 9;
}
