import { query, queryOne } from "@/lib/db";
import { normalizeRoleValue } from "@/lib/role-hierarchy";
import type { Role } from "@/types/db";
import type {
  AdminPagePermissionRow,
  AdminPermissionCrud,
  AdminPermissionPage,
  AdminPermissionPageKey,
  EmployeePermissionsBundle,
  SaveEmployeePermissionsInput,
} from "@/types/permissions";

const PAGE_KEYS: AdminPermissionPageKey[] = [
  "overview",
  "employees",
  "extract",
  "spare",
  "strategy",
  "activity",
];

const EMPTY_CRUD: AdminPermissionCrud = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
};

type PermissionDbRow = {
  page_key: string;
  label: string;
  sort_order: number;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

function isPageKey(value: string): value is AdminPermissionPageKey {
  return (PAGE_KEYS as readonly string[]).includes(value);
}

function mapCrud(row: {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}): AdminPermissionCrud {
  return {
    canCreate: Boolean(row.can_create),
    canRead: Boolean(row.can_read),
    canUpdate: Boolean(row.can_update),
    canDelete: Boolean(row.can_delete),
  };
}

export async function fetchAdminPermissionPages(): Promise<AdminPermissionPage[]> {
  const rows = await query<{
    page_key: string;
    label: string;
    sort_order: number;
  }>(
    `SELECT page_key, label, sort_order
       FROM admin_permission_pages
      ORDER BY sort_order ASC, page_key ASC`
  );
  const pages: AdminPermissionPage[] = [];
  for (const row of rows) {
    if (!isPageKey(row.page_key)) continue;
    pages.push({
      pageKey: row.page_key,
      label: row.label,
      sortOrder: row.sort_order,
    });
  }
  return pages;
}

export async function fetchRolePermissionDefaults(
  role: Role | string
): Promise<AdminPagePermissionRow[]> {
  const normalized = normalizeRoleValue(role);
  const rows = await query<PermissionDbRow>(
    `SELECT d.page_key,
            p.label,
            p.sort_order,
            d.can_create,
            d.can_read,
            d.can_update,
            d.can_delete
       FROM admin_role_permission_defaults d
       INNER JOIN admin_permission_pages p ON p.page_key = d.page_key
      WHERE d.role = $1
      ORDER BY p.sort_order ASC, p.page_key ASC`,
    [normalized]
  );

  if (rows.length > 0) {
    const pages: AdminPagePermissionRow[] = [];
    for (const row of rows) {
      if (!isPageKey(row.page_key)) continue;
      pages.push({
        pageKey: row.page_key,
        label: row.label,
        ...mapCrud(row),
      });
    }
    return pages;
  }

  // Fallback if role defaults are missing (mirrors migration 0022).
  const pages = await fetchAdminPermissionPages();
  return pages.map((page) => {
    const isAdmin = normalized === "admin";
    const isHoo = normalized === "hoo";
    const isOp = normalized === "op";
    const canRead = isAdmin || isHoo || isOp;
    if (isAdmin) {
      return {
        pageKey: page.pageKey,
        label: page.label,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    }
    if (isHoo) {
      const strategy = page.pageKey === "strategy";
      const extractOrActivity =
        page.pageKey === "extract" || page.pageKey === "activity";
      const employees = page.pageKey === "employees";
      return {
        pageKey: page.pageKey,
        label: page.label,
        canCreate: employees,
        canRead: true,
        canUpdate: !strategy && !extractOrActivity,
        canDelete: employees,
      };
    }
    return {
      pageKey: page.pageKey,
      label: page.label,
      ...EMPTY_CRUD,
      canRead,
    };
  });
}

export async function userHasCustomPermissions(userId: number): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM temp_user_permissions WHERE user_id = $1
     ) AS exists`,
    [userId]
  );
  return Boolean(row?.exists);
}

export async function fetchUserPermissionOverrides(
  userId: number
): Promise<Map<AdminPermissionPageKey, AdminPermissionCrud>> {
  const rows = await query<{
    page_key: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
  }>(
    `SELECT page_key, can_create, can_read, can_update, can_delete
       FROM temp_user_permissions
      WHERE user_id = $1`,
    [userId]
  );
  const map = new Map<AdminPermissionPageKey, AdminPermissionCrud>();
  for (const row of rows) {
    if (!isPageKey(row.page_key)) continue;
    map.set(row.page_key, mapCrud(row));
  }
  return map;
}

/** Effective permissions: user overrides when present, else role defaults. */
export async function resolveUserPagePermissions(
  userId: number,
  role: Role | string
): Promise<AdminPagePermissionRow[]> {
  const [defaults, overrides] = await Promise.all([
    fetchRolePermissionDefaults(role),
    fetchUserPermissionOverrides(userId),
  ]);

  if (overrides.size === 0) return defaults;

  return defaults.map((page) => {
    const override = overrides.get(page.pageKey);
    if (!override) return page;
    return {
      pageKey: page.pageKey,
      label: page.label,
      ...override,
    };
  });
}

export async function fetchEmployeePermissionsBundle(
  userId: number
): Promise<EmployeePermissionsBundle | null> {
  const user = await queryOne<{
    id: number;
    full_name: string;
    role: Role;
  }>(
    `SELECT id, full_name, role
       FROM temp_users
      WHERE id = $1`,
    [userId]
  );
  if (!user) return null;

  const [pages, isCustomized] = await Promise.all([
    resolveUserPagePermissions(user.id, user.role),
    userHasCustomPermissions(user.id),
  ]);

  return {
    userId: user.id,
    fullName: user.full_name,
    role: user.role,
    isCustomized,
    pages,
  };
}

export async function saveEmployeePermissions(
  input: SaveEmployeePermissionsInput
): Promise<void> {
  const user = await queryOne<{ id: number }>(
    `SELECT id FROM temp_users WHERE id = $1`,
    [input.userId]
  );
  if (!user) throw new Error("That employee was not found.");

  const pages = await fetchAdminPermissionPages();
  const byKey = new Map(input.pages.map((page) => [page.pageKey, page]));

  await query(`DELETE FROM temp_user_permissions WHERE user_id = $1`, [
    input.userId,
  ]);

  for (const page of pages) {
    const next = byKey.get(page.pageKey) ?? EMPTY_CRUD;
    await query(
      `INSERT INTO temp_user_permissions (
         user_id, page_key, can_create, can_read, can_update, can_delete, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        input.userId,
        page.pageKey,
        next.canCreate,
        next.canRead,
        next.canUpdate,
        next.canDelete,
      ]
    );
  }
}

export async function resetEmployeePermissionsToRoleDefaults(
  userId: number
): Promise<void> {
  await query(`DELETE FROM temp_user_permissions WHERE user_id = $1`, [userId]);
}

export function permissionAllows(
  pages: AdminPagePermissionRow[],
  pageKey: AdminPermissionPageKey,
  action: keyof AdminPermissionCrud
): boolean {
  const page = pages.find((item) => item.pageKey === pageKey);
  if (!page) return false;
  return Boolean(page[action]);
}

export { ADMIN_NAV_PAGES, adminHrefForPage } from "@/lib/admin-nav-pages";
