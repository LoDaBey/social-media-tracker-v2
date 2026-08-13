"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ADMIN_EMPLOYEE_PANELS,
  adminWorkspaceBackHref,
} from "@/lib/admin-view";
import type { AdminWorkspaceProps } from "@/types/admin";

export function AdminWorkspace({ view, children }: AdminWorkspaceProps) {
  const router = useRouter();
  const backHref = adminWorkspaceBackHref(view);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="inline-flex w-fit cursor-pointer rounded-lg text-[14px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              ← Back
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-extrabold text-[var(--color-ink)] sm:text-[32px]">
              {view.title}
            </h1>
            {view.kind === "employee" ? (
              <span className="rounded-full bg-[var(--color-emerald-tint)] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-emerald)]">
                {view.roleBadge}
              </span>
            ) : null}
          </div>
        </div>

        {view.kind === "employee" ? (
          <label className="flex min-w-[180px] flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
            Section
            <select
              value={view.panel}
              aria-label="Choose employee section"
              onChange={(event) => {
                const panel = event.target.value;
                router.push(`/admin/employees/${view.employeeId}?panel=${panel}`);
              }}
              className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              {ADMIN_EMPLOYEE_PANELS.map((panel) => (
                <option key={panel.id} value={panel.id}>
                  {panel.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>

      {children}
    </div>
  );
}
