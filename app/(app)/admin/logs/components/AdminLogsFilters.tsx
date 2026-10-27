"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import {
  ORBIT_LOG_ACTIONS,
  ORBIT_LOG_RESOURCES,
  type AdminLogsFiltersProps,
} from "@/types/logs";

const ACTION_LABELS: Record<(typeof ORBIT_LOG_ACTIONS)[number] | "all", string> = {
  all: "All actions",
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

const RESOURCE_LABELS: Record<(typeof ORBIT_LOG_RESOURCES)[number] | "all", string> = {
  all: "All areas",
  auth: "Auth",
  employee: "Employee",
  account: "Account",
  submission: "Submission",
  qc: "QC",
  setup: "Setup",
  sheets: "Sheets",
  strategy: "Strategy",
  coverage: "Coverage",
};

const selectClass =
  "h-10 cursor-pointer rounded-lg outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function AdminLogsFilters({ q, action, resource }: AdminLogsFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function push(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/logs?${qs}` : "/admin/logs");
    });
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        push({
          q: String(form.get("q") ?? "").trim() || undefined,
          action,
          resource,
        });
      }}
    >
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">Search activity</span>
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
          style={{ insetInlineStart: 12 }}
          aria-hidden="true"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, or summary"
          aria-label="Search activity"
          className="h-10 w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[14px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          style={{ paddingInlineStart: 36, paddingInlineEnd: 12 }}
        />
      </label>
      <select
        aria-label="Filter by action"
        value={action}
        onChange={(event) => push({ q, action: event.target.value, resource })}
        className={selectClass}
      >
        <option value="all">{ACTION_LABELS.all}</option>
        {ORBIT_LOG_ACTIONS.map((value) => (
          <option key={value} value={value}>
            {ACTION_LABELS[value]}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by area"
        value={resource}
        onChange={(event) => push({ q, action, resource: event.target.value })}
        className={selectClass}
      >
        <option value="all">{RESOURCE_LABELS.all}</option>
        {ORBIT_LOG_RESOURCES.map((value) => (
          <option key={value} value={value}>
            {RESOURCE_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
