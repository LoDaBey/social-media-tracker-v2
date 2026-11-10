"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireManagerPermission } from "@/lib/manager-permissions";
import { isSetupLanguage } from "@/lib/setup-options";
import type { ManagerEmployeeProfilePayload } from "@/types/manager";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import { logOrbitAction } from "@/lib/orbit-log";
import type { EmploymentStatus } from "@/types/db";

function revalidateManagerEmployee(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
}

export async function updateManagerEmployeeStatus(
  employeeId: number,
  employmentStatus: EmploymentStatus,
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canUpdate",
    );
    if (!Number.isFinite(employeeId)) return { error: "Invalid employee." };

    const parsed = z
      .enum(["active", "on_hold", "deactivated"])
      .safeParse(employmentStatus);
    if (!parsed.success) return { error: "Invalid status." };

    const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
    if (!allowed) return { error: "You cannot edit this employee." };

    await pool.query(
      `UPDATE temp_users SET employment_status = $2 WHERE id = $1`,
      [employeeId, parsed.data],
    );

    revalidateManagerEmployee(employeeId);
    await logOrbitAction({
      action: "update",
      resource: "employee",
      summary: `Manager set employment status to ${parsed.data} for #${employeeId}`,
      details: { employeeId, employment_status: parsed.data },
    });
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

const targetCount = z.number().int().min(0).max(10_000);

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter a name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  language: z.string().trim(),
  targets: z.object({
    target_x_count: targetCount,
    target_facebook_personal_count: targetCount,
    target_facebook_umbrella_count: targetCount,
    target_instagram_count: targetCount,
    target_tiktok_count: targetCount,
  }),
});

/**
 * CM edits an employee on their team: name, email, language and account targets.
 * Project, country, role, team lead and manager stay admin-only.
 */
export async function updateManagerEmployeeProfile(
  employeeId: number,
  payload: ManagerEmployeeProfilePayload,
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManagerPermission(
      "manager_team",
      "canUpdate",
    );
    if (!Number.isFinite(employeeId)) return { error: "Invalid employee." };
    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Check the form." };
    }
    const p = parsed.data;
    if (p.language && !isSetupLanguage(p.language)) {
      return { error: "Select a valid language." };
    }

    const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
    if (!allowed) return { error: "You cannot edit this employee." };

    const dup = await pool.query(
      `SELECT 1 FROM temp_users WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1`,
      [p.email, employeeId],
    );
    if (dup.rowCount) return { error: "Email already in use." };

    const t = p.targets;
    await pool.query(
      `UPDATE temp_users
          SET full_name = $2,
              email = $3,
              language = $4,
              target_x_count = $5,
              target_facebook_personal_count = $6,
              target_facebook_umbrella_count = $7,
              target_instagram_count = $8,
              target_tiktok_count = $9
        WHERE id = $1`,
      [
        employeeId,
        p.full_name,
        p.email,
        p.language || null,
        t.target_x_count,
        t.target_facebook_personal_count,
        t.target_facebook_umbrella_count,
        t.target_instagram_count,
        t.target_tiktok_count,
      ],
    );

    revalidateManagerEmployee(employeeId);
    await logOrbitAction({
      action: "update",
      resource: "employee",
      summary: `Manager updated details and targets for ${p.full_name}`,
      details: {
        employee: `${p.full_name} (#${employeeId})`,
        language: p.language || "—",
        targets: {
          X: t.target_x_count,
          "Facebook personal": t.target_facebook_personal_count,
          "Facebook umbrella": t.target_facebook_umbrella_count,
          Instagram: t.target_instagram_count,
          TikTok: t.target_tiktok_count,
        },
      },
    });
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
