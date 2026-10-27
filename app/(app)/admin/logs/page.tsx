import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { fetchAdminActionLogs, parseOrbitLogFilters } from "@/lib/admin-logs-data";
import { adminViewLogs } from "@/lib/admin-view";
import { AdminLogsFilters } from "./components/AdminLogsFilters";
import { AdminLogsTable } from "./components/AdminLogsTable";

export const metadata: Metadata = {
  title: "Activity log",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const filters = parseOrbitLogFilters({
    q: firstParam(params.q),
    action: firstParam(params.action),
    resource: firstParam(params.resource),
  });
  const rows = await fetchAdminActionLogs(filters);

  return (
    <AdminWorkspace view={adminViewLogs()}>
      <div className="flex flex-col gap-4">
        <p className="text-[14px] text-[var(--color-muted)]">
          Every create, update, import, sign-in, and review action recorded in Orbit.
        </p>
        <AdminLogsFilters
          q={filters.q ?? ""}
          action={filters.action ?? "all"}
          resource={filters.resource ?? "all"}
        />
        <AdminLogsTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
