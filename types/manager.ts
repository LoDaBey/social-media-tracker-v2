import type { ReactNode } from "react";
import type {
  AccountHolderOption,
  AdminCountryCoverage,
  AdminSpareAccountListItem,
  BulkImportHolderOption,
  SpareMarkHolderOption,
} from "@/types/admin";
import type { EmploymentStatus, Platform, AccountScope } from "@/types/db";

export type ManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
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
};

export type ManagerHolderRow = {
  id: number;
  full_name: string;
  email: string;
  country: string;
  language: string | null;
  employment_status: EmploymentStatus;
  targetAccountsSum: number;
  accountTotal: number;
  accounts: ManagerAccountListItem[];
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
  coverage: AdminCountryCoverage;
  spareAccounts: AdminSpareAccountListItem[];
  spareHolders: SpareMarkHolderOption[];
};

export type ManagerHomeTab = "team" | "coverage";

export type ManagerHomeTabsProps = {
  teamPanel: ReactNode;
  coveragePanel: ReactNode;
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
};
