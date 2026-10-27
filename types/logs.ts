export const ORBIT_LOG_ACTIONS = [
  "sign_in",
  "sign_out",
  "password_change",
  "create",
  "update",
  "delete",
  "import",
  "approve",
  "reject",
  "submit",
  "sync",
  "spare",
  "fit_to_plan",
  "strategy",
] as const;

export type OrbitLogAction = (typeof ORBIT_LOG_ACTIONS)[number];

export const ORBIT_LOG_RESOURCES = [
  "auth",
  "employee",
  "account",
  "submission",
  "qc",
  "setup",
  "sheets",
  "strategy",
  "coverage",
] as const;

export type OrbitLogResource = (typeof ORBIT_LOG_RESOURCES)[number];

export type OrbitLogActor = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type OrbitLogWriteInput = {
  action: OrbitLogAction;
  resource: OrbitLogResource;
  summary: string;
  details?: Record<string, unknown> | null;
  actor?: OrbitLogActor | null;
};

export type OrbitActionLogRow = {
  id: number;
  createdAt: string;
  actorId: number | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: OrbitLogAction;
  resource: OrbitLogResource;
  summary: string;
  details: Record<string, unknown> | null;
};

export type OrbitLogListFilters = {
  q?: string;
  action?: OrbitLogAction | "all";
  resource?: OrbitLogResource | "all";
};

export type AdminLogsTableProps = {
  rows: OrbitActionLogRow[];
};

export type AdminLogsFiltersProps = {
  q: string;
  action: OrbitLogAction | "all";
  resource: OrbitLogResource | "all";
};
