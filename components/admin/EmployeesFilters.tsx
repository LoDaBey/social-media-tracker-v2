"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";

function chipClass(active: boolean) {
  return `inline-flex cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
    active
      ? "bg-[var(--color-emerald)] text-white"
      : "bg-[var(--color-cream-tint)] text-[var(--color-ink)] hover:bg-[var(--color-hairline)]"
  }`;
}

export function EmployeesFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const statusNorm = sp.get("status") ?? "all";
  const roleNorm = sp.get("role") ?? "all";

  const buildHref = useCallback(
    (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      const qs = p.toString();
      return qs ? `/admin/employees?${qs}` : "/admin/employees";
    },
    [sp]
  );

  const selectClass =
    "h-10 cursor-pointer rounded-lg outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Link
          href={buildHref({ status: undefined })}
          className={chipClass(statusNorm === "all")}
          aria-label="Show active and inactive people"
        >
          All
        </Link>
        <Link
          href={buildHref({ status: "active" })}
          className={chipClass(statusNorm === "active")}
          aria-label="Show active people only"
        >
          Active
        </Link>
        <Link
          href={buildHref({ status: "inactive" })}
          className={chipClass(statusNorm === "inactive")}
          aria-label="Show inactive people only"
        >
          Inactive
        </Link>
      </div>

      <label className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] font-semibold text-[var(--color-muted)]">
        <span className="shrink-0">Role</span>
        <select
          value={roleNorm === "all" ? "" : roleNorm}
          onChange={(e) => {
            const v = e.target.value;
            startTransition(() => {
              router.push(buildHref({ role: v || undefined }));
            });
          }}
          aria-label="Filter by role"
          className={selectClass}
        >
          <option value="">All roles</option>
          <option value="employee">Employees</option>
          <option value="manager">Managers</option>
        </select>
      </label>
    </div>
  );
}

export function EmployeesSearchForm({
  initialQ,
  hiddenStatus,
  hiddenRole,
}: {
  initialQ: string;
  hiddenStatus?: string;
  hiddenRole?: string;
}) {
  return (
    <form
      action="/admin/employees"
      method="get"
      className="flex min-w-0 flex-1 items-center gap-2"
      role="search"
    >
      {hiddenStatus ? <input type="hidden" name="status" value={hiddenStatus} /> : null}
      {hiddenRole ? <input type="hidden" name="role" value={hiddenRole} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={initialQ}
        placeholder="Search name or email..."
        aria-label="Search employees by name or email"
        className="min-w-0 w-full rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      />
      <motion.button
        type="submit"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Run search"
        className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </motion.button>
    </form>
  );
}

export function EmployeesCreateButton() {
  return (
    <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href="/admin/employees/new"
        aria-label="Create a new employee"
        title="Create a new employee"
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[var(--color-emerald)] text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <UserPlus className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
      </Link>
    </motion.div>
  );
}
