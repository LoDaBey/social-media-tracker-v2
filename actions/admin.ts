"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { PoolClient } from "pg";
import { requireFullAdminActor } from "@/lib/admin-access";
import type { AdminPermissionAction } from "@/types/permissions";
import { pool, queryOne } from "@/lib/db";
import { getTodayCairoDate, normalizePgDateColumn } from "@/lib/cairo-date";
import { createNotification } from "@/lib/notifications";
import {
  AFRICA_SEAT_ACCOUNTS,
  AFRICA_X_PER_SEAT,
} from "@/lib/admin-country-targets";
import { europeSeatTargetsForIndexFromDb } from "@/lib/strategy-plans-data";
import { fetchAdminEmployeeEditorBundle } from "@/lib/admin-data";
import {
  countriesForCreateProject,
  regionFromStrategyProjectSlug,
} from "@/lib/employee-create-projects";
import { fetchEmployeeCreateProjectOptions } from "@/lib/employee-create-projects-data";
import { isEuropeCountry } from "@/lib/region-config";
import {
  isAlphaaCountry,
  isSetupCountry,
  setupRegionForCountry,
} from "@/lib/setup-options";
import type {
  AdminEmployeeEditorBundle,
  AdminEmployeeSource,
  CreateEmployeePayload,
  CreateEmployeeResult,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeTargetsPayload,
} from "@/types/admin";
import type { Role } from "@/types/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertValidReporting } from "@/lib/admin-reporting";
import { logOrbitAction } from "@/lib/orbit-log";
import { normalizeReportingForRole } from "@/lib/role-hierarchy";

const setupCountrySchema = z
  .string()
  .trim()
  .min(1, "Select a country.")
  .refine((value) => isSetupCountry(value), "Select a valid country.");

async function requireAdminSession(
  action: AdminPermissionAction = "canUpdate"
) {
  const { userId: adminId, role: actorRole } = await requireFullAdminActor(
    "employees",
    action
  );
  return { adminId, actorRole };
}

const ADMIN_ROLE_ONLY_ERROR =
  "Only an Admin can give the Admin role or change an Admin's account.";

/**
 * Only an Admin may create an Admin, promote someone to Admin, or change an
 * existing Admin. Stops Heads of Department (or anyone with custom employee
 * permissions) from making themselves or others Admin.
 */
function adminRoleChangeBlocked(
  actorRole: string,
  targetCurrentRole: string | null | undefined,
  newRole?: string | null
): boolean {
  if (actorRole === "admin") return false;
  return targetCurrentRole === "admin" || newRole === "admin";
}

async function currentRoleOf(user_id: number): Promise<string | null> {
  const row = await queryOne<{ role: string }>(
    `SELECT role FROM temp_users WHERE id = $1`,
    [user_id]
  );
  return row?.role ?? null;
}

async function assertMayChangeUser(actorRole: string, user_id: number) {
  if (adminRoleChangeBlocked(actorRole, await currentRoleOf(user_id))) {
    throw new Error(ADMIN_ROLE_ONLY_ERROR);
  }
}

function revalidateAdminEmployee(userId: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
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
    role: z
      .enum(["employee", "team_lead", "admin", "manager", "op", "hoo"])
      .optional(),
    team_lead_id: z.number().int().positive().nullable().optional(),
    manager_id: z.number().int().positive().nullable().optional(),
    op_id: z.number().int().positive().nullable().optional(),
    manager_countries: z.array(z.string()).optional(),
    op_countries: z.array(z.string()).optional(),
    hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    current_level: z.number().int().min(1).max(6).optional(),
    country: z.string().optional(),
    project_slug: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const role = data.role ?? "employee";
    if (role === "manager" || role === "admin" || role === "hoo") return;
    if (role === "op") {
      if (!(data.project_slug ?? "").trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["project_slug"],
          message: "Select a project for this Operation Manager.",
        });
      }
      if (!(data.op_countries ?? []).some((country) => country.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["op_countries"],
          message: "Select at least one country this Operation Manager can access.",
        });
      }
      return;
    }
    const country = data.country?.trim() ?? "";
    const projectSlug = data.project_slug?.trim() ?? "";
    if (!projectSlug) {
      ctx.addIssue({
        code: "custom",
        path: ["project_slug"],
        message: "Select a project.",
      });
    }
    if (!country) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Select a country.",
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

