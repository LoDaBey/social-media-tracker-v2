import { auth } from "@/auth";
import { fetchOpAccessScope } from "@/lib/op-scope";
import {
  isAdminWorkspaceRole,
  isFullAdminRole,
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

export async function requireAdminViewer(): Promise<AdminViewer> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role as Role | undefined;

  if (!Number.isFinite(userId) || !isAdminWorkspaceRole(role)) {
    throw new Error("Unauthorized — admin workspace only.");
  }

  if (isFullAdminRole(role)) {
    return {
      userId,
      role: role === "hoo" ? "hoo" : "admin",
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
