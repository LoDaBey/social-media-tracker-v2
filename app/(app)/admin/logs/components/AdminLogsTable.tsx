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

function hasDetails(row: OrbitActionLogRow) {
  return Boolean(row.details && Object.keys(row.details).length > 0);
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
            <th className="px-4 py-3 font-semibold">Summary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = openId === row.id;
            return (
              <tr key={row.id} className="border-b border-[var(--color-hairline)] last:border-b-0">
                <td colSpan={5} className="p-0">
                  <button
                    type="button"
                    aria-label={
                      hasDetails(row)
                        ? expanded
                          ? "Hide action details"
                          : "Show action details"
                        : row.summary
                    }
                    aria-expanded={expanded}
                    onClick={() => {
                      if (!hasDetails(row)) return;
                      setOpenId(expanded ? null : row.id);
                    }}
                    className={[
                      "grid w-full grid-cols-1 gap-1 px-4 py-3 text-left sm:grid-cols-[160px_minmax(140px,1fr)_110px_90px_minmax(180px,2fr)] sm:items-center sm:gap-0",
                      "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                      hasDetails(row)
                        ? "cursor-pointer hover:bg-[var(--color-cream-tint)]"
                        : "cursor-default",
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
                    </span>
                    <span className="capitalize text-[var(--color-muted)]">
                      {row.resource.replaceAll("_", " ")}
                    </span>
                    <span className="min-w-0 text-[var(--color-ink)]">{row.summary}</span>
                  </button>
                  {expanded && hasDetails(row) ? (
                    <pre className="mx-4 mb-3 overflow-x-auto rounded-lg bg-[var(--color-cream-tint)] p-3 text-[12px] text-[var(--color-ink)]">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
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
