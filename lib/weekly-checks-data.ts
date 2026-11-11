import { query } from "@/lib/db";
import { getCairoWeekEnd, getCairoWeekStart } from "@/lib/cairo-date";
import { sameProjectSql } from "@/lib/project-region-sql";
import type { OpAccessScope } from "@/types/admin";
import type {
  AdminWeeklyChecksData,
  AdminWeeklyChecksFilters,
  WeeklyCheck,
  WeeklyCheckAccountRow,
  WeeklyCheckFilter,
  WeeklyCheckManagerProgress,
} from "@/types/weekly-checks";
import type { Platform } from "@/types/db";

/** Most rows the admin list shows at once (KPIs always count everything). */
const ADMIN_ROW_LIMIT = 500;

export function parseWeeklyCheckFilter(
  value: string | undefined,
): WeeklyCheckFilter {
  return value === "issue" ||
    value === "changed" ||
    value === "ok" ||
    value === "all"
    ? value
    : "unchecked";
}

type CheckRow = {
  account_id: number;
  result: "ok" | "issue";
  note: string | null;
  checked_at: Date | string;
  checked_by_name: string | null;
};

function toCheck(row: {
  result: "ok" | "issue" | null;
  note: string | null;
  checked_at: Date | string | null;
  checked_by_name: string | null;
}): WeeklyCheck | null {
  if (!row.result || !row.checked_at) return null;
  return {
    result: row.result,
    note: row.note,
    checkedAt: new Date(row.checked_at).toISOString(),
    checkedByName: row.checked_by_name,
  };
}

/** This week's checks for these accounts (missing = not checked yet). */
export async function fetchWeeklyChecksForAccounts(
  accountIds: number[],
  weekStart: string = getCairoWeekStart(),
): Promise<Map<number, WeeklyCheck>> {
  const map = new Map<number, WeeklyCheck>();
  if (!accountIds.length) return map;
  try {
    const rows = await query<CheckRow>(
      `SELECT c.account_id, c.result, c.note, c.checked_at, u.full_name AS checked_by_name
         FROM temp_account_weekly_checks c
         LEFT JOIN temp_users u ON u.id = c.checked_by
        WHERE c.week_start = $1::date
          AND c.account_id = ANY($2::int[])`,
      [weekStart, accountIds],
    );
    for (const row of rows) {
      const check = toCheck(row);
      if (check) map.set(row.account_id, check);
    }
  } catch {
    // Table not there yet (migration 0026): everything shows as not checked.
  }
  return map;
}

type AdminRow = {
  account_id: number;
  platform: Platform;
  username: string | null;
  account_name: string;
  account_url: string | null;
  status: string;
  holder_id: number;
  holder_name: string;
  country: string | null;
  region: string | null;
  manager_id: number | null;
  manager_name: string | null;
  changed: boolean;
  result: "ok" | "issue" | null;
  note: string | null;
  checked_at: Date | string | null;
  checked_by_name: string | null;
};

/**
 * Every account of an active employee, with this week's check. Operation Managers
 * only see their own project and countries.
 */
