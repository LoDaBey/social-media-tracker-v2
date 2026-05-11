import { query, queryOne } from "@/lib/db";
import {
  addDaysToIsoDate,
  compareIsoDates,
  formatShortDate,
  getTodayCairoDate,
  normalizePgDateColumn,
} from "@/lib/cairo-date";
import { getCairoMonthStartDate, getCairoNextMonthStartDate } from "@/lib/cairo-month";
import type {
  AdminEmployeeCycleStatus,
  AdminEmployeeListRow,
  AdminPayoutRow,
  AdminTeamLeadRow,
} from "@/types/admin";
import { computeWallet } from "@/lib/wallet";
import type { TempUser } from "@/types/db";

export type AdminOverviewKpis = {
  activeEmployees: number;
  pendingQc: number;
  deductionsThisMonth: number;
  autoResetsThisWeek: number;
};

export async function fetchAdminOverviewKpis(): Promise<AdminOverviewKpis> {
  const today = getTodayCairoDate();
  const weekStart = addDaysToIsoDate(today, -7);
  const monthStart = getCairoMonthStartDate(today);
  const monthEndExcl = getCairoNextMonthStartDate(today);

  const [activeRow, pendingRow, dedRow, resetRow] = await Promise.all([
    queryOne<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM temp_users WHERE role = 'employee' AND is_active = TRUE`
    ),
    queryOne<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM temp_growth WHERE qc_status = 'pending'`
    ),
    queryOne<{ t: string | null }>(
      `SELECT ABS(COALESCE(SUM(amount), 0))::text AS t
         FROM temp_wallet_transactions
        WHERE type = 'deduction'
          AND created_at::date >= $1::date
          AND created_at::date < $2::date`,
      [monthStart, monthEndExcl]
    ),
    queryOne<{ c: string }>(
      `SELECT COUNT(*)::text AS c
         FROM temp_growth
        WHERE is_auto_reset = TRUE
          AND submission_date::date >= $1::date`,
      [weekStart]
    ),
  ]);

  return {
    activeEmployees: Number(activeRow?.c ?? 0),
    pendingQc: Number(pendingRow?.c ?? 0),
    deductionsThisMonth: Number(dedRow?.t ?? 0),
    autoResetsThisWeek: Number(resetRow?.c ?? 0),
  };
}

export type AdminActivityFeedItem = {
  kind: string;
  created_at: string;
  description: string;
  actor_label: string;
};

export async function fetchAdminRecentActivity(): Promise<AdminActivityFeedItem[]> {
  const rows = await query<{
    kind: string;
    created_at: string;
    description: string;
    actor_label: string;
  }>(
    `SELECT * FROM (
       SELECT
         'submission'::text AS kind,
         g.submitted_at::text AS created_at,
         ('Submission: ' || a.account_name)::text AS description,
         u.full_name::text AS actor_label
         FROM temp_growth g
         JOIN temp_users u ON u.id = g.user_id
         JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
        WHERE g.submitted_at IS NOT NULL
       UNION ALL
       SELECT
         'approval',
         g.qc_reviewed_at::text,
         ('Approved: ' || a.account_name)::text,
         COALESCE(r.full_name, 'Reviewer')::text
         FROM temp_growth g
         JOIN temp_users u ON u.id = g.user_id
         JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
         LEFT JOIN temp_users r ON r.id = g.qc_reviewed_by
        WHERE g.qc_status = 'approved' AND g.qc_reviewed_at IS NOT NULL
       UNION ALL
       SELECT
         'rejection',
         g.qc_reviewed_at::text,
         ('Rejected: ' || a.account_name)::text,
         COALESCE(r.full_name, 'Reviewer')::text
         FROM temp_growth g
         JOIN temp_users u ON u.id = g.user_id
         JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
         LEFT JOIN temp_users r ON r.id = g.qc_reviewed_by
        WHERE g.qc_status IN ('rejected_with_deduction', 'rejected_no_deduction')
          AND g.qc_reviewed_at IS NOT NULL
       UNION ALL
       SELECT
         'bonus',
         twt.created_at::text,
         ('Manual bonus: ' || twt.reason)::text,
         COALESCE(c.full_name, 'Admin')::text
         FROM temp_wallet_transactions twt
         LEFT JOIN temp_users c ON c.id = twt.created_by
        WHERE twt.type = 'bonus' AND twt.created_by IS NOT NULL
     ) q
     WHERE q.created_at IS NOT NULL
     ORDER BY q.created_at DESC
     LIMIT 10`
  );

  return rows.map((r) => ({
    kind: r.kind,
    created_at: r.created_at,
    description: r.description,
    actor_label: r.actor_label,
  }));
}

