import type { ReactNode } from "react";
import type {
  AccountHolderOption,
  AdminCountryCoverage,
  AdminSpareAccountListItem,
  BulkImportHolderOption,
  SpareMarkHolderOption,
  UpdateEmployeeTargetsPayload,
} from "@/types/admin";
import type { AdminPermissionCrud } from "@/types/permissions";
import type { WeeklyCheck } from "@/types/weekly-checks";
import type { EmploymentStatus, Platform, AccountScope } from "@/types/db";

export type ManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
  region: string | null;
  home_country: string | null;
};

export type ManagerAccountListItem = {
  id: number;
  platform: Platform;
  account_name: string;
  account_handle: string | null;
  username: string | null;
  account_url: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  category: string | null;
  account_scope: AccountScope;
  status: "active" | "archived" | "suspended";
  is_spare: boolean;
  /** This week's check (Monday to Sunday); null = not checked yet. */
  weekly_check: WeeklyCheck | null;
};

export type ManagerHolderRow = {
  id: number;
  full_name: string;
  email: string;
  country: string;
  language: string | null;
  region: string | null;
  employment_status: EmploymentStatus;
  targets: UpdateEmployeeTargetsPayload;
  targetAccountsSum: number;
  accountTotal: number;
  accounts: ManagerAccountListItem[];
};

/** What this Country Manager may do on each of their pages (Access matrix). */
export type ManagerPermissions = {
  team: AdminPermissionCrud;
  coverage: AdminPermissionCrud;
  spare: AdminPermissionCrud;
};

export type ManagerEmployeeProfilePayload = {
  full_name: string;
  email: string;
  language: string;
  targets: UpdateEmployeeTargetsPayload;
};

export type ManagerEmployeeEditButtonProps = {
  row: ManagerHolderRow;
};

export type ManagerAddAccountButtonProps = {
  holderId: number;
  fullName: string;
  holderOptions: AccountHolderOption[];
};

export type ManagerCountryGroup = {
  country: string;
  holders: ManagerHolderRow[];
};

export type ManagerHomeTableProps = {
  groups: ManagerCountryGroup[];
};

export type ManagerHomeProps = {
  groups: ManagerCountryGroup[];
  permissions: ManagerPermissions;
  coverage: AdminCountryCoverage;
  spareAccounts: AdminSpareAccountListItem[];
  spareHolders: SpareMarkHolderOption[];
};

export type ManagerHomeTab = "team" | "coverage";

export type ManagerHomeTabsProps = {
  teamPanel: ReactNode;
  /** Null when the CM has no Planned coverage access: the tab is hidden. */
  coveragePanel: ReactNode | null;
  actions?: ReactNode;
};

export type ManagerCoveragePanelProps = {
  coverage: AdminCountryCoverage;
};

export type ManagerTeamRowProps = {
  row: ManagerHolderRow;
  holderOptions: AccountHolderOption[];
  importHolders: BulkImportHolderOption[];
  allowedCountries: string[];
};

export type ManagerAccountsPanelProps = {
  holderId: number;
  fullName: string;
  country: string;
  language: string | null;
  accounts: ManagerAccountListItem[];
  assignedCount: number;
  holderOptions: AccountHolderOption[];
  importHolders: BulkImportHolderOption[];
  allowedCountries: string[];
};

export type ManagerAccountsTableProps = {
  holderId: number;
  fullName: string;
  country: string;
  language: string | null;
  accounts: ManagerAccountListItem[];
  holderOptions: AccountHolderOption[];
};

export type ManagerAccountRowProps = {
  holderId: number;
  fullName: string;
  country: string;
  language: string | null;
  account: ManagerAccountListItem;
  holderOptions: AccountHolderOption[];
};

export type ManagerAccountDeleteButtonProps = {
  accountId: number;
  accountName: string;
  holderName: string;
  country: string;
};

export type ManagerTeamTotals = {
  added: number;
  assigned: number;
};

export type ManagerCountryTotal = {
  country: string;
  added: number;
  assigned: number;
};

export type ManagerTeamHeaderProps = {
  /** This week's account check-up progress. */
  weekly: { checked: number; total: number; endsLabel: string };
  holderCount: number;
  overall: ManagerTeamTotals;
  countries: ManagerCountryTotal[];
  importHolders: BulkImportHolderOption[];
  allowedCountries: string[];
};

export type ManagerBulkImportButtonProps = {
  holders: BulkImportHolderOption[];
  allowedCountries: string[];
  initialHolderId?: number;
  variant?: "icon" | "button";
};

export type ManagerEmployeeStatusSelectProps = {
  employeeId: number;
  fullName: string;
  status: EmploymentStatus;
  /** No "Your team · Update" permission. */
  disabled?: boolean;
};
