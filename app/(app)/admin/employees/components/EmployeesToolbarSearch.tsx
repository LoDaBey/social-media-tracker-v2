"use client";

import { Search } from "lucide-react";
import { useInstantSearchParams } from "@/hooks/useInstantSearchParams";
import type { EmployeesToolbarSearchProps } from "@/types/admin";

export function EmployeesToolbarSearch({ initialQ }: EmployeesToolbarSearchProps) {
  // Other filters (status, role, region, country) are kept by the shared state.
  const { params, update } = useInstantSearchParams();
  const kept = ["status", "role", "region", "country"]
    .map((name) => [name, params.get(name)] as const)
    .filter(([, value]) => value);

  return (
    <form
      action="/admin/employees"
      method="get"
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(event) => {
        // No full page reload: update the search in place.
        event.preventDefault();
        const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        update({ q: q || null });
      }}
    >
      {/* Fallback if the form is sent before the page is interactive. */}
      {kept.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value ?? ""} />
      ))}
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
