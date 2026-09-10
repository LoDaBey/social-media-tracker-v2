/** Canonical country label from temp_users.country (matches plan names like "Sudan"). */
export const TEMP_USER_COUNTRY = `INITCAP(TRIM(COALESCE(u.country, '')))`;

export function tempUserCountryInList(paramIndex: number) {
  return `${TEMP_USER_COUNTRY} = ANY($${paramIndex}::text[])`;
}
