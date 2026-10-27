import { query } from "@/lib/db";
import {
  ORBIT_LOG_ACTIONS,
  ORBIT_LOG_RESOURCES,
  type OrbitActionLogRow,
  type OrbitLogAction,
  type OrbitLogListFilters,
  type OrbitLogResource,
} from "@/types/logs";

const LOG_LIMIT = 400;

type LogDbRow = {
  id: number;
  created_at: Date | string;
  actor_id: number | null;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  summary: string;
  details: unknown;
};

function isOrbitLogAction(value: string): value is OrbitLogAction {
  return (ORBIT_LOG_ACTIONS as readonly string[]).includes(value);
}

function isOrbitLogResource(value: string): value is OrbitLogResource {
  return (ORBIT_LOG_RESOURCES as readonly string[]).includes(value);
}

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function asDetails(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapRow(row: LogDbRow): OrbitActionLogRow {
  return {
    id: row.id,
    createdAt: asIso(row.created_at),
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    action: isOrbitLogAction(row.action) ? row.action : "update",
    resource: isOrbitLogResource(row.resource) ? row.resource : "auth",
    summary: row.summary,
    details: asDetails(row.details),
  };
}

export function parseOrbitLogFilters(params: {
  q?: string;
  action?: string;
  resource?: string;
}): OrbitLogListFilters {
  const q = params.q?.trim() ?? "";
  const actionRaw = params.action?.trim() ?? "all";
  const resourceRaw = params.resource?.trim() ?? "all";
  return {
    q,
    action: isOrbitLogAction(actionRaw) ? actionRaw : "all",
    resource: isOrbitLogResource(resourceRaw) ? resourceRaw : "all",
  };
}

export async function fetchAdminActionLogs(
  filters: OrbitLogListFilters
): Promise<OrbitActionLogRow[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.action && filters.action !== "all") {
    values.push(filters.action);
    clauses.push(`action = $${values.length}`);
  }
  if (filters.resource && filters.resource !== "all") {
    values.push(filters.resource);
    clauses.push(`resource = $${values.length}`);
  }
  const q = filters.q?.trim() ?? "";
  if (q) {
    values.push(`%${q}%`);
    const i = values.length;
    clauses.push(
      `(summary ILIKE $${i} OR actor_name ILIKE $${i} OR actor_email ILIKE $${i})`
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  values.push(LOG_LIMIT);

  try {
    const rows = await query<LogDbRow>(
      `SELECT id, created_at, actor_id, actor_name, actor_email, actor_role,
              action, resource, summary, details
         FROM temp_action_logs
         ${where}
        ORDER BY created_at DESC, id DESC
        LIMIT $${values.length}`,
      values
    );
    return rows.map(mapRow);
  } catch (error) {
    console.error("fetchAdminActionLogs failed", error);
    return [];
  }
}
