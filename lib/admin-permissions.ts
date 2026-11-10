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

/** Admin workspace pages (admin, HOO, Operation Manager). */
const ADMIN_PAGE_KEYS: AdminPermissionPageKey[] = [
  "overview",
  "employees",
  "extract",
  "spare",
  "strategy",
  "activity",
];

/** Country Manager pages (/manager). */
export const MANAGER_PAGE_KEYS: AdminPermissionPageKey[] = [
  "manager_team",
  "manager_coverage",
  "manager_spare",
];

const PAGE_KEYS: AdminPermissionPageKey[] = [
  ...ADMIN_PAGE_KEYS,
  ...MANAGER_PAGE_KEYS,
];

/** Labels and order in code, so the matrix works before migration 0025 is run. */
const PAGE_CATALOG: Record<
  AdminPermissionPageKey,
  { label: string; sortOrder: number }
> = {
  overview: { label: "Overview", sortOrder: 10 },
  employees: { label: "Employees", sortOrder: 20 },
  extract: { label: "Data extract", sortOrder: 30 },
  spare: { label: "Spare accounts", sortOrder: 40 },
  strategy: { label: "Strategy", sortOrder: 50 },
  activity: { label: "Activity", sortOrder: 60 },
  manager_team: { label: "Your team (employees & accounts)", sortOrder: 110 },
  manager_coverage: { label: "Planned coverage", sortOrder: 120 },
  manager_spare: { label: "Spare accounts", sortOrder: 130 },
};

/** Which pages a role is managed by: CMs get their own pages, admins the admin ones. */
export function permissionPageKeysForRole(
  role: Role | string,
): AdminPermissionPageKey[] {
  return normalizeRoleValue(role) === "manager"
    ? MANAGER_PAGE_KEYS
    : ADMIN_PAGE_KEYS;
}

/**
 * Built-in defaults (migrations 0022 / 0025 mirror these). Country Managers keep
 * what they could already do: everything on their team, read coverage, mark spare.
 */
function codeRoleDefault(
  role: string,
  pageKey: AdminPermissionPageKey,
): AdminPermissionCrud {
  if (role === "manager") {
    if (pageKey === "manager_team") {
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    }
    if (pageKey === "manager_coverage") return { ...EMPTY_CRUD, canRead: true };
    if (pageKey === "manager_spare") {
      return { ...EMPTY_CRUD, canRead: true, canUpdate: true };
    }
    return EMPTY_CRUD;
  }
  if (role === "admin") {
    return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
  }
  if (role === "hoo") {
    const strategy = pageKey === "strategy";
    const extractOrActivity = pageKey === "extract" || pageKey === "activity";
    const employees = pageKey === "employees";
    return {
      canCreate: employees,
      canRead: true,
      canUpdate: !strategy && !extractOrActivity,
      canDelete: employees,
    };
  }
  if (role === "op") return { ...EMPTY_CRUD, canRead: true };
  return EMPTY_CRUD;
}

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

export async function fetchAdminPermissionPages(): Promise<
  AdminPermissionPage[]
> {
  const rows = await query<{
    page_key: string;
    label: string;
    sort_order: number;
  }>(
    `SELECT page_key, label, sort_order
       FROM admin_permission_pages
      ORDER BY sort_order ASC, page_key ASC`,
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

/** The role's pages, each from the DB default when there is one, else the code default. */
export async function fetchRolePermissionDefaults(
  role: Role | string,
): Promise<AdminPagePermissionRow[]> {
  const normalized = normalizeRoleValue(role);
  let rows: PermissionDbRow[] = [];
  try {
    rows = await query<PermissionDbRow>(
      `SELECT d.page_key,
              p.label,
              p.sort_order,
              d.can_create,
              d.can_read,
              d.can_update,
              d.can_delete
         FROM admin_role_permission_defaults d
         INNER JOIN admin_permission_pages p ON p.page_key = d.page_key
        WHERE d.role = $1`,
      [normalized],
    );
  } catch {
    rows = [];
  }
  const fromDb = new Map<string, PermissionDbRow>();
  for (const row of rows) fromDb.set(row.page_key, row);

  return permissionPageKeysForRole(normalized).map((pageKey) => {
    const row = fromDb.get(pageKey);
    return {
      pageKey,
      label: PAGE_CATALOG[pageKey].label,
      ...(row ? mapCrud(row) : codeRoleDefault(normalized, pageKey)),
    };
  });
}

export async function userHasCustomPermissions(
  userId: number,
): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM temp_user_permissions WHERE user_id = $1
     ) AS exists`,
    [userId],
  );
  return Boolean(row?.exists);
}

export async function fetchUserPermissionOverrides(
  userId: number,
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
    [userId],
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
  role: Role | string,
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
  userId: number,
): Promise<EmployeePermissionsBundle | null> {
  const user = await queryOne<{
    id: number;
    full_name: string;
    role: Role;
  }>(
    `SELECT id, full_name, role
       FROM temp_users
      WHERE id = $1`,
    [userId],
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
  input: SaveEmployeePermissionsInput,
): Promise<void> {
  const user = await queryOne<{ id: number; role: Role }>(
    `SELECT id, role FROM temp_users WHERE id = $1`,
    [input.userId],
  );
  if (!user) throw new Error("That employee was not found.");

  const roleKeys = permissionPageKeysForRole(user.role);
  const inDb = new Set(
    (await fetchAdminPermissionPages()).map((page) => page.pageKey),
  );
  if (roleKeys.some((key) => !inDb.has(key))) {
    throw new Error(
      "Country Manager permissions need the database update first (migration 0025).",
    );
  }
  const pages = roleKeys.map((pageKey) => ({ pageKey }));
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
      ],
    );
  }
}

export async function resetEmployeePermissionsToRoleDefaults(
  userId: number,
): Promise<void> {
  await query(`DELETE FROM temp_user_permissions WHERE user_id = $1`, [userId]);
}

export function permissionAllows(
  pages: AdminPagePermissionRow[],
  pageKey: AdminPermissionPageKey,
  action: keyof AdminPermissionCrud,
): boolean {
  const page = pages.find((item) => item.pageKey === pageKey);
  if (!page) return false;
  return Boolean(page[action]);
}

export { ADMIN_NAV_PAGES, adminHrefForPage } from "@/lib/admin-nav-pages";
