import { auth } from "@/auth";
import { queryOne } from "@/lib/db";
import { fetchOpAccessScope } from "@/lib/op-scope";
import {
  isAdminWorkspaceRole,
  isFullAdminRole,
  normalizeRoleValue,
} from "@/lib/role-hierarchy";
import type { OpAccessScope } from "@/types/admin";
import type { Role } from "@/types/db";

export type AdminViewer = {
  userId: number;
  role: "admin" | "hoo" | "op";
  /** Null for full admin/HOO access; set for Operation Managers. */
  scope: OpAccessScope | null;
  /** Admin and HOO may mutate; OP is read-only across admin surfaces. */
  canEdit: boolean;
};

export type FullAdminActor = {
  userId: number;
  role: "admin" | "hoo";
};

async function resolveViewerRole(
  userId: number,
  sessionRole: Role | string | undefined
): Promise<string | undefined> {
  // Prefer the live DB role so JWT can't leave HOO stuck as read-only OP.
  try {
    const row = await queryOne<{ role: string }>(
      `SELECT role
         FROM temp_users
        WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );
    if (row?.role) return normalizeRoleValue(row.role);
  } catch {
    // Fall back to the session role if the DB lookup fails.
  }
  return sessionRole ? normalizeRoleValue(sessionRole) : undefined;
}

export async function requireAdminViewer(): Promise<AdminViewer> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = await resolveViewerRole(userId, session?.user?.role);

  if (!Number.isFinite(userId) || !isAdminWorkspaceRole(role)) {
    throw new Error("Unauthorized — admin workspace only.");
  }

  if (isFullAdminRole(role)) {
    return {
      userId,
      role: normalizeRoleValue(role) === "hoo" ? "hoo" : "admin",
      scope: null,
      canEdit: true,
    };
  }

  const scope = await fetchOpAccessScope(userId);
  return {
    userId,
    role: "op",
    scope: scope ?? { projectSlug: "", region: "Africa", countries: [] },
    canEdit: false,
  };
}

export async function getAdminViewerOrNull(): Promise<AdminViewer | null> {
  try {
    return await requireAdminViewer();
  } catch {
    return null;
  }
}

/**
 * Live DB role check for mutations (Strategy create/delete/save, etc.).
 * Do not trust JWT alone — HOO must keep full admin edit rights.
 */
export async function requireFullAdminActor(): Promise<FullAdminActor> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    throw new Error("Unauthorized — admin or Head of Department only.");
  }

  const role = await resolveViewerRole(userId, session?.user?.role);
  if (!isFullAdminRole(role)) {
    throw new Error("Unauthorized — admin or Head of Department only.");
  }

  return {
    userId,
    role: normalizeRoleValue(role) === "hoo" ? "hoo" : "admin",
  };
}
