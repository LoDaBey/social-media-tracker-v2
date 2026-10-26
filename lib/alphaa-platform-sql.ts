/** SQL fragments for legacy social_media_accounts (TableCreations.sql). */

import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type { AlphaaExtraPlatformKey } from "@/types/admin";

/** Same rule as ALPHAA sheet export — non-spare accounts only. */
export const ALPHAA_LEGACY_ACCOUNT_WHERE = `sma.spare_acc IS FALSE`;

/** Live accounts only — matches extract “Active only”. */
export const ALPHAA_LEGACY_ACTIVE_WHERE = `
  (
    sma.acc_state IS NULL
    OR LOWER(TRIM(sma.acc_state)) IN ('', 'active', 'open', 'live')
  )
`;

/** Non-spare + active — coverage and extract default. */
export const ALPHAA_COVERAGE_ACCOUNT_WHERE = `
  ${ALPHAA_LEGACY_ACCOUNT_WHERE}
  AND ${ALPHAA_LEGACY_ACTIVE_WHERE}
`;

export const ALPHAA_PLATFORM_IS_X = `
  (
    LOWER(TRIM(sma.platform)) IN ('twitter', 'x')
    OR LOWER(TRIM(sma.platform)) LIKE '%twitter%'
  )
  AND LOWER(TRIM(sma.platform)) NOT LIKE '%communities%'
  AND LOWER(TRIM(sma.platform)) NOT LIKE '%verified%'
`;

export const ALPHAA_PLATFORM_IS_FACEBOOK = `
  LOWER(TRIM(sma.platform)) IN ('facebook')
  OR (
    LOWER(TRIM(sma.platform)) LIKE '%facebook%'
    AND LOWER(TRIM(sma.platform)) NOT LIKE '%groups%'
  )
`;

/** Umbrella wins when both flags are set — same as extract mapping. */
export const ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA = `
  (${ALPHAA_PLATFORM_IS_FACEBOOK}) AND sma.umberlla IS TRUE
`;

export const ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL = `
  (${ALPHAA_PLATFORM_IS_FACEBOOK}) AND COALESCE(sma.umberlla, FALSE) IS FALSE
`;

export const ALPHAA_PLATFORM_IS_INSTAGRAM = `
  LOWER(TRIM(sma.platform)) LIKE '%instagram%'
`;

export const ALPHAA_PLATFORM_IS_TIKTOK = `
  LOWER(TRIM(sma.platform)) LIKE '%tiktok%'
`;

/** Country bucket for legacy accounts — INITCAP(TRIM(sma.country)). */
export const ALPHAA_LEGACY_COUNTRY = `
  INITCAP(TRIM(COALESCE(sma.country, '')))
`;

const ALPHAA_EXTRA_PLATFORM_SQL: Record<AlphaaExtraPlatformKey, string> = {
  threads: `LOWER(TRIM(sma.platform)) LIKE '%thread%'`,
  reddit: `LOWER(TRIM(sma.platform)) LIKE '%reddit%'`,
  youtube: `LOWER(TRIM(sma.platform)) LIKE '%youtube%'`,
  blogspot: `
    (
      LOWER(TRIM(sma.platform)) LIKE '%blogspot%'
      OR LOWER(TRIM(sma.platform)) LIKE '%blogger%'
    )
    AND LOWER(TRIM(sma.platform)) NOT LIKE '%blogsky%'
  `,
  telegram: `LOWER(TRIM(sma.platform)) LIKE '%telegram%'`,
  website: `LOWER(TRIM(sma.platform)) LIKE '%website%'`,
  pinterest: `LOWER(TRIM(sma.platform)) LIKE '%pinterest%'`,
  turkkitap: `
    LOWER(TRIM(sma.platform)) LIKE '%turkkitap%'
    OR LOWER(TRIM(sma.platform)) LIKE '%1000kitap%'
  `,
  kizlarsoruyor: `LOWER(TRIM(sma.platform)) LIKE '%kizlarsoruyor%'`,
  balatarin: `LOWER(TRIM(sma.platform)) LIKE '%balatarin%'`,
};

export function alphaaExtraPlatformSql(key: AlphaaExtraPlatformKey) {
  return ALPHAA_EXTRA_PLATFORM_SQL[key];
}

/** SELECT columns: one COUNT FILTER per extended ALPHAA platform. */
export function alphaaExtraPlatformCountColumns() {
  return ALPHAA_EXTRA_PLATFORM_KEYS.map(
    (key) =>
      `COUNT(sma.id) FILTER (WHERE ${ALPHAA_EXTRA_PLATFORM_SQL[key]})::text AS ${key}`
  ).join(",\n         ");
}
