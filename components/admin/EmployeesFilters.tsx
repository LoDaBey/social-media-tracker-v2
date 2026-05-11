"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useTransition } from "react";

type TeamLeadOption = { id: number; full_name: string };

type Props = {
  teamLeads: TeamLeadOption[];
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
    <div className="flex flex-col gap-4">
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

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[13px] font-semibold text-[var(--color-muted)]">
          By team lead
        </label>
        <select
          value={lead}
          onChange={(e) => {
            const v = e.target.value;
            startTransition(() => {
              router.push(buildHref({ lead: v || undefined }));
            });
          }}
          aria-label="Filter employees by team lead"
          className="cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <option value="">All team leads</option>
          {teamLeads.map((tl) => (
            <option key={tl.id} value={String(tl.id)}>
              {tl.full_name}
            </option>
          ))}
        </select>
      </div>
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
      className="flex max-w-md flex-1 items-center gap-2"
      role="search"
    >
      {hiddenStatus ? <input type="hidden" name="status" value={hiddenStatus} /> : null}
      {hiddenLead ? <input type="hidden" name="lead" value={hiddenLead} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={initialQ}
        placeholder="Search by name or email..."
        aria-label="Search employees by name or email"
        className="w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      />
      <button
        type="submit"
        aria-label="Run search"
        className="cursor-pointer rounded-lg bg-[var(--color-cream-tint)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        Search
      </button>
    </form>
  );
}
