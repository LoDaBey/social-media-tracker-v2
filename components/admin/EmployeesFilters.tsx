"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";
import type { AdminTeamLeadOption } from "@/types/admin";

type Props = {
  teamLeads: AdminTeamLeadOption[];
};

function chipClass(active: boolean) {
  return `inline-flex cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
    active
      ? "bg-[var(--color-emerald)] text-white"
      : "bg-[var(--color-cream-tint)] text-[var(--color-ink)] hover:bg-[var(--color-hairline)]"
  }`;
}

export function EmployeesFilters({ teamLeads }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const statusNorm = sp.get("status") ?? "all";
  const lead = sp.get("lead") ?? "";

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Link
          href={buildHref({ status: undefined })}
          className={chipClass(statusNorm === "all")}
          aria-label="Show all employees"
        >
          All
        </Link>
        <Link
          href={buildHref({ status: "active" })}
          className={chipClass(statusNorm === "active")}
          aria-label="Show active employees only"
        >
          Active
        </Link>
        <Link
          href={buildHref({ status: "inactive" })}
          className={chipClass(statusNorm === "inactive")}
          aria-label="Show inactive employees only"
        >
          Inactive
        </Link>
      </div>

      <label className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] font-semibold text-[var(--color-muted)]">
        <span className="shrink-0">Team lead</span>
        <select
          value={lead}
          onChange={(e) => {
            const v = e.target.value;
            startTransition(() => {
              router.push(buildHref({ lead: v || undefined }));
            });
          }}
          aria-label="Filter employees by team lead"
          className="cursor-pointer rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <option value="">All team leads</option>
          {teamLeads.map((tl) => (
            <option key={tl.id} value={String(tl.id)}>
              {tl.full_name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function EmployeesSearchForm({
  initialQ,
  hiddenStatus,
  hiddenLead,
}: {
  initialQ: string;
  hiddenStatus?: string;
  hiddenLead?: string;
}) {
  return (
    <form
      action="/admin/employees"
      method="get"
      className="flex min-w-0 flex-1 items-center gap-2"
      role="search"
    >
      {hiddenStatus ? <input type="hidden" name="status" value={hiddenStatus} /> : null}
      {hiddenLead ? <input type="hidden" name="lead" value={hiddenLead} /> : null}
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
