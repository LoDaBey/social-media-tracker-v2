"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { assertManagerCanEditEmployee } from "@/lib/manager-data";
import { logOrbitAction } from "@/lib/orbit-log";
import type { EmploymentStatus } from "@/types/db";

async function requireManager() {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(managerId) || role !== "manager") {
    throw new Error("Unauthorized - manager only.");
  }
  return managerId;
}

function revalidateManagerEmployee(userId: number) {
  revalidatePath("/manager");
  revalidatePath("/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
}

export async function updateManagerEmployeeStatus(
  employeeId: number,
  employmentStatus: EmploymentStatus
): Promise<{ error?: string }> {
  try {
    const managerId = await requireManager();
    if (!Number.isFinite(employeeId)) return { error: "Invalid employee." };

    const parsed = z
      .enum(["active", "on_hold", "deactivated"])
      .safeParse(employmentStatus);
    if (!parsed.success) return { error: "Invalid status." };

    const allowed = await assertManagerCanEditEmployee(managerId, employeeId);
    if (!allowed) return { error: "You cannot edit this employee." };

    await pool.query(
      `UPDATE temp_users SET employment_status = $2 WHERE id = $1`,
      [employeeId, parsed.data]
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