async function replaceOpCountries(
  client: PoolClient,
  userId: number,
  countries: string[]
) {
  await client.query(`DELETE FROM temp_op_countries WHERE user_id = $1`, [
    userId,
  ]);
  for (const country of countries) {
    const trimmed = country.trim();
    if (!trimmed) continue;
    await client.query(
      `INSERT INTO temp_op_countries (user_id, country) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, trimmed]
    );
  }
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResult> {
  let client: PoolClient | undefined;
  try {
    const { actorRole } = await requireAdminSession("canCreate");
    const parsed = createEmployeeSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: publicAdminMutationError(parsed.error) };
    }
    const p = parsed.data;
    if (adminRoleChangeBlocked(actorRole, null, p.role)) {
      return { error: ADMIN_ROLE_ONLY_ERROR };
    }
    const today = getTodayCairoDate();
    const password_hash = await bcrypt.hash(p.password, 10);
    const role: Role = p.role ?? "employee";
    const hire = p.hire_date ?? today;
    const level = p.current_level ?? 2;
    let managerCountries: string[] = [];
    let opCountries: string[] = [];
    if (role === "manager") {
      const countriesParsed = managerCountriesSchema.safeParse(
        p.manager_countries ?? []
      );
      if (!countriesParsed.success) {
        return { error: publicAdminMutationError(countriesParsed.error) };
      }
      managerCountries = countriesParsed.data;
    }
    if (role === "op") {
      const countriesParsed = managerCountriesSchema.safeParse(
        p.op_countries ?? []
      );
      if (!countriesParsed.success) {
        return { error: publicAdminMutationError(countriesParsed.error) };
      }
      opCountries = countriesParsed.data;
    }

    const projectSlug = (p.project_slug ?? "").trim();
    const primaryCountry =
      role === "manager"
        ? managerCountries[0]!
        : role === "op"
          ? opCountries[0]!
          : (p.country ?? "").trim();

    let assignedRegion = setupRegionForCountry(primaryCountry);
    let opProjectSlug: string | null = null;

    if (role === "op") {
      const projects = await fetchEmployeeCreateProjectOptions();
      const project = projects.find((item) => item.slug === projectSlug);
      if (!project) {
        return { error: "Select a valid project." };
      }
      const projectCountries = countriesForCreateProject(projects, projectSlug);
      if (
        opCountries.length === 0 ||
        opCountries.some((country) => !projectCountries.includes(country))
      ) {
        return { error: "Select countries from this project only." };
      }
      assignedRegion = regionFromStrategyProjectSlug(projectSlug);
      opProjectSlug = projectSlug;
    } else if (role !== "manager" && role !== "admin" && role !== "hoo") {
      const projects = await fetchEmployeeCreateProjectOptions();
      const project = projects.find((item) => item.slug === projectSlug);
      if (!project) {
        return { error: "Select a valid project." };
      }
      const projectCountries = countriesForCreateProject(projects, projectSlug);
      if (!projectCountries.includes(primaryCountry)) {
        return { error: "Select a country from this project." };
      }
      assignedRegion = regionFromStrategyProjectSlug(projectSlug);
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const reportingInput = normalizeReportingForRole(role, {
      team_lead_id: p.team_lead_id ?? null,
      manager_id: p.manager_id ?? null,
      op_id: p.op_id ?? null,
    });
    const reportingCheck = await assertValidReporting(client, role, reportingInput);
    if (reportingCheck.error) {
      await client.query("ROLLBACK");
      return { error: reportingCheck.error };
    }
    const { team_lead_id: teamLeadId, manager_id: managerId, op_id: opId } =
      reportingCheck.normalized;

    // Default assigned targets for new employees; other roles stay at 0.
    // Europe countries use the next planned seat quota (13–15), not Africa's flat 15.
    let defaultTargets = {
      x: 0,
      facebook_personal: 0,
      facebook_umbrella: 0,
      instagram: 0,
      tiktok: 0,
    };
    if (role === "employee") {
      defaultTargets = {
        x: AFRICA_X_PER_SEAT,
        facebook_personal: AFRICA_SEAT_ACCOUNTS.facebookPersonal,
        facebook_umbrella: AFRICA_SEAT_ACCOUNTS.facebookUmbrella,
        instagram: AFRICA_SEAT_ACCOUNTS.instagram,
        tiktok: AFRICA_SEAT_ACCOUNTS.tiktok,
      };
      if (isEuropeCountry(primaryCountry)) {
        const existing = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM temp_users
            WHERE role = 'employee'
              AND is_active = TRUE
              AND country = $1`,
          [primaryCountry]
        );
        const seatIndex = Number(existing.rows[0]?.count ?? 0);
        const europeSeat = await europeSeatTargetsForIndexFromDb(primaryCountry, seatIndex);
        if (europeSeat) {
          defaultTargets = {
            x: europeSeat.x,
            facebook_personal: europeSeat.facebookPersonal,
            facebook_umbrella: europeSeat.facebookUmbrella,
            instagram: europeSeat.instagram,
            tiktok: europeSeat.tiktok,
          };
        }
      }
    }

    const ins = await client.query<{ id: number }>(
      `INSERT INTO temp_users (
         full_name, email, password_hash, role, phone, is_active,
         team_lead_id, manager_id, op_id, hire_date, current_level,
         region, country, op_project_slug,
         target_x_count, target_facebook_personal_count, target_facebook_umbrella_count,
         target_instagram_count, target_tiktok_count
       ) VALUES (
         $1, $2, $3, $4, $5, TRUE,
         $6, $7, $8, $9::date, $10,
         $11, $12, $13,
         $14, $15, $16, $17, $18
       ) RETURNING id`,
      [
        p.full_name,
        p.email,
        password_hash,
        role,
        p.phone ?? null,
        teamLeadId,
        managerId,
        opId,
        hire,
        level,
        assignedRegion,
        primaryCountry || null,
        opProjectSlug,
        defaultTargets.x,
        defaultTargets.facebook_personal,
        defaultTargets.facebook_umbrella,
        defaultTargets.instagram,
        defaultTargets.tiktok,
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
    if (role === "op") {
      await replaceOpCountries(client, id, opCountries);
    }

    await client.query("COMMIT");
    revalidateAdminEmployee(id);
    await logOrbitAction({
      action: "create",
      resource: "employee",
      summary: `Created ${role} ${p.full_name}`,
      details: { userId: id, email: p.email, role, country: primaryCountry },
    });
    return { id };
  } catch (e) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return { error: publicAdminMutationError(e) };
  } finally {
    client?.release();
  }
}

