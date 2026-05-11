"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import {
  PLATFORM_DAILY_TARGETS,
  PLATFORMS,
  type Metric,
  type Platform,
} from "@/lib/platform-config";
import type { SubmissionPayload } from "@/types/submissions";

const submissionPayloadSchema = z.object({
  notes: z.string().max(500).optional(),
  rows: z
    .array(
      z.object({
        account_id: z.number().int().positive(),
        followers: z.number().int().min(0).optional(),
        posts: z.number().int().min(0).optional(),
        retweets_with_content: z.number().int().min(0).optional(),
        replies: z.number().int().min(0).optional(),
        reels: z.number().int().min(0).optional(),
      })
    )
    .min(1),
});

function getTodayCairoDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function metricValue(row: SubmissionPayload["rows"][number], metric: Metric) {
  return row[metric] ?? 0;
}

export async function submitPlatformBatch(platform: Platform, payload: SubmissionPayload) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) return { ok: false, error: "Unauthorized." };
  if (!PLATFORMS.includes(platform)) return { ok: false, error: "Invalid platform." };

  const parsed = submissionPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Please review your numbers." };

  const rows = parsed.data.rows;
  const accountIds = [...new Set(rows.map((row) => row.account_id))];
  if (accountIds.length !== rows.length) {
    return { ok: false, error: "Duplicate accounts are not allowed." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owned = await client.query<{
      id: number;
      platform: Platform;
      current_followers: number;
    }>(
      `SELECT id, platform, current_followers
       FROM temp_social_media_accounts
       WHERE user_id = $1
         AND status = 'active'
         AND id = ANY($2::int[])`,
      [userId, accountIds]
    );

    if (owned.rowCount !== accountIds.length) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Some accounts do not belong to you." };
    }

    const accountById = new Map(owned.rows.map((account) => [account.id, account]));
    if (owned.rows.some((account) => account.platform !== platform)) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Some accounts do not match this platform." };
    }

    const todayCairoDate = getTodayCairoDate();
    const targets = PLATFORM_DAILY_TARGETS[platform];
    let inserted = 0;

    for (const row of rows) {
      const account = accountById.get(row.account_id);
      if (!account) continue;

      const followers = row.followers ?? account.current_followers;
      const insert = await client.query<{ social_media_account_id: number }>(
        `INSERT INTO temp_growth (
           user_id,
           social_media_account_id,
           submission_date,
           followers,
           posts,
           retweets_with_content,
           replies,
           reels,
           notes,
           target_followers,
           target_posts,
           target_retweets_with_content,
           target_replies,
           target_reels,
           is_auto_reset,
           submitted_at,
           qc_status
         ) VALUES (
           $1, $2, $3::date, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, FALSE, CURRENT_TIMESTAMP, 'pending'
         )
         ON CONFLICT (social_media_account_id, submission_date) DO NOTHING
         RETURNING social_media_account_id`,
        [
          userId,
          row.account_id,
          todayCairoDate,
          followers,
          metricValue(row, "posts"),
          metricValue(row, "retweets_with_content"),
          metricValue(row, "replies"),
          metricValue(row, "reels"),
          parsed.data.notes?.trim() || null,
          targets.posts ?? 0,
          targets.retweets_with_content ?? 0,
          targets.replies ?? 0,
          targets.reels ?? 0,
        ]
      );

      if (insert.rowCount === 0) continue;

      inserted += 1;
      await client.query(
        `UPDATE temp_social_media_accounts
         SET current_followers = $1
         WHERE id = $2 AND user_id = $3`,
        [followers, row.account_id, userId]
      );
    }

    await client.query("COMMIT");
    revalidatePath("/dashboard");
    return { ok: true, inserted, justSubmitted: platform };
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "Submission failed. Please try again." };
  } finally {
    client.release();
  }
}
