import { pool, query } from "@/lib/db";
import {
  addDaysToIsoDate,
  formatShortDate,
  getTodayCairoDate,
} from "@/lib/cairo-date";
import { createNotification } from "@/lib/notifications";
import { fetchOpAccessScope } from "@/lib/op-scope";
import { fetchDailyCheckMissed } from "@/lib/weekly-checks-data";

export const DAILY_CHECK_MISSED_TYPE = "daily_check_missed";

/** OP id → the day already handled, so polling the bell doesn't redo the work. */
const handled = new Map<number, string>();

/**
 * When an Operation Manager opens their notifications, add one notification per
 * Country Manager in their project/countries who left accounts unchecked yesterday
 * (a day ends at midnight Cairo time). Never twice for the same CM and day.
 * Never throws: notifications must still load.
 */
export async function ensureDailyCheckNotifications(
  opId: number,
): Promise<void> {
  const day = addDaysToIsoDate(getTodayCairoDate(), -1);
  if (handled.get(opId) === day) return;
  try {
    const scope = await fetchOpAccessScope(opId);
    if (!scope || scope.countries.length === 0) {
      handled.set(opId, day);
      return;
    }
    const missed = await fetchDailyCheckMissed(day, scope);
    if (missed.length > 0) {
      const existing = await query<{ manager_id: string | null }>(
        `SELECT metadata->>'managerId' AS manager_id
           FROM temp_notifications
          WHERE user_id = $1
            AND type = $2
            AND metadata->>'date' = $3`,
        [opId, DAILY_CHECK_MISSED_TYPE, day],
      );
      const done = new Set(existing.map((row) => row.manager_id));
      for (const item of missed) {
        if (done.has(String(item.managerId))) continue;
        await createNotification(pool, {
          user_id: opId,
          type: DAILY_CHECK_MISSED_TYPE,
          category: "checks",
          title: `${item.managerName}: ${item.unchecked} accounts not checked`,
          body: `${item.unchecked} of ${item.total} accounts were not checked on ${formatShortDate(day)}.`,
          action_route: `/admin/checks?manager=${item.managerId}&date=${day}`,
          metadata: {
            managerId: item.managerId,
            date: day,
            unchecked: item.unchecked,
            total: item.total,
          },
        });
      }
    }
    handled.set(opId, day);
  } catch (error) {
    console.error("daily check notifications failed", error);
  }
}
