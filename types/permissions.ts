import type { Role } from "@/types/db";

export type AdminPermissionPageKey =
  | "overview"
  | "employees"
  | "extract"
  | "spare"
  | "strategy"
  | "activity"
  | "checks"
  // Country Manager pages (/manager).
  | "manager_team"
  | "manager_coverage"
  | "manager_spare";

export type AdminPermissionCrud = {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type AdminPermissionAction = keyof AdminPermissionCrud;

export type AdminPermissionPage = {
  pageKey: AdminPermissionPageKey;
  label: string;
  sortOrder: number;
};

export type AdminPagePermissionRow = AdminPermissionCrud & {
  pageKey: AdminPermissionPageKey;
  label: string;
};

export type EmployeePermissionsBundle = {
  userId: number;
  fullName: string;
  role: Role;
  /** True when temp_user_permissions has at least one row for this user. */
  isCustomized: boolean;
  pages: AdminPagePermissionRow[];
};

export type SaveEmployeePermissionsInput = {
  userId: number;
  pages: Array<
    AdminPermissionCrud & {
      pageKey: AdminPermissionPageKey;
    }
  >;
};

export type SaveEmployeePermissionsResult =
  | { ok: true }
  | { ok: false; error: string };

export type EmployeePermissionsButtonProps = {
  userId: number;
  fullName: string;
  role: Role;
  source: "temp" | "alphaa";
};

export type EmployeePermissionsModalProps = {
  open: boolean;
  userId: number;
  fullName: string;
  role: Role;
  onClose: () => void;
};

export type EmployeePermissionsMatrixProps = {
  pages: AdminPagePermissionRow[];
  disabled?: boolean;
  onChange: (pageKey: AdminPermissionPageKey, next: AdminPermissionCrud) => void;
};
