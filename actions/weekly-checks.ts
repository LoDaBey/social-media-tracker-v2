"use server";

import { revalidatePath } from "next/cache";
import { pool, queryOne } from "@/lib/db";
import { getCairoWeekStart } from "@/lib/cairo-date";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import { requireManagerPermission } from "@/lib/manager-permissions";
import { logOrbitAction } from "@/lib/orbit-log";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import type { Platform } from "@/types/db";
import type { WeeklyCheckResult } from "@/types/weekly-checks";

/**
 * Country Manager's weekly check on one account: "ok" (still active, working, no
 * issues), "issue" (with a note), or null to undo this week's check.
 */
export async function setManagerWeeklyCheck(
  accountId: number,
  result: WeeklyCheckResult | null,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canUpdate",
    );
    if (!Number.isFinite(accountId)) return { error: "Invalid account." };
    if (result !== null && result !== "ok" && result !== "issue") {
      return { error: "Invalid check." };
    }
    const cleanNote = (note ?? "").trim().slice(0, 300);
    if (result === "issue" && !cleanNote) {
      return { error: "Write what is wrong with this account." };
    }

    const account = await queryOne<{
      user_id: number;
      platform: Platform;
      username: string | null;
      account_name: string;
      holder_name: string;
      country: string | null;
    }>(
      `SELECT a.user_id, a.platform, a.username, a.account_name,
              u.full_name AS holder_name, u.country
         FROM temp_social_media_accounts a
         JOIN temp_users u ON u.id = a.user_id
        WHERE a.id = $1`,
      [accountId],
    );
    if (!account) return { error: "Account not found." };
    const allowed = await assertManagerCanEditEmployee(
      managerId,
      account.user_id,
    );
    if (!allowed) return { error: "You can only check accounts on your team." };

    const weekStart = getCairoWeekStart();
    if (result === null) {
      await pool.query(
        `DELETE FROM temp_account_weekly_checks WHERE account_id = $1 AND week_start = $2::date`,
        [accountId, weekStart],
      );
    } else {
      await pool.query(
        `INSERT INTO temp_account_weekly_checks
           (account_id, week_start, result, note, checked_by, checked_at)
         VALUES ($1, $2::date, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (account_id, week_start) DO UPDATE
           SET result = EXCLUDED.result,
               note = EXCLUDED.note,
               checked_by = EXCLUDED.checked_by,
               checked_at = EXCLUDED.checked_at`,
        [
          accountId,
          weekStart,
          result,
          result === "issue" ? cleanNote : null,
          managerId,
        ],
      );
    }

    revalidatePath("/manager");
    revalidatePath("/admin/checks");
    const name = account.username || account.account_name;
    const platform = PLATFORM_LABELS[account.platform] ?? account.platform;
    await logOrbitAction({
      action: "update",
      resource: "account",
      summary:
        result === null
          ? `Undid weekly check on ${platform} ${name} (${account.holder_name})`
          : result === "ok"
            ? `Weekly check OK: ${platform} ${name} (${account.holder_name})`
            : `Weekly check problem: ${platform} ${name} (${account.holder_name})`,
      details: {
        result: result === null ? "Undone" : result === "ok" ? "OK" : "Problem",
        ...(result === "issue" ? { problem: cleanNote } : {}),
        holder: `${account.holder_name} (#${account.user_id})`,
        country: account.country ?? "—",
        platform,
        account: name,
        week: weekStart,
      },
    });
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
