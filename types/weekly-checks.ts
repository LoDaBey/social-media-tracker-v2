import type { Platform } from "@/types/db";

export type WeeklyCheckResult = "ok" | "issue";

/** This week's check on one account (null = not checked yet). */
export type WeeklyCheck = {
  result: WeeklyCheckResult;
  note: string | null;
  checkedAt: string;
  checkedByName: string | null;
};

export type WeeklyCheckFilter =
  "unchecked" | "issue" | "changed" | "ok" | "all";

export type WeeklyCheckKpis = {
  total: number;
  ok: number;
  issue: number;
  unchecked: number;
  /** Accounts added or edited since Monday. */
  changed: number;
};

export type WeeklyCheckManagerProgress = {
  managerId: number | null;
  managerName: string;
  total: number;
  checked: number;
  issue: number;
};

export type WeeklyCheckAccountRow = {
  accountId: number;
  platform: Platform;
  username: string | null;
  accountName: string;
  accountUrl: string | null;
  status: string;
  holderId: number;
  holderName: string;
  country: string | null;
  region: string | null;
  managerName: string | null;
  changedThisWeek: boolean;
  check: WeeklyCheck | null;
};

export type AdminWeeklyChecksData = {
  weekStart: string;
  weekEnd: string;
  kpis: WeeklyCheckKpis;
  managers: WeeklyCheckManagerProgress[];
  rows: WeeklyCheckAccountRow[];
  /** Rows matching the filter before the display limit. */
  matching: number;
  countries: string[];
};

export type AdminWeeklyChecksFilters = {
  filter: WeeklyCheckFilter;
  country: string;
  q: string;
};

export type AdminWeeklyChecksFiltersProps = AdminWeeklyChecksFilters & {
  countries: string[];
};

export type AdminWeeklyChecksTableProps = {
  rows: WeeklyCheckAccountRow[];
  matching: number;
  filter: WeeklyCheckFilter;
};

export type ManagerWeeklyCheckCellProps = {
  accountId: number;
  accountName: string;
  check: WeeklyCheck | null;
  canUpdate: boolean;
};
