import { Activity, CheckCircle2, Gift, RefreshCw } from "lucide-react";
import {
  fetchAdminOverviewKpis,
  fetchAdminRecentActivity,
} from "@/lib/admin-data";
import { AdminKpiTile } from "@/components/admin/AdminKpiTile";
import { AdminOverviewActions } from "@/components/admin/AdminOverviewActions";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewOverview } from "@/lib/admin-view";
import { formatShortDate } from "@/lib/cairo-date";

function activityIcon(kind: string) {
  if (kind === "submission") return Activity;
  if (kind === "approval") return CheckCircle2;
  if (kind === "rejection") return CheckCircle2;
  if (kind === "bonus") return Gift;
  return RefreshCw;
}

export default async function AdminOverviewPage() {
  const [kpis, activity] = await Promise.all([
    fetchAdminOverviewKpis(),
    fetchAdminRecentActivity(),
  ]);

  return (
    <AdminWorkspace view={adminViewOverview()}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <AdminOverviewActions />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <AdminKpiTile
            icon="users"
            title="Active employees"
            value={String(kpis.activeEmployees)}
          />
          <AdminKpiTile
            icon="clipboard"
            title="Pending QC"
            value={String(kpis.pendingQc)}
          />
          <AdminKpiTile
            icon="wallet"
            title="Deductions"
            value={`${Math.round(kpis.deductionsThisMonth).toLocaleString("en-US")} EGP`}
          />
          <AdminKpiTile
            icon="refresh"
            title="Auto-resets"
            value={String(kpis.autoResetsThisWeek)}
          />
        </div>

        <section
          className="rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-6"
          style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
          aria-label="Recent activity"
        >
          <h2 className="text-[18px] font-bold text-[var(--color-ink)]">Recent activity</h2>
          <ul className="mt-3 flex flex-col gap-3 sm:mt-4">
            {activity.length === 0 ? (
              <li className="text-[14px] text-[var(--color-muted)]">No recent events.</li>
            ) : (
              activity.map((row, i) => {
                const Icon = activityIcon(row.kind);
                return (
                  <li
                    key={`${row.created_at}-${i}`}
                    className="flex gap-3 rounded-xl border border-[var(--color-hairline)] px-4 py-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
                      aria-hidden="true"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--color-ink)]">
                        {row.description}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                        {formatShortDate(row.created_at)} · {row.actor_label}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </AdminWorkspace>
  );
}
