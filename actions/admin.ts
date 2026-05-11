"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { PoolClient } from "pg";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import {
  addDaysToIsoDate,
  formatShortDate,
  getTodayCairoDate,
  normalizePgDateColumn,
  parseIsoDateUtc,
} from "@/lib/cairo-date";
import { LEVEL_LABELS, LEVEL_SALARY_PERCENT } from "@/lib/level-labels";
import { createNotification } from "@/lib/notifications";
import { recordBaseSalary, recordBonus, recordPayout } from "@/lib/wallet-events";
import type {
  CreateEmployeePayload,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeTargetsPayload,
} from "@/types/admin";
import type { Role } from "@/types/db";

const CYCLE_LENGTH_DAYS = 30;

async function requireAdminSession() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
  return { adminId };
}

function daysToPayoutForCycle(cycleStartStr: string | null): number {
  if (!cycleStartStr) return CYCLE_LENGTH_DAYS;
  const cycleEnd = addDaysToIsoDate(cycleStartStr.slice(0, 10), CYCLE_LENGTH_DAYS);
  const today = getTodayCairoDate();
  const diff = Math.floor(
    (parseIsoDateUtc(cycleEnd) - parseIsoDateUtc(today)) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, Math.min(CYCLE_LENGTH_DAYS, diff));
}

