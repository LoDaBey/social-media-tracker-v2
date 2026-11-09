"use client";

import { useEffect, useRef, useState } from "react";
import { loadAdminLogsPage } from "@/actions/admin-logs";
import { formatCairoDateTime } from "@/lib/cairo-date";
import type { AdminLogsTableProps, OrbitActionLogRow } from "@/types/logs";

const ACTION_LABEL: Record<OrbitActionLogRow["action"], string> = {
  sign_in: "Sign in",
  sign_out: "Sign out",
  password_change: "Password",
  create: "Create",
  update: "Update",
  delete: "Delete",
  import: "Import",
  approve: "Approve",
  reject: "Reject",
  submit: "Submit",
  sync: "Sync",
  spare: "Spare",
  fit_to_plan: "Fit to plan",
  strategy: "Strategy",
};

/** "replacedAccounts" -> "Replaced accounts", "holderId" -> "Holder id". */
function detailLabel(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

function detailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(detailValue).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key} ${detailValue(item)}`)
      .join(" · ");
  }
  return String(value);
}

function failed(row: OrbitActionLogRow) {
  return row.details?.result === "Failed";
}

export function AdminLogsTable({
  rows: firstRows,
  nextCursor: firstCursor,
  filters,
}: AdminLogsTableProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  // Newest 50 come with the page; older ones load as the bottom scrolls into view.
  const [rows, setRows] = useState(firstRows);
  const [cursor, setCursor] = useState(firstCursor);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor || loading || loadError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setLoading(true);
        loadAdminLogsPage(filters, cursor)
          .then((page) => {
            setRows((prev) => [...prev, ...page.rows]);
            setCursor(page.nextCursor);
          })
          .catch(() => setLoadError(true))
          .finally(() => setLoading(false));
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, filters, loading, loadError]);

  const more = cursor ? (
    <div
      ref={sentinelRef}
      className="px-4 py-4 text-center text-[13px] text-[var(--color-muted)]"
      aria-live="polite"
    >
      {loadError ? (
        <button
          type="button"
          onClick={() => setLoadError(false)}
          className="cursor-pointer font-semibold text-[var(--color-emerald)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Could not load more. Try again
        </button>
      ) : (
        "Loading older activity…"
      )}
    </div>
  ) : null;

  if (rows.length === 0 && !cursor) {
    return (
      <p className="py-12 text-center text-[14px] text-[var(--color-muted)]">
        No Orbit actions recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="min-w-full text-left text-[13px]">
        <thead className="border-b border-[var(--color-hairline)] bg-[var(--color-cream-tint)] text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">
          <tr>
            <th className="px-4 py-3 font-semibold">When</th>
            <th className="px-4 py-3 font-semibold">Who</th>
            <th className="px-4 py-3 font-semibold">Action</th>
            <th className="px-4 py-3 font-semibold">Area</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = openId === row.id;
            return (
              <tr key={row.id} className="border-b border-[var(--color-hairline)] last:border-b-0">
                <td colSpan={4} className="p-0">
                  <button
                    type="button"
                    aria-label={
                      expanded ? "Hide action details" : "Show action details"
                    }
                    aria-expanded={expanded}
                    onClick={() => setOpenId(expanded ? null : row.id)}
                    className={[
                      "grid w-full grid-cols-1 gap-1 px-4 py-3 text-left sm:grid-cols-[160px_minmax(140px,2fr)_140px_minmax(90px,1fr)] sm:items-center sm:gap-0",
                      "cursor-pointer outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                    ].join(" ")}
                  >
                    <span className="text-[var(--color-muted)]">
                      {formatCairoDateTime(row.createdAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--color-ink)]">
                        {row.actorName || "Unknown"}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--color-muted)]">
                        {row.actorEmail}
                        {row.actorRole ? ` · ${row.actorRole}` : ""}
                      </span>
                    </span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {ACTION_LABEL[row.action]}
                      {failed(row) ? (
                        <span className="ml-1.5 rounded-md bg-[var(--color-coral)] px-1.5 py-0.5 text-[11px] font-bold text-white">
                          Failed
                        </span>
                      ) : null}
                    </span>
                    <span className="capitalize text-[var(--color-muted)]">
                      {row.resource.replaceAll("_", " ")}
                    </span>
                  </button>
                  {expanded ? (
                    <dl className="mx-4 mb-3 grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-lg bg-[var(--color-cream-tint)] p-3 text-[13px] sm:grid-cols-[160px_minmax(0,1fr)]">
                      <dt className="font-semibold text-[var(--color-muted)]">
                        What happened
                      </dt>
                      <dd className="text-[var(--color-ink)]">{row.summary}</dd>
                      {Object.entries(row.details ?? {}).map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="font-semibold text-[var(--color-muted)]">
                            {detailLabel(key)}
                          </dt>
                          <dd
                            className={
                              key === "result" && value === "Failed"
                                ? "font-bold text-[var(--color-coral)]"
                                : key === "result"
                                  ? "font-bold text-[var(--color-emerald)]"
                                  : "break-words text-[var(--color-ink)]"
                            }
                          >
                            {detailValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {more}
    </div>
  );
}
