"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  deleteAlphaaEmployeeRow,
  setAlphaaEmployeeActiveRow,
  updateAlphaaEmployeeRow,
} from "@/lib/admin-alphaa-mutate";
import type { UpdateAlphaaEmployeePayload } from "@/types/admin";

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
  return { adminId };
}

function revalidateAlphaaEmployee(userId?: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  if (userId) revalidatePath(`/admin/employees/alphaa/${userId}`);
}

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter a name.").max(255),
  email: z.string().trim().email("Enter a valid email.").max(255),
  phone: z.string().trim().max(50).nullable(),
  roleLabel: z.string().trim().min(1, "Select a role."),
  country: z.string().trim().min(1, "Select a country."),
  department: z.string().trim().max(255).nullable(),
  location: z.string().trim().max(255).nullable(),
  projects: z.array(z.string().trim().max(80)).max(30),
  isActive: z.boolean(),
});

export async function updateAlphaaEmployeeProfile(
  userId: number,
  payload: UpdateAlphaaEmployeePayload
): Promise<void> {
  await requireAdmin();
  if (!Number.isFinite(userId)) throw new Error("Invalid user.");
  try {
    const parsed = profileSchema.parse(payload);
    await updateAlphaaEmployeeRow(userId, {
      ...parsed,
      phone: parsed.phone || null,
      department: parsed.department || null,
      location: parsed.location || null,
    });
  } catch (error) {
    throw new Error(publicAdminMutationError(error));
  }
  revalidateAlphaaEmployee(userId);
}

export async function setAlphaaEmployeeActive(
  userId: number,
  isActive: boolean
): Promise<void> {
  await requireAdmin();
  if (!Number.isFinite(userId)) throw new Error("Invalid user.");
  try {
    await setAlphaaEmployeeActiveRow(userId, isActive);
  } catch (error) {
    throw new Error(publicAdminMutationError(error));
  }
  revalidateAlphaaEmployee(userId);
}

export async function setAlphaaEmployeeEmploymentStatus(
  userId: number,
  employmentStatus: "active" | "on_hold" | "deactivated"
): Promise<void> {
  const parsed = z
    .enum(["active", "on_hold", "deactivated"])
    .safeParse(employmentStatus);
  if (!parsed.success) throw new Error("Invalid status.");
  await setAlphaaEmployeeActive(userId, parsed.data === "active");
}

export async function deleteAlphaaEmployee(userId: number): Promise<void> {
  const { adminId } = await requireAdmin();
  if (!Number.isFinite(userId)) throw new Error("Invalid user.");
  if (userId === adminId) {
    throw new Error("You cannot delete your own account.");
  }
  try {
    await deleteAlphaaEmployeeRow(userId);
  } catch (error) {
    throw new Error(publicAdminMutationError(error));
  }
  revalidateAlphaaEmployee();
}
