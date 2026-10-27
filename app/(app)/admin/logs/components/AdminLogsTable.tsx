"use client";

import { useState } from "react";
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

export function AdminLogsTable({ rows }: AdminLogsTableProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (rows.length === 0) {
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
    </div>
  );
}
