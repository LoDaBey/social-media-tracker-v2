import type { AccountHolderOption } from "@/types/admin";
import type { EmploymentStatus, Platform } from "@/types/db";

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
  status: "active" | "archived" | "suspended";
};

export type ManagerHolderRow = {
  id: number;
  full_name: string;
  email: string;
  country: string;
  language: string | null;
  employee_code: string | null;
  employment_status: EmploymentStatus;
  setupComplete: boolean;
  setupNeedsReview: boolean;
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

export type ManagerTeamRowProps = {
  row: ManagerHolderRow;
  holderOptions: AccountHolderOption[];
};

export type ManagerAccountsPanelProps = {
  holderId: number;
  fullName: string;
  country: string;
  language: string | null;
  accounts: ManagerAccountListItem[];
  assignedCount: number;
  holderOptions: AccountHolderOption[];
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
  pendingCount: number;
  overall: ManagerTeamTotals;
  countries: ManagerCountryTotal[];
};

export type ManagerSetupActionButtonProps = {
  href: string;
  setupComplete: boolean;
  setupNeedsReview: boolean;
  fullName: string;
};

export type ManagerSetupStatusBadgeProps = {
  setupComplete: boolean;
  setupNeedsReview: boolean;
};

export type ManagerBulkImportButtonProps = {
  holder: {
    id: number;
    full_name: string;
    country: string;
    language: string | null;
  };
  variant?: "icon" | "button";
};

export type ManagerBulkImportModalProps = {
  open: boolean;
  holder: ManagerBulkImportButtonProps["holder"];
  onClose: () => void;
};
