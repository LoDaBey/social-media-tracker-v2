"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter a full name.").max(255),
  employee_code: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed.slice(0, 50);
    }),
});

async function requireManagerId() {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(managerId) || role !== "manager") {
    throw new Error("Unauthorized — manager only.");
  }
  return managerId;
}

function revalidateManagerEmployee(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/manager/setup");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/dashboard");
}

export async function updateManagerEmployeeProfile(
  employeeId: number,
  payload: { full_name: string; employee_code: string | null }
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManagerId();
    if (!Number.isFinite(employeeId)) return { error: "Invalid employee." };

    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Enter a valid name." };
    }

    const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
    if (!allowed) {
      return { error: "You cannot edit this employee." };
    }

    await pool.query(
      `UPDATE temp_users
          SET full_name = $2,
              employee_code = $3
        WHERE id = $1`,
      [employeeId, parsed.data.full_name, parsed.data.employee_code]
    );
    revalidateManagerEmployee(employeeId);
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
