/** SQL fragments for classifying legacy social_media_accounts.platform values. */

export const ALPHAA_ACTIVE_ACCOUNT_WHERE = `
  sma.spare_acc = FALSE
  AND LOWER(TRIM(COALESCE(sma.acc_state, ''))) = 'active'
`;

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

export const ALPHAA_NORMALIZED_COUNTRY = `
  INITCAP(TRIM(COALESCE(sma.country, '')))
`;

export const ALPHAA_USER_COUNTRY = `
  INITCAP(TRIM(COALESCE(u.country, '')))
`;