export type AdminHealthMetrics = {
  avgQcTurnaroundHours: number | null;
  submissionCompletionRate: number | null;
  lastCronRunLabel: string | null;
};

export async function fetchAdminHealthMetrics(): Promise<AdminHealthMetrics> {
  const today = getTodayCairoDate();
  const sevenAgo = addDaysToIsoDate(today, -7);

  const [turnRow, rateRow, cronRow] = await Promise.all([
    queryOne<{ h: string | null }>(
      `SELECT EXTRACT(EPOCH FROM AVG(g.qc_reviewed_at - g.submitted_at)) / 3600 AS h
         FROM temp_growth g
        WHERE g.qc_status = 'approved'
          AND g.submitted_at IS NOT NULL
          AND g.qc_reviewed_at IS NOT NULL
          AND g.qc_reviewed_at::date >= $1::date`,
      [sevenAgo]
    ),
    queryOne<{ done: string; tot: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE qc_status <> 'pending')::text AS done,
         COUNT(*)::text AS tot
         FROM temp_growth
        WHERE submission_date::date >= $1::date`,
      [sevenAgo]
    ),
    queryOne<{ ts: string | null }>(
      `SELECT MAX(created_at)::text AS ts FROM temp_growth WHERE is_auto_reset = TRUE`
    ),
  ]);

  const tot = Number(rateRow?.tot ?? 0);
  const done = Number(rateRow?.done ?? 0);
  const rate = tot > 0 ? done / tot : null;
  const h = turnRow?.h != null ? Number(turnRow.h) : null;

  return {
    avgQcTurnaroundHours: h != null && Number.isFinite(h) ? h : null,
    submissionCompletionRate: rate,
    lastCronRunLabel:
      cronRow?.ts != null ? formatShortDate(cronRow.ts) : null,
  };
}

function mapCycleStatus(
  payCycle: string | null,
  todayCairo: string
): AdminEmployeeCycleStatus {
  if (!payCycle) return "pending";
  const end = addDaysToIsoDate(payCycle.slice(0, 10), 30);
  if (compareIsoDates(end, todayCairo) > 0) return "mid-cycle";
  return "payable";
}

export type AdminEmployeeListFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  teamLeadId?: number | null;
};

export async function fetchAdminEmployeesList(
  filters: AdminEmployeeListFilters
): Promise<AdminEmployeeListRow[]> {
  const today = getTodayCairoDate();
  const q = filters.q?.trim() ?? "";
  const status = filters.status ?? "all";
  const teamLeadId = filters.teamLeadId;

  const params: unknown[] = [];
  const where: string[] = [`u.role = 'employee'`];

  if (q) {
    params.push(`%${q}%`);
    where.push(
      `(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    );
  }
  if (status === "active") where.push(`u.is_active = TRUE`);
  if (status === "inactive") where.push(`u.is_active = FALSE`);
  if (teamLeadId != null && Number.isFinite(teamLeadId)) {
    params.push(teamLeadId);
    where.push(`u.team_lead_id = $${params.length}`);
  }

  const sql = `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_active,
      u.team_lead_id,
      tl.full_name AS team_lead_name,
      u.current_level,
      (u.target_x_count + u.target_facebook_personal_count + u.target_facebook_umbrella_count
        + u.target_instagram_count + u.target_tiktok_count)::int AS target_accounts_sum,
      u.pay_cycle_start_date::text AS pay_cycle_start_date
    FROM temp_users u
    LEFT JOIN temp_users tl ON tl.id = u.team_lead_id
    WHERE ${where.join(" AND ")}
    ORDER BY u.full_name ASC
  `;

  const rows = await query<{
    id: number;
    full_name: string;
    email: string;
    role: AdminEmployeeListRow["role"];
    is_active: boolean;
    team_lead_id: number | null;
    team_lead_name: string | null;
    current_level: number;
    target_accounts_sum: number;
    pay_cycle_start_date: string | null;
  }>(sql, params);

  return rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    role: r.role,
    is_active: r.is_active,
    team_lead_id: r.team_lead_id,
    team_lead_name: r.team_lead_name,
    current_level: r.current_level,
    target_accounts_sum: r.target_accounts_sum,
    cycle_status: mapCycleStatus(r.pay_cycle_start_date, today),
  }));
}

