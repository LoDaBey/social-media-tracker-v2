/** SQL fragments for legacy social_media_accounts (TableCreations.sql). */

/** Same rule as ALPHAA sheet export — non-spare accounts only. */
export const ALPHAA_LEGACY_ACCOUNT_WHERE = `sma.spare_acc IS FALSE`;

export const ALPHAA_PLATFORM_IS_X = `
  (
    LOWER(TRIM(sma.platform)) IN ('twitter', 'x')
    OR LOWER(TRIM(sma.platform)) LIKE '%twitter%'
  )
`;

export const ALPHAA_PLATFORM_IS_FACEBOOK = `
  LOWER(TRIM(sma.platform)) IN ('facebook')
`;

export const ALPHAA_PLATFORM_IS_INSTAGRAM = `
  LOWER(TRIM(sma.platform)) IN ('instagram')
`;

export const ALPHAA_PLATFORM_IS_TIKTOK = `
  LOWER(TRIM(sma.platform)) IN ('tiktok')
`;

/** Country bucket for legacy accounts — INITCAP(TRIM(sma.country)). */
export const ALPHAA_LEGACY_COUNTRY = `
  INITCAP(TRIM(COALESCE(sma.country, '')))
`;
