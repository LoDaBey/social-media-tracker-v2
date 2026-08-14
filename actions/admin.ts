"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { PoolClient } from "pg";
import { auth } from "@/auth";
import { pool, queryOne } from "@/lib/db";
import {
  addDaysToIsoDate,
  formatShortDate,
  getTodayCairoDate,
  normalizePgDateColumn,
  parseIsoDateUtc,
} from "@/lib/cairo-date";
import { LEVEL_LABELS, LEVEL_SALARY_PERCENT } from "@/lib/level-labels";
import { createNotification } from "@/lib/notifications";
import { fetchAdminEmployeeEditorBundle } from "@/lib/admin-data";
import { SETUP_COUNTRIES, SETUP_REGION } from "@/lib/setup-options";
import { recordBaseSalary, recordBonus, recordPayout } from "@/lib/wallet-events";
import type {
  AdminEmployeeEditorBundle,
  CreateEmployeePayload,
  CreateEmployeeResult,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeTargetsPayload,
} from "@/types/admin";
import type { Role } from "@/types/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";

const CYCLE_LENGTH_DAYS = 30;

const setupCountrySchema = z
  .string()
  .trim()
  .min(1, "Select a country.")
  .refine(
    (value) => (SETUP_COUNTRIES as readonly string[]).includes(value),
    "Select a valid country."
  );

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

const managerCountriesSchema = z
  .array(setupCountrySchema)
  .min(1, "Select at least one country for this manager.");

const createEmployeeSchema = z
  .object({
    full_name: z.string().trim().min(1, "Enter a full name.").max(255),
    email: z.string().trim().email("Enter a valid email.").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long."),
    phone: z.string().trim().max(50).optional().nullable(),
    role: z.enum(["employee", "team_lead", "admin", "manager"]).optional(),
    team_lead_id: z.number().int().positive().nullable().optional(),
    manager_id: z.number().int().positive().nullable().optional(),
    manager_countries: z.array(z.string()).optional(),
    base_salary: z.number().min(0).max(10_000_000).optional(),
    hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    pay_cycle_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    current_level: z.number().int().min(1).max(6).optional(),
    country: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const role = data.role ?? "employee";
    if (role === "manager") return;
    const country = data.country?.trim() ?? "";
    if (!country) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Select a country.",
      });
      return;
    }
    if (!(SETUP_COUNTRIES as readonly string[]).includes(country)) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Select a valid country.",
      });
    }
  });

