import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  fetchQcKpis,
  fetchQcQueue,
  parseQcSearchParams,
} from "@/lib/qc-data";
import type { Role } from "@/types/db";
import type { QcReviewerRole } from "@/types/qc";
import { QcKpiStrip } from "@/components/qc/QcKpiStrip";
import { QcQueueFilters } from "@/components/qc/QcQueueFilters";
import { QcQueueItem } from "@/components/qc/QcQueueItem";
import { QcDetailPanel } from "@/components/qc/QcDetailPanel";

type SearchParamsShape = Promise<{
  selected?: string | string[];
  status?: string | string[];
  platform?: string | string[];
  q?: string | string[];
}>;

function pickSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildHrefSearch(
  current: { status: string; platform?: string; q?: string },
  selectedId: number
) {
  const params = new URLSearchParams();
  params.set("status", current.status);
  if (current.platform) params.set("platform", current.platform);
  if (current.q) params.set("q", current.q);
  params.set("selected", String(selectedId));
  return params.toString();
}

function statusBadgeLabel(role: QcReviewerRole) {
  return role === "admin" ? "QC · Admin" : "QC · Team Lead";
}

export default async function QcPage({
  searchParams,
}: {
  searchParams: SearchParamsShape;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const reviewerRole = (session.user?.role ?? "employee") as Role;
  if (reviewerRole !== "team_lead" && reviewerRole !== "admin") {
    redirect("/dashboard");
  }

  const reviewerId = Number(session.user?.id);
  if (!Number.isFinite(reviewerId)) redirect("/login");

  const sp = (await searchParams) ?? {};
  const params = parseQcSearchParams({
    selected: pickSingle(sp.selected),
    status: pickSingle(sp.status),
    platform: pickSingle(sp.platform),
    q: pickSingle(sp.q),
  });

  const [kpis, queue] = await Promise.all([
    fetchQcKpis({ reviewerId, reviewerRole: reviewerRole as QcReviewerRole }),
    fetchQcQueue({
      reviewerId,
      reviewerRole: reviewerRole as QcReviewerRole,
      params,
    }),
  ]);

  const selectedRow =
    queue.find((row) => row.growth_id === params.selected) ?? queue[0] ?? null;

  return (
    <main className="w-full">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[32px] font-extrabold leading-tight text-[var(--color-ink)]">
            Review queue
          </h1>
          <span
            className="rounded-full bg-[var(--color-emerald)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
            aria-label={`Reviewer role: ${statusBadgeLabel(reviewerRole as QcReviewerRole)}`}
          >
            {statusBadgeLabel(reviewerRole as QcReviewerRole)}
          </span>
        </div>
        <p className="text-[13px] font-medium text-[var(--color-muted)]">
          Pick a submission, score it against the targets, then approve or reject.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,32%)_1fr]">
        <aside className="flex flex-col gap-4" aria-label="Review queue">
          <QcKpiStrip kpis={kpis} />

          <QcQueueFilters />

          <div
            className="flex max-h-[68vh] flex-col gap-2 overflow-y-auto pr-1"
            role="list"
            aria-label={`Submissions (${queue.length})`}
          >
            {queue.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-10 text-center text-[13px] font-medium text-[var(--color-muted)]">
                Nothing matches the current filters.
              </p>
            ) : (
              queue.map((row) => (
                <QcQueueItem
                  key={row.growth_id}
                  row={row}
                  isSelected={selectedRow?.growth_id === row.growth_id}
                  hrefSearch={buildHrefSearch(
                    {
                      status: params.status,
                      platform: params.platform,
                      q: params.q,
                    },
                    row.growth_id
                  )}
                />
              ))
            )}
          </div>
        </aside>

        <div className="min-w-0">
          <QcDetailPanel row={selectedRow} />
        </div>
      </div>
    </main>
  );
}
