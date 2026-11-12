import type { Platform } from "@/types/db";

export type WeeklyCheckResult = "ok" | "issue";

/** One day's check on one account (null = not checked yet). Checks are daily. */
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
  /** Accounts added or edited that day. */
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
  changedThatDay: boolean;
  check: WeeklyCheck | null;
};

export type AdminWeeklyChecksData = {
  /** The day shown (YYYY-MM-DD, Cairo). */
  date: string;
  isToday: boolean;
  /** Set when the page is limited to one Country Manager's team. */
  manager: { id: number; name: string } | null;
  kpis: WeeklyCheckKpis;
  managers: WeeklyCheckManagerProgress[];
  rows: WeeklyCheckAccountRow[];
  /** All accounts marked Problem that day, with their notes. */
  problems: WeeklyCheckAccountRow[];
  /** Rows matching the filter before the display limit. */
  matching: number;
  countries: string[];
};

export type AdminWeeklyChecksFilters = {
  filter: WeeklyCheckFilter;
  country: string;
  q: string;
  /** YYYY-MM-DD; today when empty. */
  date: string;
  /** Only this Country Manager's team. */
  managerId: number | null;
};

export type AdminWeeklyChecksFiltersProps = Pick<
  AdminWeeklyChecksFilters,
  "filter" | "country" | "q"
> & {
  countries: string[];
};

/** Per Country Manager: accounts left unchecked on a day (OP notifications). */
export type DailyCheckMissedSummary = {
  managerId: number;
  managerName: string;
  unchecked: number;
  total: number;
};

export type AdminWeeklyChecksTableProps = {
  rows: WeeklyCheckAccountRow[];
  matching: number;
  filter: WeeklyCheckFilter;
  isToday: boolean;
};

export type ManagerWeeklyCheckCellProps = {
  accountId: number;
  accountName: string;
  check: WeeklyCheck | null;
  canUpdate: boolean;
};

export type WeeklyChecksProblemsCardProps = {
  count: number;
  problems: WeeklyCheckAccountRow[];
};
