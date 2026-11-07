import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/lib/admin-access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { parseOrbitLogFilters } from "@/lib/admin-logs-data";
import { loadAdminLogsPage } from "@/actions/admin-logs";
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
  const viewer = await requireAdminPageAccess("activity");

  const params = (await searchParams) ?? {};
  const filters = parseOrbitLogFilters({
    q: firstParam(params.q),
    action: firstParam(params.action),
    resource: firstParam(params.resource),
  });
  // First 50 only; the table asks for more as you scroll.
  const firstPage = await loadAdminLogsPage(filters, null);

  return (
    <AdminWorkspace view={adminViewLogs()}>
      <div className="flex flex-col gap-4">
        <p className="text-[14px] text-[var(--color-muted)]">
          {viewer.role === "op"
            ? "Activity for employees and accounts in your assigned project countries."
            : "Every create, update, import, sign-in, and review action recorded in Orbit."}
        </p>
        <AdminLogsFilters
          q={filters.q ?? ""}
          action={filters.action ?? "all"}
          resource={filters.resource ?? "all"}
        />
        <AdminLogsTable
          key={`${filters.q}|${filters.action}|${filters.resource}`}
          rows={firstPage.rows}
          nextCursor={firstPage.nextCursor}
          filters={filters}
        />
      </div>
    </AdminWorkspace>
  );
}
