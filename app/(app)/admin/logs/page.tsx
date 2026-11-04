import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminViewerOrNull } from "@/lib/admin-access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { fetchAdminActionLogs, parseOrbitLogFilters } from "@/lib/admin-logs-data";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
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
  const viewer = await getAdminViewerOrNull();
  if (!viewer) redirect("/login");

  const params = (await searchParams) ?? {};
  const filters = parseOrbitLogFilters({
    q: firstParam(params.q),
    action: firstParam(params.action),
    resource: firstParam(params.resource),
  });
  let rows = await fetchAdminActionLogs(filters);

  if (viewer.role === "op" && viewer.scope) {
    const allowed = new Set(viewer.scope.countries);
    rows = rows.filter((row) => {
      const countryRaw = row.details?.country;
      if (typeof countryRaw !== "string" || !countryRaw.trim()) return false;
      const base = baseCountryFromDisplay(countryRaw);
      return allowed.has(base) || allowed.has(countryRaw.trim());
    });
  }

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
        <AdminLogsTable rows={rows} />
      </div>
    </AdminWorkspace>
  );
}
