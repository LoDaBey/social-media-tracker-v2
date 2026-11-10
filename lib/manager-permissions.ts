import { auth } from "@/auth";
import {
  fetchRolePermissionDefaults,
  permissionAllows,
  resolveUserPagePermissions,
} from "@/lib/admin-permissions";
import type {
  AdminPagePermissionRow,
  AdminPermissionAction,
  AdminPermissionPageKey,
} from "@/types/permissions";
import type { ManagerPermissions } from "@/types/manager";

const ACTION_WORD: Record<AdminPermissionAction, string> = {
  canCreate: "add",
  canRead: "view",
  canUpdate: "change",
  canDelete: "delete",
};

const PAGE_WORD: Partial<Record<AdminPermissionPageKey, string>> = {
  manager_team: "your team",
  manager_coverage: "planned coverage",
  manager_spare: "spare accounts",
};

/** Effective CM page permissions (per-person overrides, else role defaults). */
export async function fetchManagerPagePermissions(
  managerId: number,
): Promise<AdminPagePermissionRow[]> {
  try {
    return await resolveUserPagePermissions(managerId, "manager");
  } catch {
    // Permission tables unreachable: fall back to the built-in CM defaults.
    return fetchRolePermissionDefaults("manager");
  }
}

function crud(pages: AdminPagePermissionRow[], page: AdminPermissionPageKey) {
  return {
    canCreate: permissionAllows(pages, page, "canCreate"),
    canRead: permissionAllows(pages, page, "canRead"),
    canUpdate: permissionAllows(pages, page, "canUpdate"),
    canDelete: permissionAllows(pages, page, "canDelete"),
  };
}

export async function fetchManagerPermissions(
  managerId: number,
): Promise<ManagerPermissions> {
  const pages = await fetchManagerPagePermissions(managerId);
  return {
    team: crud(pages, "manager_team"),
    coverage: crud(pages, "manager_coverage"),
    spare: crud(pages, "manager_spare"),
  };
}

/** Signed-in Country Manager with this page permission; returns their id. */
export async function requireManagerPermission(
  page: AdminPermissionPageKey,
  action: AdminPermissionAction,
): Promise<number> {
  const session = await auth();
  const managerId = Number(session?.user?.id);
  if (!Number.isFinite(managerId) || session?.user?.role !== "manager") {
    throw new Error("Unauthorized — manager only.");
  }
  const pages = await fetchManagerPagePermissions(managerId);
  if (!permissionAllows(pages, page, action)) {
    throw new Error(
      `You don't have permission to ${ACTION_WORD[action]} ${PAGE_WORD[page] ?? "this page"}.`,
    );
  }
  return managerId;
}