export async function fetchAdminWeeklyChecks(
  filters: AdminWeeklyChecksFilters,
  scope: OpAccessScope | null,
): Promise<AdminWeeklyChecksData> {
  const weekStart = getCairoWeekStart();
  const values: unknown[] = [weekStart];
  const where: string[] = [
    "u.role = 'employee'",
    "u.is_active = TRUE",
    "COALESCE(u.employment_status, 'active') <> 'deactivated'",
  ];
  if (scope) {
    values.push(scope.countries);
    where.push(`u.country = ANY($${values.length}::text[])`);
    values.push(scope.region);
    where.push(sameProjectSql("u.region", `$${values.length}::text`));
  }

  const rows = await query<AdminRow>(
    `SELECT a.id AS account_id,
            a.platform,
            a.username,
            a.account_name,
            a.account_url,
            a.status,
            u.id AS holder_id,
            u.full_name AS holder_name,
            u.country,
            u.region,
            cm.id AS manager_id,
            cm.full_name AS manager_name,
            (a.created_at >= $1::date OR a.updated_at >= $1::date) AS changed,
            c.result,
            c.note,
            c.checked_at,
            chk.full_name AS checked_by_name
       FROM temp_social_media_accounts a
       JOIN temp_users u ON u.id = a.user_id
       LEFT JOIN temp_users tl ON tl.id = u.team_lead_id AND tl.role = 'team_lead'
       -- No manager on the profile (or a team lead without one): the CM who covers
       -- this country in the same project sees them on their page, so count them there.
       LEFT JOIN LATERAL (
         SELECT m.id
           FROM temp_manager_countries mc
           JOIN temp_users m ON m.id = mc.user_id
          WHERE m.role = 'manager'
            AND m.is_active = TRUE
            AND mc.country = u.country
            AND ${sameProjectSql("m.region", "u.region")}
          ORDER BY m.id ASC
          LIMIT 1
       ) covering ON u.manager_id IS NULL AND tl.manager_id IS NULL
       LEFT JOIN temp_users cm ON cm.id = COALESCE(u.manager_id, tl.manager_id, covering.id)
       LEFT JOIN temp_account_weekly_checks c
              ON c.account_id = a.id AND c.week_start = $1::date
       LEFT JOIN temp_users chk ON chk.id = c.checked_by
      WHERE ${where.join(" AND ")}
      ORDER BY u.country ASC NULLS LAST, u.full_name ASC, a.platform ASC, a.id ASC`,
    values,
  );

  const kpis = {
    total: rows.length,
    ok: 0,
    issue: 0,
    unchecked: 0,
    changed: 0,
  };
  const byManager = new Map<string, WeeklyCheckManagerProgress>();
  const countries = new Set<string>();
  for (const row of rows) {
    if (row.result === "ok") kpis.ok += 1;
    else if (row.result === "issue") kpis.issue += 1;
    else kpis.unchecked += 1;
    if (row.changed) kpis.changed += 1;
    if (row.country) countries.add(row.country);

    const key = String(row.manager_id ?? "none");
    const progress = byManager.get(key) ?? {
      managerId: row.manager_id,
      managerName: row.manager_name ?? "No Country Manager",
      total: 0,
      checked: 0,
      issue: 0,
    };
    progress.total += 1;
    if (row.result) progress.checked += 1;
    if (row.result === "issue") progress.issue += 1;
    byManager.set(key, progress);
  }

  const q = filters.q.trim().toLowerCase();
  const matchingRows = rows.filter((row) => {
    if (filters.country && row.country !== filters.country) return false;
    if (filters.filter === "unchecked" && row.result) return false;
    if (filters.filter === "issue" && row.result !== "issue") return false;
    if (filters.filter === "ok" && row.result !== "ok") return false;
    if (filters.filter === "changed" && !row.changed) return false;
    if (q) {
      const hay = [
        row.holder_name,
        row.username,
        row.account_name,
        row.manager_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const list: WeeklyCheckAccountRow[] = matchingRows
    .slice(0, ADMIN_ROW_LIMIT)
    .map((row) => ({
      accountId: row.account_id,
      platform: row.platform,
      username: row.username,
      accountName: row.account_name,
      accountUrl: row.account_url,
      status: row.status,
      holderId: row.holder_id,
      holderName: row.holder_name,
      country: row.country,
      region: row.region,
      managerName: row.manager_name,
      changedThisWeek: Boolean(row.changed),
      check: toCheck(row),
    }));

  return {
    weekStart,
    weekEnd: getCairoWeekEnd(weekStart),
    kpis,
    managers: [...byManager.values()].sort(
      (a, b) => b.total - b.checked - (a.total - a.checked),
    ),
    rows: list,
    matching: matchingRows.length,
    countries: [...countries].sort((a, b) => a.localeCompare(b)),
  };
}
