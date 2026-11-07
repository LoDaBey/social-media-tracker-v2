"use server";

import { requirePagePermission } from "@/lib/admin-access";
import {
  fetchAdminActionLogs,
  LOG_PAGE_SIZE,
  parseOrbitLogFilters,
  scopeLogsForViewer,
} from "@/lib/admin-logs-data";
import type {
  AdminLogsPage,
  OrbitLogCursor,
  OrbitLogListFilters,
} from "@/types/logs";

/** One batch of Activity entries, scoped to the viewer. Used on load and on scroll. */
export async function loadAdminLogsPage(
  filters: OrbitLogListFilters,
  before: OrbitLogCursor | null
): Promise<AdminLogsPage> {
  const viewer = await requirePagePermission("activity", "canRead");
  const safeFilters = parseOrbitLogFilters({
    q: filters.q,
    action: filters.action,
    resource: filters.resource,
  });
  const raw = await fetchAdminActionLogs(safeFilters, before);
  const last = raw[raw.length - 1];
  return {
    rows: scopeLogsForViewer(raw, viewer.role === "op" ? viewer.scope : null),
    nextCursor:
      raw.length === LOG_PAGE_SIZE && last
        ? { createdAt: last.createdAt, id: last.id }
        : null,
  };
}