const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(255),
    email: z.string().trim().email().max(255),
    phone: z
      .union([z.string(), z.null()])
      .transform((s) =>
        s == null || String(s).trim() === "" ? null : String(s).trim().slice(0, 50)
      ),
    role: z.enum(["employee", "team_lead", "admin", "manager", "op", "hoo"]),
    is_active: z.boolean(),
    employee_code: z
      .union([z.string(), z.null()])
      .transform((value) => {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed.slice(0, 50);
      }),
    employment_status: z.enum(["active", "on_hold", "deactivated"]),
    hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    team_lead_id: z.number().int().positive().nullable(),
    manager_id: z.number().int().positive().nullable(),
    op_id: z.number().int().positive().nullable(),
    manager_countries: z.array(z.string()).optional(),
    project_slug: z.string().trim().optional(),
    op_countries: z.array(z.string()).optional(),
    country: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "manager" || data.role === "admin" || data.role === "hoo") {
      return;
    }
    if (data.role === "op") {
      if (!(data.project_slug ?? "").trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["project_slug"],
          message: "Select a project for this Operation Manager.",
        });
      }
      if (!(data.op_countries ?? []).some((country) => country.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["op_countries"],
          message:
            "Select at least one country this Operation Manager can access.",
        });
      }
      return;
    }
    if (!data.country) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Select a country.",
      });
      return;
    }
    if (!isSetupCountry(data.country)) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Select a valid country.",
      });
    }
  });

