import { query, queryOne } from "@/lib/db";
import { getTodayCairoDate } from "@/lib/cairo-date";
import type { Platform } from "@/types/db";
import type {
  QcKpis,
  QcQueueRow,
  QcReviewerRole,
  QcSearchParams,
  QcStatusGroup,
} from "@/types/qc";

const STATUS_GROUP_TO_DB: Record<QcStatusGroup, string[]> = {
  pending: ["pending"],
  approved: ["approved"],
  rejected: ["rejected_with_deduction", "rejected_no_deduction"],
};

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toNullableIsoString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeRow(row: QcQueueRow): QcQueueRow {
  return {
    ...row,
    submission_date: toIsoString(row.submission_date).slice(0, 10),
    submitted_at: toNullableIsoString(row.submitted_at),
    qc_reviewed_at: toNullableIsoString(row.qc_reviewed_at),
    created_at: toIsoString(row.created_at),
  };
}

export async function fetchQcQueue(args: {
  reviewerId: number;
  reviewerRole: QcReviewerRole;
  params: QcSearchParams;
}): Promise<QcQueueRow[]> {
  const { reviewerId, reviewerRole, params } = args;
  const statuses = STATUS_GROUP_TO_DB[params.status];

  const conditions: string[] = ["g.qc_status = ANY($1::text[])"];
  const values: unknown[] = [statuses];

  if (reviewerRole === "team_lead") {
    values.push(reviewerId);
    conditions.push(`u.team_lead_id = $${values.length}`);
  }

  if (params.platform) {
    values.push(params.platform);
    conditions.push(`a.platform = $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q.toLowerCase()}%`);
    const idx = values.length;
    conditions.push(
      `(LOWER(a.account_name) LIKE $${idx} OR LOWER(COALESCE(a.account_handle, '')) LIKE $${idx} OR LOWER(u.full_name) LIKE $${idx})`
    );
  }

  const sql = `
    SELECT
      g.id                       AS growth_id,
      g.user_id                  AS user_id,
      u.full_name                AS employee_full_name,
      g.social_media_account_id  AS social_media_account_id,
      a.platform                 AS account_platform,
      a.account_name             AS account_name,
      a.account_handle           AS account_handle,
      a.account_url              AS account_url,
      g.submission_date          AS submission_date,
      g.followers                AS followers,
      g.posts                    AS posts,
      g.retweets_with_content    AS retweets_with_content,
      g.replies                  AS replies,
      g.reels                    AS reels,
      g.target_followers         AS target_followers,
      g.target_posts             AS target_posts,
      g.target_retweets_with_content AS target_retweets_with_content,
      g.target_replies           AS target_replies,
      g.target_reels             AS target_reels,
      g.notes                    AS notes,
      g.is_auto_reset            AS is_auto_reset,
      g.qc_status                AS qc_status,
      g.qc_decision_amount       AS qc_decision_amount,
      g.qc_comment               AS qc_comment,
      g.qc_reviewed_by           AS qc_reviewed_by,
      g.qc_reviewed_at           AS qc_reviewed_at,
      g.submitted_at             AS submitted_at,
      g.created_at               AS created_at
    FROM temp_growth g
    JOIN temp_users u ON u.id = g.user_id
    JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY COALESCE(g.submitted_at, g.created_at) DESC, g.id DESC
    LIMIT 200
  `;

  const rows = await query<QcQueueRow>(sql, values);
  return rows.map(normalizeRow);
}

export async function fetchQcKpis(args: {
  reviewerId: number;
  reviewerRole: QcReviewerRole;
}): Promise<QcKpis> {
  const { reviewerId, reviewerRole } = args;
  const todayCairo = getTodayCairoDate();

  const scopeJoin = `JOIN temp_users u ON u.id = g.user_id`;
  const scopeFilter = reviewerRole === "team_lead" ? `AND u.team_lead_id = $1` : "";
  const scopeParams = reviewerRole === "team_lead" ? [reviewerId] : [];

  const pendingRow = await queryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM temp_growth g
       ${scopeJoin}
      WHERE g.qc_status = 'pending'
        ${scopeFilter}`,
    scopeParams
  );

  const reviewedRow = await queryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM temp_growth g
      WHERE g.qc_reviewed_by = $1
        AND (g.qc_reviewed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo')::date = $2::date`,
    [reviewerId, todayCairo]
  );

  const ratesParams = reviewerRole === "team_lead" ? [reviewerId] : [];
  const ratesRow = await queryOne<{ rejected: string; non_pending: string }>(
    `SELECT
        SUM(CASE WHEN g.qc_status IN ('rejected_with_deduction','rejected_no_deduction') THEN 1 ELSE 0 END)::text AS rejected,
        SUM(CASE WHEN g.qc_status <> 'pending' THEN 1 ELSE 0 END)::text AS non_pending
      FROM temp_growth g
      ${scopeJoin}
     WHERE g.qc_reviewed_at >= NOW() - INTERVAL '30 days'
       ${scopeFilter}`,
    ratesParams
  );

  const rejected = Number(ratesRow?.rejected ?? 0);
  const nonPending = Number(ratesRow?.non_pending ?? 0);
  const rejectionRatePct =
    nonPending > 0 ? Math.round((rejected / nonPending) * 1000) / 10 : 0;

  return {
    pendingCount: Number(pendingRow?.c ?? 0),
    reviewedTodayCount: Number(reviewedRow?.c ?? 0),
    rejectionRatePct,
  };
}

export async function fetchPendingCountForReviewer(
  reviewerId: number,
  reviewerRole: QcReviewerRole
): Promise<number> {
  const scopeFilter =
    reviewerRole === "team_lead" ? `AND u.team_lead_id = $1` : "";
  const scopeParams = reviewerRole === "team_lead" ? [reviewerId] : [];

  const row = await queryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM temp_growth g
       JOIN temp_users u ON u.id = g.user_id
      WHERE g.qc_status = 'pending'
        ${scopeFilter}`,
    scopeParams
  );

  return Number(row?.c ?? 0);
}

export function parseQcSearchParams(input: {
  selected?: string;
  status?: string;
  platform?: string;
  q?: string;
}): QcSearchParams {
  const ALLOWED_STATUS: QcStatusGroup[] = ["pending", "approved", "rejected"];
  const ALLOWED_PLATFORMS: Platform[] = [
    "x",
    "facebook_personal",
    "facebook_umbrella",
    "instagram",
    "tiktok",
  ];

  const status =
    input.status && (ALLOWED_STATUS as string[]).includes(input.status)
      ? (input.status as QcStatusGroup)
      : "pending";

  const platform =
    input.platform && (ALLOWED_PLATFORMS as string[]).includes(input.platform)
      ? (input.platform as Platform)
      : undefined;

  const selectedNum = input.selected ? Number(input.selected) : NaN;
  const selected = Number.isFinite(selectedNum) && selectedNum > 0 ? selectedNum : undefined;

  const q = input.q?.trim() ? input.q.trim() : undefined;

  return { selected, status, platform, q };
}
