"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminOnlyActor } from "@/lib/admin-access";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  fetchEmployeePermissionsBundle,
  resetEmployeePermissionsToRoleDefaults,
  saveEmployeePermissions,
} from "@/lib/admin-permissions";
import { logOrbitAction } from "@/lib/orbit-log";
import type {
  EmployeePermissionsBundle,
  SaveEmployeePermissionsInput,
  SaveEmployeePermissionsResult,
} from "@/types/permissions";

const pageKeySchema = z.enum([
  "overview",
  "employees",
  "extract",
  "spare",
  "strategy",
  "activity",
]);

const crudSchema = z.object({
  pageKey: pageKeySchema,
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

const saveSchema = z.object({
  userId: z.number().int().positive(),
  pages: z.array(crudSchema).min(1),
});

async function requirePermissionsAdmin() {
  return requireAdminOnlyActor();
}

export async function getEmployeePermissionsBundleAction(
  userId: number
): Promise<EmployeePermissionsBundle | { error: string }> {
  try {
    await requirePermissionsAdmin();
    const bundle = await fetchEmployeePermissionsBundle(userId);
    if (!bundle) return { error: "That employee was not found." };
    return bundle;
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}

export async function saveEmployeePermissionsAction(
  input: SaveEmployeePermissionsInput
): Promise<SaveEmployeePermissionsResult> {
  try {
    await requirePermissionsAdmin();
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Check the permission matrix and try again." };
    }
    await saveEmployeePermissions(parsed.data);
    revalidatePath("/admin/employees");
    await logOrbitAction({
      action: "update",
      resource: "employee",
      summary: `Updated page permissions for user ${parsed.data.userId}`,
      details: { userId: parsed.data.userId, pages: parsed.data.pages.length },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicAdminMutationError(error) };
  }
}

export async function resetEmployeePermissionsAction(
  userId: number
): Promise<SaveEmployeePermissionsResult> {
  try {
    await requirePermissionsAdmin();
    if (!Number.isFinite(userId) || userId <= 0) {
      return { ok: false, error: "That employee was not found." };
    }
    await resetEmployeePermissionsToRoleDefaults(userId);
    revalidatePath("/admin/employees");
    await logOrbitAction({
      action: "update",
      resource: "employee",
      summary: `Reset page permissions to role defaults for user ${userId}`,
      details: { userId },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicAdminMutationError(error) };
  }
}
