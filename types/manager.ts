import type { Platform } from "@/types/db";

export type ManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
};

export type ManagerAccountListItem = {
  id: number;
  platform: Platform;
  account_name: string;
  username: string | null;
  account_url: string;
  category: string | null;
  status: "active" | "archived" | "suspended";
};

export type ManagerHolderRow = {
  id: number;
  full_name: string;
  email: string;
  country: string;
  language: string | null;
  setupComplete: boolean;
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
};

export type ManagerAccountsPanelProps = {
  fullName: string;
  accounts: ManagerAccountListItem[];
  assignedCount: number;
};

export type ManagerAccountsTableProps = {
  accounts: ManagerAccountListItem[];
};

export type ManagerAccountRowProps = {
  account: ManagerAccountListItem;
};

export type ManagerSetupActionButtonProps = {
  href: string;
  setupComplete: boolean;
  fullName: string;
};
