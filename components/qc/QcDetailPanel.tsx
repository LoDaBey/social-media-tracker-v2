import { AlertCircle, ExternalLink, Inbox } from "lucide-react";
import {
  METRIC_LABELS,
  PLATFORM_LABELS,
  PLATFORM_METRICS,
  type Metric,
} from "@/lib/platform-config";
import type { QcQueueRow } from "@/types/qc";
import { QcDecisionForm } from "@/components/qc/QcDecisionForm";

type Props = {
  row: QcQueueRow | null;
};

function initialOf(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function metricSubmittedValue(row: QcQueueRow, metric: Metric): number {
  return Number(row[metric] ?? 0);
}

function metricTargetValue(row: QcQueueRow, metric: Metric): number {
  switch (metric) {
    case "followers":
      return row.target_followers;
    case "posts":
      return row.target_posts;
    case "retweets_with_content":
      return row.target_retweets_with_content;
    case "replies":
      return row.target_replies;
    case "reels":
      return row.target_reels;
  }
}

function formatSubmittedAt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function deltaPill(delta: number) {
  if (delta === 0) {
    return {
      text: "0",
      className:
        "bg-[var(--color-cream-tint)] text-[var(--color-muted)]",
    };
  }
  if (delta > 0) {
    return {
      text: `+${delta.toLocaleString("en-US")}`,
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }
  return {
    text: `−${Math.abs(delta).toLocaleString("en-US")}`,
    className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
  };
}

function EmptyState() {
  return (
    <section
      className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 sm:p-10"
      style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)" }}
      aria-label="No submission selected"
    >
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-emerald-tint)]">
          <Inbox className="h-6 w-6 text-[var(--color-emerald)]" aria-hidden="true" />
        </div>
        <p className="text-[18px] font-bold text-[var(--color-ink)]">
          You&apos;re all caught up
        </p>
        <p className="max-w-md text-[14px] font-medium text-[var(--color-muted)]">
          There&apos;s nothing in this queue right now. Check the other status filters or come
          back after the next submission window.
        </p>
      </div>
    </section>
  );
}

export function QcDetailPanel({ row }: Props) {
  if (!row) {
    return <EmptyState />;
  }

  const metrics = PLATFORM_METRICS[row.account_platform];
  const handle = row.account_handle ?? `@${row.account_name}`;
  const isReadonly = row.qc_status !== "pending";

  return (
    <section
      className="rounded-[var(--radius-card)] bg-[var(--color-surface)]"
      style={{
        padding: 32,
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
      }}
      aria-label={`Review submission from ${row.employee_full_name}`}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[16px] font-bold text-[var(--color-ink)]"
            aria-hidden="true"
          >
            {initialOf(row.employee_full_name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-[22px] font-extrabold leading-tight text-[var(--color-ink)]">
              {row.employee_full_name}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[var(--color-muted)]">
              Submitted {formatSubmittedAt(row.submitted_at ?? row.created_at)} ·{" "}
              {PLATFORM_LABELS[row.account_platform]} · {handle}
            </p>
          </div>
        </div>

        <a
          href={row.account_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${handle} in a new tab`}
          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-lg px-3 text-[13px] font-semibold text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          View account
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </header>

      <div className="my-6 h-px bg-[var(--color-hairline)]" aria-hidden="true" />

      <div className="flex flex-col gap-3" role="list" aria-label="Submitted metrics vs targets">
        {metrics.map((metric) => {
          const submitted = metricSubmittedValue(row, metric);
          const target = metricTargetValue(row, metric);
          const delta = submitted - target;
          const pill = deltaPill(delta);

          return (
            <div
              key={metric}
              role="listitem"
              className="grid grid-cols-12 items-center gap-3"
            >
              <p className="col-span-12 text-[15px] font-bold text-[var(--color-ink)] sm:col-span-4">
                {METRIC_LABELS[metric]}
              </p>
              <p className="col-span-4 text-[22px] font-extrabold tabular-nums text-[var(--color-ink)] sm:col-span-3">
                {submitted.toLocaleString("en-US")}
              </p>
              <p className="col-span-4 text-[15px] font-medium text-[var(--color-muted)] tabular-nums sm:col-span-2">
                target {target.toLocaleString("en-US")}
              </p>
              <div className="col-span-4 flex justify-end sm:col-span-3">
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-[12px] font-semibold tabular-nums",
                    pill.className,
                  ].join(" ")}
                >
                  {pill.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {row.notes?.trim() ? (
        <div
          className="mt-4 rounded-[14px] bg-[var(--color-cream-tint)]"
          style={{ padding: "16px 20px" }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Employee note
          </p>
          <p className="mt-1 text-[14px] font-normal text-[var(--color-ink)]">
            {row.notes}
          </p>
        </div>
      ) : null}

      {row.is_auto_reset ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-[14px] bg-[var(--color-coral-tint)] px-4 py-3"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-coral)]" aria-hidden="true" />
          <p className="text-[13px] font-medium text-[var(--color-ink)]">
            This submission was auto-zeroed because the employee missed the 24h window. You can
            still apply a deduction if your policy requires one.
          </p>
        </div>
      ) : null}

      {isReadonly ? (
        <div
          className="mt-6 rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-4 py-4"
          aria-live="polite"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]">
            Already reviewed
          </p>
          <p className="mt-1 text-[14px] font-medium text-[var(--color-ink)]">
            Status: {readableStatus(row.qc_status)}
            {row.qc_status === "rejected_with_deduction"
              ? ` · −${Math.round(Number(row.qc_decision_amount)).toLocaleString("en-US")} EGP`
              : ""}
          </p>
          {row.qc_comment ? (
            <p className="mt-2 text-[13px] font-normal text-[var(--color-muted)]">
              “{row.qc_comment}”
            </p>
          ) : null}
        </div>
      ) : (
        <QcDecisionForm growthId={row.growth_id} employeeName={row.employee_full_name} />
      )}
    </section>
  );
}

function readableStatus(status: QcQueueRow["qc_status"]) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected_with_deduction":
      return "Rejected (with deduction)";
    case "rejected_no_deduction":
      return "Rejected (no deduction)";
    default:
      return "Pending";
  }
}