export async function updateEmployeeProfile(
  user_id: number,
  payload: UpdateEmployeeProfilePayload
): Promise<void> {
  const { actorRole } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  const p = updateProfileSchema.parse(payload);
  if (adminRoleChangeBlocked(actorRole, await currentRoleOf(user_id), p.role)) {
    throw new Error(ADMIN_ROLE_ONLY_ERROR);
  }

  let managerCountries: string[] = [];
  let opCountries: string[] = [];
  if (p.role === "manager") {
    managerCountries = managerCountriesSchema.parse(p.manager_countries ?? []);
  }
  if (p.role === "op") {
    opCountries = managerCountriesSchema.parse(p.op_countries ?? []);
  }

  const projectSlug = (p.project_slug ?? "").trim();
  let assignedRegion =
    p.role === "manager"
      ? setupRegionForCountry(managerCountries[0]!)
      : setupRegionForCountry(p.country);
  let primaryCountry =
    p.role === "manager" ? managerCountries[0]! : p.country;
  let opProjectSlug: string | null = null;

  if (p.role === "op") {
    const projects = await fetchEmployeeCreateProjectOptions();
    const project = projects.find((item) => item.slug === projectSlug);
    if (!project) {
      throw new Error("Select a valid project.");
    }
    const projectCountries = countriesForCreateProject(projects, projectSlug);
    if (
      opCountries.length === 0 ||
      opCountries.some((country) => !projectCountries.includes(country))
    ) {
      throw new Error("Select countries from this project only.");
    }
    assignedRegion = regionFromStrategyProjectSlug(projectSlug);
    primaryCountry = opCountries[0]!;
    opProjectSlug = projectSlug;
  }

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

    const reportingInput = normalizeReportingForRole(p.role, {
      team_lead_id: p.team_lead_id,
      manager_id: p.manager_id,
      op_id: p.op_id,
    });
    const reportingCheck = await assertValidReporting(client, p.role, reportingInput);
    if (reportingCheck.error) {
      throw new Error(reportingCheck.error);
    }
    const { team_lead_id: teamLeadId, manager_id: managerId, op_id: opId } =
      reportingCheck.normalized;

    // Main (ALPHAA) people keep their project when saved. Sudan / Somalia are also
    // Africa countries, so re-deriving the region from the country would move them.
    if (p.role !== "op" && isAlphaaCountry(primaryCountry)) {
      const current = await client.query<{ region: string | null }>(
        `SELECT region FROM temp_users WHERE id = $1`,
        [user_id]
      );
      if (current.rows[0]?.region === "Alphaa") assignedRegion = "Alphaa";
    }

    await client.query(
      `UPDATE temp_users SET
         full_name = $1,
         email = $2,
         phone = $3,
         role = $4,
         hire_date = $5::date,
         team_lead_id = $6,
         manager_id = $7,
         op_id = $8,
         region = $9,
         country = $10,
         op_project_slug = $11,
         employee_code = $12,
         employment_status = $13
       WHERE id = $14`,
      [
        p.full_name,
        p.email,
        p.phone,
        p.role,
        p.hire_date,
        teamLeadId,
        managerId,
        opId,
        assignedRegion,
        primaryCountry || null,
        opProjectSlug,
        p.employee_code,
        p.employment_status,
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

    if (p.role === "op") {
      await replaceOpCountries(client, user_id, opCountries);
    } else {
      await client.query(`DELETE FROM temp_op_countries WHERE user_id = $1`, [
        user_id,
      ]);
    }

    await client.query("COMMIT");
    revalidateAdminEmployee(user_id);
    await logOrbitAction({
      action: "update",
      resource: "employee",
      summary: `Updated profile for ${p.full_name}`,
      details: { userId: user_id, email: p.email, role: p.role },
    });
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
  const { actorRole } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  await assertMayChangeUser(actorRole, user_id);

  await pool.query(`UPDATE temp_users SET is_active = $2 WHERE id = $1`, [
    user_id,
    is_active,
  ]);
  revalidateAdminEmployee(user_id);
  await logOrbitAction({
    action: "update",
    resource: "employee",
    summary: is_active ? `Activated employee #${user_id}` : `Deactivated employee #${user_id}`,
    details: { userId: user_id, is_active },
  });
}

export async function setEmployeeEmploymentStatus(
  user_id: number,
  employment_status: "active" | "on_hold" | "deactivated"
): Promise<void> {
  const { actorRole } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  await assertMayChangeUser(actorRole, user_id);

  const parsed = z.enum(["active", "on_hold", "deactivated"]).safeParse(employment_status);
  if (!parsed.success) throw new Error("Invalid status.");

  await pool.query(
    `UPDATE temp_users SET employment_status = $2 WHERE id = $1`,
    [user_id, parsed.data]
  );
  revalidateAdminEmployee(user_id);
  await logOrbitAction({
    action: "update",
    resource: "employee",
    summary: `Set employment status to ${parsed.data} for employee #${user_id}`,
    details: { userId: user_id, employment_status: parsed.data },
  });
}

export async function setEmployeeCode(
  user_id: number,
  employee_code: string | null
): Promise<void> {
  const { actorRole } = await requireAdminSession();
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  await assertMayChangeUser(actorRole, user_id);

  const parsed = z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed.slice(0, 50);
    })
    .safeParse(employee_code);

  if (!parsed.success) throw new Error("Enter a valid employee code.");

  await pool.query(`UPDATE temp_users SET employee_code = $2 WHERE id = $1`, [
    user_id,
    parsed.data,
  ]);
  revalidateAdminEmployee(user_id);
  await logOrbitAction({
    action: "update",
    resource: "employee",
    summary: `Set employee code for #${user_id}`,
    details: { userId: user_id, employee_code: parsed.data },
  });
}