async function cycleNetBalance(
  client: PoolClient,
  userId: number,
  cycleStart: string
): Promise<number> {
  const r = await client.query<{ n: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS n
       FROM temp_wallet_transactions
      WHERE user_id = $1 AND cycle_start_date = $2::date`,
    [userId, cycleStart.slice(0, 10)]
  );
  return Number(r.rows[0]?.n ?? 0);
}

function revalidateAdminEmployee(userId: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/wallet");
  revalidatePath("/dashboard");
}

const createEmployeeSchema = z.object({
  full_name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(50).optional().nullable(),
  role: z.enum(["employee", "team_lead", "admin"]).optional(),
  team_lead_id: z.number().int().positive().nullable().optional(),
  base_salary: z.number().min(0).max(10_000_000).optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pay_cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  current_level: z.number().int().min(1).max(6).optional(),
});

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<{ id: number }> {
  await requireAdminSession();
  const p = createEmployeeSchema.parse(payload);
  const today = getTodayCairoDate();
  const password_hash = await bcrypt.hash(p.password, 10);
  const role: Role = p.role ?? "employee";
  const hire = p.hire_date ?? today;
  const cycleStart = p.pay_cycle_start_date ?? today;
  const baseSalary = p.base_salary ?? 0;
  const level = p.current_level ?? 2;
  let teamLeadId: number | null = p.team_lead_id ?? null;
  if (role === "team_lead" || role === "admin") teamLeadId = null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query<{ id: number }>(
      `INSERT INTO temp_users (
         full_name, email, password_hash, role, phone, is_active,
         team_lead_id, base_salary, hire_date, pay_cycle_start_date, current_level,
         target_x_count, target_facebook_personal_count, target_facebook_umbrella_count,
         target_instagram_count, target_tiktok_count
       ) VALUES (
         $1, $2, $3, $4, $5, TRUE,
         $6, $7, $8::date, $9::date, $10,
         0, 0, 0, 0, 0
       ) RETURNING id`,
      [
        p.full_name,
        p.email,
        password_hash,
        role,
        p.phone ?? null,
        teamLeadId,
        baseSalary,
        hire,
        cycleStart,
        level,
      ]
    );
    const id = ins.rows[0]?.id;
    if (!id) throw new Error("Insert failed.");

    await recordBaseSalary(client, {
      user_id: id,
      cycle_start_date: cycleStart.slice(0, 10),
      amount: baseSalary,
    });

    await client.query("COMMIT");
    revalidateAdminEmployee(id);
    return { id };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "23505"
    ) {
      throw new Error("Email already exists.");
    }
    throw e;
  } finally {
    client.release();
  }
}

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  phone: z
    .union([z.string(), z.null()])
    .transform((s) =>
      s == null || String(s).trim() === "" ? null : String(s).trim().slice(0, 50)
    ),
  role: z.enum(["employee", "team_lead", "admin"]),
  is_active: z.boolean(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  team_lead_id: z.number().int().positive().nullable(),
  base_salary: z.number().min(0).max(10_000_000),
  current_level: z.number().int().min(1).max(6),
  pay_cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function updateEmployeeProfile(
  user_id: number,
  payload: UpdateEmployeeProfilePayload
): Promise<void> {
  const { adminId } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  const p = updateProfileSchema.parse(payload);

  let teamLeadId = p.team_lead_id;
  if (p.role === "team_lead" || p.role === "admin") teamLeadId = null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const dup = await client.query(
      `SELECT 1 FROM temp_users WHERE email = $1 AND id <> $2 LIMIT 1`,
      [p.email, user_id]
    );
    if (dup.rowCount && dup.rowCount > 0) {
      throw new Error("Email already in use.");
    }

    const prevLevelRes = await client.query<{ current_level: number }>(
      `SELECT current_level FROM temp_users WHERE id = $1 FOR UPDATE`,
      [user_id]
    );
    const previousLevel = prevLevelRes.rows[0]?.current_level;

    await client.query(
      `UPDATE temp_users SET
         full_name = $1,
         email = $2,
         phone = $3,
         role = $4,
         is_active = $5,
         hire_date = $6::date,
         team_lead_id = $7,
         base_salary = $8,
         current_level = $9,
         pay_cycle_start_date = $10::date
       WHERE id = $11`,
      [
        p.full_name,
        p.email,
        p.phone,
        p.role,
        p.is_active,
        p.hire_date,
        teamLeadId,
        p.base_salary,
        p.current_level,
        p.pay_cycle_start_date,
        user_id,
      ]
    );

    if (
      previousLevel !== undefined &&
      previousLevel !== p.current_level
    ) {
      const label = LEVEL_LABELS[p.current_level] ?? String(p.current_level);
      const pct = LEVEL_SALARY_PERCENT[p.current_level] ?? "0%";
      await createNotification(client, {
        user_id,
        type: "level_changed",
        category: "admin",
        title: "Your level was updated",
        body: `You are now Level ${p.current_level} (${label}). Your salary adjustment is ${pct}.`,
        action_route: "/dashboard",
        metadata: { old_level: previousLevel, new_level: p.current_level },
        created_by: adminId,
      });
    }

    await client.query("COMMIT");
    revalidateAdminEmployee(user_id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

const targetsSchema = z.object({
  target_x_count: z.number().int().min(0).max(10_000),
  target_facebook_personal_count: z.number().int().min(0).max(10_000),
  target_facebook_umbrella_count: z.number().int().min(0).max(10_000),
  target_instagram_count: z.number().int().min(0).max(10_000),
  target_tiktok_count: z.number().int().min(0).max(10_000),
});

export async function updateEmployeeTargets(
  user_id: number,
  targets: UpdateEmployeeTargetsPayload
): Promise<void> {
  const { adminId } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  const t = targetsSchema.parse(targets);

  await pool.query(
    `UPDATE temp_users SET
       target_x_count = $1,
       target_facebook_personal_count = $2,
       target_facebook_umbrella_count = $3,
       target_instagram_count = $4,
       target_tiktok_count = $5
     WHERE id = $6`,
    [
      t.target_x_count,
      t.target_facebook_personal_count,
      t.target_facebook_umbrella_count,
      t.target_instagram_count,
      t.target_tiktok_count,
      user_id,
    ]
  );

  await createNotification(pool, {
    user_id,
    type: "targets_changed",
    category: "admin",
    title: "Account targets updated",
    body: "Your assigned accounts changed. Visit setup to add or archive accounts.",
    action_route: "/setup",
    metadata: {},
    created_by: adminId,
  });

  revalidateAdminEmployee(user_id);
}

const bonusSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  reason: z.string().trim().min(1).max(500),
});

export async function issueBonus(
  user_id: number,
  amount: number,
  reason: string
): Promise<void> {
  const { adminId } = await requireAdminSession();
  const b = bonusSchema.parse({ amount, reason });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await recordBonus(client, {
      user_id,
      amount: b.amount,
      reason: b.reason,
      created_by: adminId,
    });

    const amountRounded = Math.round(b.amount);
    await createNotification(client, {
      user_id,
      type: "bonus_received",
      category: "wallet",
      title: "Bonus received",
      body: `+${amountRounded} EGP · ${b.reason}. See it in your wallet.`,
      action_route: "/wallet",
      metadata: { amount: b.amount, reason: b.reason },
      created_by: adminId,
    });

    await client.query("COMMIT");
    revalidateAdminEmployee(user_id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function processPayout(
  userIds: number | number[],
  options?: { force?: boolean }
): Promise<{ processed: number }> {
  const { adminId } = await requireAdminSession();
  void adminId;
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const unique = [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))];
  if (unique.length === 0) throw new Error("No employees selected.");
  const force = options?.force === true;

  let processed = 0;
  for (const user_id of unique) {
    const client = await pool.connect();
    let committed = false;
    let payoutNet = 0;
    let cycleStartForNotify: string | null = null;
    try {
      await client.query("BEGIN");
      const lock = await client.query<{
        id: number;
        base_salary: string;
        pay_cycle_start_date: unknown;
      }>(
        `SELECT id, base_salary::text, pay_cycle_start_date
           FROM temp_users
          WHERE id = $1
          FOR UPDATE`,
        [user_id]
      );
      const user = lock.rows[0];
      if (!user) throw new Error(`User ${user_id} not found.`);

      const cycleStartStr = normalizePgDateColumn(user.pay_cycle_start_date);
      cycleStartForNotify = cycleStartStr;
      if (!cycleStartStr) {
        throw new Error(`${user_id}: missing pay_cycle_start_date.`);
      }

      const dtp = daysToPayoutForCycle(cycleStartStr);
      if (!force && dtp > 0) {
        throw new Error(
          `Payout not due for user ${user_id} (${dtp} days remaining). Use admin override to force.`
        );
      }

      const net = await cycleNetBalance(client, user_id, cycleStartStr);
      payoutNet = net;
      if (net > 0) {
        await recordPayout(client, {
          user_id,
          cycle_start_date: cycleStartStr.slice(0, 10),
          netAmount: net,
        });
      }

      const today = getTodayCairoDate();
      await client.query(
        `UPDATE temp_users SET pay_cycle_start_date = $1::date WHERE id = $2`,
        [today, user_id]
      );

      const salary = Number(user.base_salary);
      await recordBaseSalary(client, {
        user_id,
        cycle_start_date: today.slice(0, 10),
        amount: salary,
      });

      await client.query("COMMIT");
      committed = true;
      processed += 1;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    if (committed && cycleStartForNotify) {
      const cycleEndLabel = formatShortDate(
        addDaysToIsoDate(cycleStartForNotify.slice(0, 10), CYCLE_LENGTH_DAYS)
      );
      const netRounded = Math.round(payoutNet);
      await createNotification(pool, {
        user_id,
        type: "payout_processed",
        category: "wallet",
        title: "Payout for last cycle processed",
        body: `${netRounded} EGP for cycle ending ${cycleEndLabel} has been processed. A new cycle started today.`,
        action_route: "/wallet?tab=history",
        metadata: { net: payoutNet, cycle_start: cycleStartForNotify },
        created_by: adminId,
      }).catch(() => {});
      revalidateAdminEmployee(user_id);
    }
  }

  return { processed };
}