async function replaceManagerCountries(
  client: PoolClient,
  userId: number,
  countries: string[]
) {
  await client.query(`DELETE FROM temp_manager_countries WHERE user_id = $1`, [
    userId,
  ]);
  for (const country of countries) {
    await client.query(
      `INSERT INTO temp_manager_countries (user_id, country) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, country]
    );
  }
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResult> {
  let client: PoolClient | undefined;
  try {
    await requireAdminSession();
    const parsed = createEmployeeSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: publicAdminMutationError(parsed.error) };
    }
    const p = parsed.data;
    const today = getTodayCairoDate();
    const password_hash = await bcrypt.hash(p.password, 10);
    const role: Role = p.role ?? "employee";
    const hire = p.hire_date ?? today;
    const cycleStart = p.pay_cycle_start_date ?? today;
    const baseSalary = p.base_salary ?? 0;
    const level = p.current_level ?? 2;
    let teamLeadId: number | null = p.team_lead_id ?? null;
    let managerId: number | null = p.manager_id ?? null;
    // Employees and managers can report to a team lead; only employees get a manager.
    if (role === "team_lead" || role === "admin") {
      teamLeadId = null;
    }
    if (role !== "employee") {
      managerId = null;
    }
    if (role === "employee" && !managerId) {
      return { error: "Select a manager for this employee." };
    }

    let managerCountries: string[] = [];
    if (role === "manager") {
      const countriesParsed = managerCountriesSchema.safeParse(
        p.manager_countries ?? []
      );
      if (!countriesParsed.success) {
        return { error: publicAdminMutationError(countriesParsed.error) };
      }
      managerCountries = countriesParsed.data;
    }

    const primaryCountry =
      role === "manager"
        ? managerCountries[0]!
        : (p.country ?? "").trim();

    client = await pool.connect();
    await client.query("BEGIN");

    if (managerId) {
      const mgr = await client.query<{ id: number }>(
        `SELECT id FROM temp_users WHERE id = $1 AND role = 'manager' AND is_active = TRUE`,
        [managerId]
      );
      if (!mgr.rows[0]) {
        await client.query("ROLLBACK");
        return { error: "Selected manager is invalid." };
      }
    }

    if (teamLeadId) {
      const tl = await client.query<{ id: number }>(
        `SELECT id FROM temp_users WHERE id = $1 AND role = 'team_lead' AND is_active = TRUE`,
        [teamLeadId]
      );
      if (!tl.rows[0]) {
        await client.query("ROLLBACK");
        return { error: "Selected team lead is invalid." };
      }
    }

    const ins = await client.query<{ id: number }>(
      `INSERT INTO temp_users (
         full_name, email, password_hash, role, phone, is_active,
         team_lead_id, manager_id, base_salary, hire_date, pay_cycle_start_date, current_level,
         region, country,
         target_x_count, target_facebook_personal_count, target_facebook_umbrella_count,
         target_instagram_count, target_tiktok_count
       ) VALUES (
         $1, $2, $3, $4, $5, TRUE,
         $6, $7, $8, $9::date, $10::date, $11,
         $12, $13,
         0, 0, 0, 0, 0
       ) RETURNING id`,
      [
        p.full_name,
        p.email,
        password_hash,
        role,
        p.phone ?? null,
        teamLeadId,
        managerId,
        baseSalary,
        hire,
        cycleStart,
        level,
        SETUP_REGION,
        primaryCountry,
      ]
    );
    const id = ins.rows[0]?.id;
    if (!id) {
      await client.query("ROLLBACK");
      return { error: "Insert failed." };
    }

    if (role === "manager") {
      await replaceManagerCountries(client, id, managerCountries);
    }

    await recordBaseSalary(client, {
      user_id: id,
      cycle_start_date: cycleStart.slice(0, 10),
      amount: baseSalary,
    });

    await client.query("COMMIT");
    revalidateAdminEmployee(id);
    return { id };
  } catch (e) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return { error: publicAdminMutationError(e) };
  } finally {
    client?.release();
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
  role: z.enum(["employee", "team_lead", "admin", "manager"]),
  is_active: z.boolean(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  team_lead_id: z.number().int().positive().nullable(),
  manager_id: z.number().int().positive().nullable(),
  manager_countries: z.array(z.string()).optional(),
  base_salary: z.number().min(0).max(10_000_000),
  current_level: z.number().int().min(1).max(6),
  pay_cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  country: setupCountrySchema,
});

export async function updateEmployeeProfile(
  user_id: number,
  payload: UpdateEmployeeProfilePayload
): Promise<void> {
  const { adminId } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  const p = updateProfileSchema.parse(payload);

  let teamLeadId = p.team_lead_id;
  let managerId = p.manager_id;
  if (p.role === "team_lead" || p.role === "admin") {
    teamLeadId = null;
  }
  if (p.role !== "employee") {
    managerId = null;
  }
  if (p.role === "employee" && !managerId) {
    throw new Error("Select a manager for this employee.");
  }

  let managerCountries: string[] = [];
  if (p.role === "manager") {
    managerCountries = managerCountriesSchema.parse(p.manager_countries ?? []);
  }

  const primaryCountry =
    p.role === "manager" ? managerCountries[0]! : p.country;

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

    if (managerId) {
      const mgr = await client.query<{ id: number }>(
        `SELECT id FROM temp_users WHERE id = $1 AND role = 'manager' AND is_active = TRUE`,
        [managerId]
      );
      if (!mgr.rows[0]) throw new Error("Selected manager is invalid.");
    }

    if (teamLeadId) {
      const tl = await client.query<{ id: number }>(
        `SELECT id FROM temp_users WHERE id = $1 AND role = 'team_lead' AND is_active = TRUE`,
        [teamLeadId]
      );
      if (!tl.rows[0]) throw new Error("Selected team lead is invalid.");
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
         hire_date = $5::date,
         team_lead_id = $6,
         manager_id = $7,
         base_salary = $8,
         current_level = $9,
         pay_cycle_start_date = $10::date,
         region = $11,
         country = $12
       WHERE id = $13`,
      [
        p.full_name,
        p.email,
        p.phone,
        p.role,
        p.hire_date,
        teamLeadId,
        managerId,
        p.base_salary,
        p.current_level,
        p.pay_cycle_start_date,
        SETUP_REGION,
        primaryCountry,
        user_id,
      ]
    );

    if (p.role === "manager") {
      await replaceManagerCountries(client, user_id, managerCountries);
    } else {
      await client.query(`DELETE FROM temp_manager_countries WHERE user_id = $1`, [
        user_id,
      ]);
    }

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
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function setEmployeeActive(
  user_id: number,
  is_active: boolean
): Promise<void> {
  await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");

  await pool.query(`UPDATE temp_users SET is_active = $2 WHERE id = $1`, [
    user_id,
    is_active,
  ]);
  revalidateAdminEmployee(user_id);
}

export async function getAdminEmployeeEditorBundle(
  userId: number
): Promise<AdminEmployeeEditorBundle | null> {
  await requireAdminSession();
  if (!Number.isFinite(userId)) return null;
  return fetchAdminEmployeeEditorBundle(userId);
}

export async function deleteEmployee(user_id: number): Promise<void> {
  const { adminId } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  if (user_id === adminId) {
    throw new Error("You cannot delete your own account.");
  }

  const user = await queryOne<{ id: number; role: Role }>(
    `SELECT id, role FROM temp_users WHERE id = $1`,
    [user_id]
  );
  if (!user) throw new Error("User not found.");

  if (user.role === "admin") {
    const remaining = await queryOne<{ c: string }>(
      `SELECT COUNT(*)::text AS c
         FROM temp_users
        WHERE role = 'admin' AND id <> $1`,
      [user_id]
    );
    if (Number(remaining?.c ?? 0) < 1) {
      throw new Error("Cannot delete the last admin.");
    }
  }

  await pool.query(`DELETE FROM temp_users WHERE id = $1`, [user_id]);
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/payouts");
  revalidatePath("/admin/team-leads");
  revalidatePath("/manager");
  revalidatePath("/dashboard");
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
    action_route: "/dashboard",
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