export async function getAdminEmployeeEditorBundle(
  userId: number,
  source: AdminEmployeeSource = "temp"
): Promise<AdminEmployeeEditorBundle | null> {
  await requireAdminSession("canRead");
  if (!Number.isFinite(userId)) return null;
  return fetchAdminEmployeeEditorBundle(userId, source);
}

export async function deleteEmployee(user_id: number): Promise<void> {
  const { adminId, actorRole } = await requireAdminSession("canDelete");
  if (!Number.isFinite(user_id)) throw new Error("Invalid user.");
  if (user_id === adminId) {
    throw new Error("You cannot delete your own account.");
  }

  const user = await queryOne<{ id: number; role: Role }>(
    `SELECT id, role FROM temp_users WHERE id = $1`,
    [user_id]
  );
  if (!user) throw new Error("User not found.");
  if (adminRoleChangeBlocked(actorRole, user.role)) {
    throw new Error(ADMIN_ROLE_ONLY_ERROR);
  }

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
  revalidatePath("/manager");
  revalidatePath("/dashboard");
  await logOrbitAction({
    action: "delete",
    resource: "employee",
    summary: `Deleted employee #${user_id} (${user.role})`,
    details: { userId: user_id, role: user.role },
  });
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
  await logOrbitAction({
    action: "update",
    resource: "employee",
    summary: `Updated account targets for employee #${user_id}`,
    details: { userId: user_id, ...t },
  });
}

