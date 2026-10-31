"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { EmployeesToolbarSearchProps } from "@/types/admin";

export function EmployeesToolbarSearch({ initialQ }: EmployeesToolbarSearchProps) {
  const sp = useSearchParams();
  const status = sp.get("status");
  const role = sp.get("role");
  const region = sp.get("region");
  const country = sp.get("country");

  return (
    <form
      action="/admin/employees"
      method="get"
      role="search"
      className="relative min-w-0 flex-1"
    >
      {status ? <input type="hidden" name="status" value={status} /> : null}
      {role ? <input type="hidden" name="role" value={role} /> : null}
      {region ? <input type="hidden" name="region" value={region} /> : null}
      {country ? <input type="hidden" name="country" value={country} /> : null}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={initialQ}
        placeholder="Search name, email, code or account"
        aria-label="Search by name, email, code, or connected account"
        className="h-9 w-full appearance-none rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-[13px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      />
    </form>
  );
}
