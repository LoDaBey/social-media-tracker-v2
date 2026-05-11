import Link from "next/link";
import { Activity, CheckCircle2, Gift, RefreshCw } from "lucide-react";
import {
  fetchAdminHealthMetrics,
  fetchAdminOverviewKpis,
  fetchAdminRecentActivity,
} from "@/lib/admin-data";
import { AdminKpiTile } from "@/components/admin/AdminKpiTile";
import { formatShortDate } from "@/lib/cairo-date";

function activityIcon(kind: string) {
  if (kind === "submission") return Activity;
  if (kind === "approval") return CheckCircle2;
  if (kind === "rejection") return CheckCircle2;
  if (kind === "bonus") return Gift;
  return RefreshCw;
}

export default async function AdminOverviewPage() {
  const [kpis, activity, health] = await Promise.all([
    fetchAdminOverviewKpis(),
    fetchAdminRecentActivity(),
    fetchAdminHealthMetrics(),
  ]);

  const rateLabel =
    health.submissionCompletionRate == null
      ? "—"
      : `${Math.round(health.submissionCompletionRate * 100)}%`;

  const turnaround =
    health.avgQcTurnaroundHours == null
      ? "—"
      : health.avgQcTurnaroundHours < 48
        ? `${health.avgQcTurnaroundHours.toFixed(1)} hours`
        : `${(health.avgQcTurnaroundHours / 24).toFixed(1)} days`;

  return (
    <main className="flex flex-col gap-10">
      <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">Admin overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiTile title="Active employees" value={String(kpis.activeEmployees)} />
        <AdminKpiTile title="Pending QC reviews" value={String(kpis.pendingQc)} />
        <AdminKpiTile
          title="Deductions this month"
          value={`${Math.round(kpis.deductionsThisMonth).toLocaleString("en-US")} EGP`}
        />
        <AdminKpiTile title="Auto-resets this week" value={String(kpis.autoResetsThisWeek)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-[16px] bg-[var(--color-surface)] p-6"
          style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
          aria-label="Recent activity"
        >
          <h2 className="text-[18px] font-bold text-[var(--color-ink)]">Recent activity</h2>
          <ul className="mt-4 flex flex-col gap-3">
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

        <section
          className="rounded-[16px] bg-[var(--color-surface)] p-6"
          style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
          aria-label="Operational health"
        >
          <h2 className="text-[18px] font-bold text-[var(--color-ink)]">Health</h2>
          <dl className="mt-4 flex flex-col gap-4">
            <div className="rounded-xl border border-[var(--color-hairline)] px-4 py-3">
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Avg QC turnaround
              </dt>
              <dd className="mt-1 text-[16px] font-bold text-[var(--color-ink)]">{turnaround}</dd>
              <dd className="mt-1 text-[12px] text-[var(--color-muted)]">
                Approved rows, last 7 days
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--color-hairline)] px-4 py-3">
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Submission completion rate
              </dt>
              <dd className="mt-1 text-[16px] font-bold text-[var(--color-ink)]">{rateLabel}</dd>
              <dd className="mt-1 text-[12px] text-[var(--color-muted)]">
                Non-pending / all rows (last 7 days by submission date)
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--color-hairline)] px-4 py-3">
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Last auto-reset job
              </dt>
              <dd className="mt-1 text-[16px] font-bold text-[var(--color-ink)]">
                {health.lastCronRunLabel ?? "—"}
              </dd>
              <dd className="mt-1 text-[12px] text-[var(--color-muted)]">
                From latest <code className="text-[12px]">is_auto_reset</code> growth row
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/employees/new"
          aria-label="Create a new employee account"
          className="inline-flex cursor-pointer rounded-lg bg-[var(--color-emerald)] px-5 py-2.5 text-[14px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          + Create employee
        </Link>
        <Link
          href="/admin/payouts"
          aria-label="Open payouts to run a payout cycle"
          className="inline-flex cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Run payout cycle
        </Link>
      </div>
    </main>
  );
}
