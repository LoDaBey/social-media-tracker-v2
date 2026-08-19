"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";

const updateCodeSchema = z.object({
  employee_code: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed.slice(0, 50);
    }),
});

async function requireManager() {
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
  revalidatePath("/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
}

export async function updateManagerEmployeeCode(
  employeeId: number,
  employeeCode: string | null
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManager();
    if (!Number.isFinite(employeeId)) return { error: "Invalid employee." };

    const parsed = updateCodeSchema.safeParse({ employee_code: employeeCode });
    if (!parsed.success) return { error: "Enter a valid employee code." };

    const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
    if (!allowed) return { error: "You cannot edit this employee." };

    await pool.query(
      `UPDATE temp_users SET employee_code = $2 WHERE id = $1`,
      [employeeId, parsed.data.employee_code]
    );

    revalidateManagerEmployee(employeeId);
    return {};
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