export async function fetchAdminTeamLeads(): Promise<AdminTeamLeadRow[]> {
  return query<AdminTeamLeadRow>(
    `SELECT
        u.id,
        u.full_name,
        u.email,
        u.is_active,
        (SELECT COUNT(*)::int FROM temp_users e
          WHERE e.team_lead_id = u.id AND e.role = 'employee') AS employee_count
       FROM temp_users u
      WHERE u.role = 'team_lead'
      ORDER BY u.full_name ASC`
  );
}

export async function fetchTeamLeadOptions(): Promise<
  { id: number; full_name: string }[]
> {
  return query(
    `SELECT id, full_name FROM temp_users WHERE role = 'team_lead' AND is_active = TRUE ORDER BY full_name`
  );
}

export async function fetchAdminPayoutRows(): Promise<AdminPayoutRow[]> {
  const users = await query<TempUser>(
    `SELECT * FROM temp_users WHERE role = 'employee' AND is_active = TRUE ORDER BY full_name`
  );

  const today = getTodayCairoDate();
  const rows: AdminPayoutRow[] = [];
  for (const u of users) {
    const w = await computeWallet(u);
    const start = normalizePgDateColumn(u.pay_cycle_start_date);
    const cycleEnd = start ? addDaysToIsoDate(start, 30) : null;
    const pastEnd = cycleEnd != null && compareIsoDates(today, cycleEnd) > 0;

    let status: AdminPayoutRow["status"] = "Mid-cycle";
    if (pastEnd) status = "Overdue";
    else if (w.daysToPayout <= 0) status = "Ready to pay";

    rows.push({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      net_balance: w.netBalance,
      days_to_payout: w.daysToPayout,
      status,
    });
  }
  return rows;
}

export type PlatformAccountCount = {
  platform: string;
  cnt: number;
};

export async function fetchActiveAccountCountsByPlatform(
  userId: number
): Promise<Record<string, number>> {
  const rows = await query<PlatformAccountCount>(
    `SELECT platform::text, COUNT(*)::int AS cnt
       FROM temp_social_media_accounts
      WHERE user_id = $1 AND status = 'active'
      GROUP BY platform`,
    [userId]
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.platform] = r.cnt;
  return out;
}

export type EmployeeActivityItem = {
  kind: string;
  created_at: string;
  description: string;
};

export async function fetchEmployeeActivityTimeline(
  userId: number
): Promise<EmployeeActivityItem[]> {
  return query(
    `SELECT * FROM (
       SELECT
         'submission'::text AS kind,
         g.submitted_at::text AS created_at,
         ('Submission: ' || a.account_name)::text AS description
         FROM temp_growth g
         JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
        WHERE g.user_id = $1 AND g.submitted_at IS NOT NULL
       UNION ALL
       SELECT
         'qc',
         g.qc_reviewed_at::text,
         (CASE g.qc_status
            WHEN 'approved' THEN 'Approved: '
            WHEN 'rejected_with_deduction' THEN 'Rejected (deduction): '
            WHEN 'rejected_no_deduction' THEN 'Rejected: '
            ELSE 'QC update: '
          END || a.account_name)::text
         FROM temp_growth g
         JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
        WHERE g.user_id = $1 AND g.qc_reviewed_at IS NOT NULL
       UNION ALL
       SELECT
         twt.type::text,
         twt.created_at::text,
         (CASE twt.type
            WHEN 'bonus' THEN 'Bonus: ' || twt.reason
            WHEN 'payout' THEN 'Payout (cycle closed)'
            WHEN 'deduction' THEN 'Deduction: ' || twt.reason
            WHEN 'base_salary' THEN 'Base salary credit'
            WHEN 'level_adjustment' THEN twt.reason
            ELSE twt.reason
          END)::text
         FROM temp_wallet_transactions twt
        WHERE twt.user_id = $1
     ) q
     WHERE q.created_at IS NOT NULL
     ORDER BY q.created_at DESC
     LIMIT 80`,
    [userId]
  );
}
