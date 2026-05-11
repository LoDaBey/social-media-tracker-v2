"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { recordDeduction } from "@/lib/wallet-events";
import { formatShortDate } from "@/lib/cairo-date";
import type { Role } from "@/types/db";
import type { QcDecisionResult } from "@/types/qc";

function submissionAccountLabel(handle: string | null, accountName: string) {
  return handle?.trim() ? (handle.startsWith("@") ? handle : `@${handle}`) : `@${accountName}`;
}

const QC_ROLES: Role[] = ["team_lead", "admin"];

const growthIdSchema = z.number().int().positive();
const commentSchema = z.string().trim().max(1000).optional();
const amountSchema = z.number().positive().max(1_000_000);

type LockedGrowth = {
  id: number;
  user_id: number;
  social_media_account_id: number;
  qc_status: string;
  team_lead_id: number | null;
  account_handle: string | null;
  account_name: string;
  submission_date: string;
};

async function ensureReviewerSession() {
  const session = await auth();
  const reviewerId = Number(session?.user?.id);
  const role = (session?.user?.role ?? "") as Role;

  if (!Number.isFinite(reviewerId) || !QC_ROLES.includes(role)) {
    throw new Error("Unauthorized — only team leads or admins can review submissions.");
  }
  return { reviewerId, role };
}

async function lockPendingGrowthRow(
  client: import("pg").PoolClient,
  growthId: number,
  reviewerId: number,
  reviewerRole: Role
): Promise<LockedGrowth> {
  const res = await client.query<LockedGrowth>(
    `SELECT
        g.id,
        g.user_id,
        g.social_media_account_id,
        g.qc_status,
        g.submission_date::date::text AS submission_date,
        u.team_lead_id,
        a.account_handle,
        a.account_name
       FROM temp_growth g
       JOIN temp_users u ON u.id = g.user_id
       JOIN temp_social_media_accounts a ON a.id = g.social_media_account_id
      WHERE g.id = $1
      FOR UPDATE OF g`,
    [growthId]
  );

  const row = res.rows[0];
  if (!row) throw new Error("Submission not found.");

  if (reviewerRole === "team_lead" && row.team_lead_id !== reviewerId) {
    throw new Error("This submission is not assigned to you.");
  }

  if (row.qc_status !== "pending") {
    throw new Error("This submission has already been reviewed.");
  }

  return row;
}

function formatRejectionReason(handle: string | null, name: string, submissionDate: string) {
  const dateLabel = formatShortDate(submissionDate);
  const who = handle ?? `@${name}`;
  return `Rejected · ${who} · ${dateLabel}`;
}

function revalidateQcPaths() {
  revalidatePath("/qc");
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
}

export async function approveSubmission(
  growthId: number,
  comment?: string
): Promise<QcDecisionResult> {
  const id = growthIdSchema.parse(growthId);
  const trimmedComment = commentSchema.parse(comment) ?? null;

  const { reviewerId, role } = await ensureReviewerSession();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await lockPendingGrowthRow(client, id, reviewerId, role);

    await client.query(
      `UPDATE temp_growth
          SET qc_status     = 'approved',
              qc_decision_amount = 0,
              qc_comment    = $2,
              qc_reviewed_by = $3,
              qc_reviewed_at = NOW(),
              updated_at     = NOW()
        WHERE id = $1`,
      [id, trimmedComment, reviewerId]
    );

    const qcRow = await client.query<{ full_name: string }>(
      `SELECT full_name FROM temp_users WHERE id = $1`,
      [reviewerId]
    );
    const qcName = qcRow.rows[0]?.full_name ?? "Reviewer";
    const who = submissionAccountLabel(locked.account_handle, locked.account_name);
    const dateLabel = formatShortDate(locked.submission_date);

    await createNotification(client, {
      user_id: locked.user_id,
      type: "submission_approved",
      category: "qc",
      title: "Your submission was approved",
      body: `${who} · ${dateLabel} · ${qcName} approved your numbers.`,
      action_route: "/dashboard",
      metadata: { growth_id: id },
      created_by: reviewerId,
    });

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidateQcPaths();
  return { ok: true, growthId: id };
}

export async function rejectWithDeduction(
  growthId: number,
  amount: number,
  comment?: string
): Promise<QcDecisionResult> {
  const id = growthIdSchema.parse(growthId);
  const cleanAmount = amountSchema.parse(amount);
  const trimmedComment = commentSchema.parse(comment) ?? null;

  const { reviewerId, role } = await ensureReviewerSession();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await lockPendingGrowthRow(client, id, reviewerId, role);

    await client.query(
      `UPDATE temp_growth
          SET qc_status         = 'rejected_with_deduction',
              qc_decision_amount = $2,
              qc_comment        = $3,
              qc_reviewed_by    = $4,
              qc_reviewed_at    = NOW(),
              updated_at        = NOW()
        WHERE id = $1`,
      [id, cleanAmount, trimmedComment, reviewerId]
    );

    const deductionTxId = await recordDeduction(client, {
      user_id: locked.user_id,
      growth_id: id,
      amount: cleanAmount,
      reason: formatRejectionReason(
        locked.account_handle,
        locked.account_name,
        locked.submission_date
      ),
      created_by: reviewerId,
    });

    const who = submissionAccountLabel(locked.account_handle, locked.account_name);
    const dateLabel = formatShortDate(locked.submission_date);
    const amountRounded = Math.round(cleanAmount);
    const highlight =
      deductionTxId != null ? `/wallet?highlight=${deductionTxId}` : "/wallet";

    await createNotification(client, {
      user_id: locked.user_id,
      type: "submission_rejected",
      category: "qc",
      title: "Submission rejected — deduction applied",
      body: `${who} · ${dateLabel} · −${amountRounded} EGP. Open your wallet to see the entry.`,
      action_route: highlight,
      metadata: { growth_id: id, amount: cleanAmount },
      created_by: reviewerId,
    });

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidateQcPaths();
  return { ok: true, growthId: id };
}

export async function rejectNoDeduction(
  growthId: number,
  comment?: string
): Promise<QcDecisionResult> {
  const id = growthIdSchema.parse(growthId);
  const trimmedComment = commentSchema.parse(comment) ?? null;

  const { reviewerId, role } = await ensureReviewerSession();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await lockPendingGrowthRow(client, id, reviewerId, role);

    await client.query(
      `UPDATE temp_growth
          SET qc_status         = 'rejected_no_deduction',
              qc_decision_amount = 0,
              qc_comment        = $2,
              qc_reviewed_by    = $3,
              qc_reviewed_at    = NOW(),
              updated_at        = NOW()
        WHERE id = $1`,
      [id, trimmedComment, reviewerId]
    );

    const who = submissionAccountLabel(locked.account_handle, locked.account_name);
    const dateLabel = formatShortDate(locked.submission_date);

    await createNotification(client, {
      user_id: locked.user_id,
      type: "submission_rejected",
      category: "qc",
      title: "Submission rejected — no deduction",
      body: `${who} · ${dateLabel} · Please recheck the numbers next time.`,
      action_route: "/dashboard",
      metadata: { growth_id: id, no_deduction: true },
      created_by: reviewerId,
    });

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidateQcPaths();
  return { ok: true, growthId: id };
}
