import { auth } from "@/auth";
import { fetchOpAccessScope } from "@/lib/op-scope";
import type { OpAccessScope } from "@/types/admin";
import type { Role } from "@/types/db";

export type AdminViewer = {
  userId: number;
  role: "admin" | "op";
  /** Null for full admin access; set for Operation Managers. */
  scope: OpAccessScope | null;
  /** Admin may mutate; OP is read-only across admin surfaces. */
  canEdit: boolean;
};

export async function requireAdminViewer(): Promise<AdminViewer> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const role = session?.user?.role as Role | undefined;

  if (!Number.isFinite(userId) || (role !== "admin" && role !== "op")) {
    throw new Error("Unauthorized — admin or Operation Manager only.");
  }

  if (role === "admin") {
    return { userId, role: "admin", scope: null, canEdit: true };
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
