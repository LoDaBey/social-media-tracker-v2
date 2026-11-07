/**
 * SQL fragments for Main (ALPHAA) accounts in Orbit tables.
 * Every query using these must alias temp_social_media_accounts as `sma`
 * and join temp_users as `u` (country and region live on the user).
 */

import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type { AlphaaExtraPlatformKey } from "@/types/admin";

/**
 * Main (ALPHAA) holders: temp_users in region 'Alphaa', plus people from other
 * projects who also hold Main accounts (main_country set, e.g. an Asia OP).
 */
export const ALPHAA_REGION_WHERE = `(u.region = 'Alphaa' OR NULLIF(TRIM(u.main_country), '') IS NOT NULL)`;

/** Same rule as ALPHAA sheet export — non-spare accounts only. */
export const ALPHAA_LEGACY_ACCOUNT_WHERE = `sma.is_spare IS FALSE`;

/** Live accounts only — matches extract “Active only”. */
export const ALPHAA_LEGACY_ACTIVE_WHERE = `sma.status = 'active'`;

/** Main region + non-spare + active — coverage and extract default. */
export const ALPHAA_COVERAGE_ACCOUNT_WHERE = `
  ${ALPHAA_REGION_WHERE}
  AND ${ALPHAA_LEGACY_ACCOUNT_WHERE}
  AND ${ALPHAA_LEGACY_ACTIVE_WHERE}
`;

export const ALPHAA_PLATFORM_IS_X = `sma.platform = 'x'`;

export const ALPHAA_PLATFORM_IS_FACEBOOK = `sma.platform IN ('facebook_personal', 'facebook_umbrella')`;

export const ALPHAA_PLATFORM_IS_FACEBOOK_UMBRELLA = `sma.platform = 'facebook_umbrella'`;

export const ALPHAA_PLATFORM_IS_FACEBOOK_PERSONAL = `sma.platform = 'facebook_personal'`;

export const ALPHAA_PLATFORM_IS_INSTAGRAM = `sma.platform = 'instagram'`;

export const ALPHAA_PLATFORM_IS_TIKTOK = `sma.platform = 'tiktok'`;

/** Country bucket for Main accounts — the Main country if set, else the holder's country. */
export const ALPHAA_LEGACY_COUNTRY = `
  INITCAP(TRIM(COALESCE(NULLIF(TRIM(u.main_country), ''), u.country, '')))
`;

export function alphaaExtraPlatformSql(key: AlphaaExtraPlatformKey) {
  return `sma.platform = '${key}'`;
}

/** SELECT columns: one COUNT FILTER per extended ALPHAA platform. */
export function alphaaExtraPlatformCountColumns() {
  return ALPHAA_EXTRA_PLATFORM_KEYS.map(
    (key) =>
      `COUNT(sma.id) FILTER (WHERE ${alphaaExtraPlatformSql(key)})::text AS ${key}`
  ).join(",\n         ");
}
