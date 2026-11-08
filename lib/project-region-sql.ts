/**
 * "Same project" checks. Sudan / Somalia (Africa + Main) and Palestine (Main + Asia)
 * sit in two projects, so a country alone never decides who belongs together:
 * the project (temp_users.region) must match too.
 */

/** temp_users.region → comparable key ('' when blank; Balkan = Europe). */
export function regionKeySql(column: string): string {
  return `(CASE WHEN LOWER(TRIM(COALESCE(${column}, ''))) = 'balkan' THEN 'europe'
               ELSE LOWER(TRIM(COALESCE(${column}, ''))) END)`;
}

/** True when both are in the same project (a blank project matches anything). */
export function sameProjectSql(a: string, b: string): string {
  const ka = regionKeySql(a);
  const kb = regionKeySql(b);
  return `(${ka} = ${kb} OR ${ka} = '' OR ${kb} = '')`;
}

/** Same rule in TypeScript. */
export function sameProject(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const key = (v: string | null | undefined) => {
    const s = v?.trim().toLowerCase() ?? "";
    return s === "balkan" ? "europe" : s;
  };
  const ka = key(a);
  const kb = key(b);
  return ka === kb || ka === "" || kb === "";
}
